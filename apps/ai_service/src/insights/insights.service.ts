import { lastValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { Metadata, status } from '@grpc/grpc-js';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  BaseMessage,
  SystemMessage,
  HumanMessage,
} from '@langchain/core/messages';
import { END, START, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { Queue } from 'bullmq';
import dayjs from '@fintrack/utils/date';
import { formatCurrency } from '@fintrack/utils/format';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ClientGrpc, RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import {
  AiInsight,
  InsightSeverity,
  InsightTrigger,
  SnapshotType,
} from '@fintrack/database/types';
import { FINANCE_PACKAGE_NAME } from '@fintrack/types/protos/finance/finance';
import {
  FinanceServiceClient,
  FINANCE_SERVICE_NAME,
} from '@fintrack/types/protos/finance/finance';
import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';
import {
  FCM_NOTIFICATION_JOB,
  FCM_NOTIFICATION_QUEUE,
  INSIGHT_NOTIFICATION_JOB,
  TOKEN_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { FcmNotificationPayload } from '@fintrack/types/interfaces/finance';
import { InsightNotificationEmailPayload } from '@fintrack/types/interfaces/mail.interface';

import { LangraphService } from '../registory/langraph.service';
import { ModelRessolver } from '../registory/repositories';
import { extractText } from '../registory/llm.utils';
import {
  isTransientLLMError,
  isTransientNetworkError,
} from '../registory/retry.utils';
import { InsightState } from './insights.graph';
import { InsightsOracleService } from './insights.oracle.service';
import { createTransactionsTool } from './insights.tools';
import { InsightsJobPayload } from './insights.types';
import { AnalysisSchema, RecommendOutputSchema } from './insights.schemas';
import {
  ANALYSIS_THINK_SYSTEM,
  ANALYSIS_PARSE_SYSTEM,
  CASH_FLOW_SYSTEM,
  RECOMMEND_SYSTEM,
  SUMMARIZE_SYSTEM,
} from './insights.prompts';
import {
  DECISION_MODEL,
  SEVERITY_MAP,
  SUMMARY_MODEL,
  TRIGGER_MAP,
} from './insights.constants';

/**
 * InsightService — orchestrates the LangGraph insights generation pipeline.
 *
 * ## Graph topology
 *
 *   START
 *     └─ load_context
 *          ├─ summarize  ─────────────────────────────────┐
 *          ├─ analysis_think ──[tool calls?]──> tx_tools  ├─ recommend ── END
 *          │    └─[done]──> analysis_parse ───────────────┤
 *          └─ cash_flow ──────────────────────────────────┘
 *
 * ## Tool-calling pattern
 *
 * `analysis_think` uses the decision model with `bindTools([txTool])`.
 * The LLM decides whether to call `fetch_transactions` for raw transaction data.
 * `tx_tools` (ToolNode) executes the call; execution loops back to `analysis_think`.
 * Once the LLM is satisfied, it stops calling tools → conditional edge routes
 * to `analysis_parse` which produces structured `anomalies` + `goalAlerts`.
 *
 * `userId` flows to the tool via `config.configurable` — never as a tool parameter.
 *
 * ## Error strategy (per LangGraph error-handling docs)
 *
 * | Error class                          | Handling                                          |
 * |--------------------------------------|---------------------------------------------------|
 * | Transient (rate limit, network blip) | Rethrow → node `retryPolicy` handles it           |
 * | Non-critical fetch failure           | `Promise.allSettled` + fallback → store nodeErrors |
 * | Unrecoverable LLM error              | Catch + store in `nodeErrors` → default return    |
 * | Critical DB failure (all retries)    | Bubble up → graph fails, BullMQ retries the job   |
 */
@Injectable()
export class InsightService implements OnModuleInit {
  private readonly logger = new Logger(InsightService.name);
  private financeService: FinanceServiceClient;
  /** Gemini 2.5 Pro — reasoning, structured output, analysis + recommendation nodes */
  private decisionModel: BaseChatModel;
  /** Gemini 2.0 Flash — cheap text generation, summarisation nodes */
  private summaryModel: BaseChatModel;

  constructor(
    private readonly prisma: PrismaService,
    private readonly langraph: LangraphService,
    private readonly modelRessolver: ModelRessolver,
    private readonly oracle: InsightsOracleService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(FINANCE_PACKAGE_NAME) private readonly financeClient: ClientGrpc,
    @InjectQueue(FCM_NOTIFICATION_QUEUE) private readonly fcmQueue: Queue,
    @InjectQueue(TOKEN_NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
  ) {}

  onModuleInit() {
    this.financeService =
      this.financeClient.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
    this.decisionModel = this.modelRessolver.getRunnable(DECISION_MODEL);
    this.summaryModel = this.modelRessolver.getRunnable(SUMMARY_MODEL);
  }

  async runGraph(
    payload: InsightsJobPayload,
  ): Promise<typeof InsightState.State> {
    try {
      const graph = this.buildGraph();
      const result = await this.langraph.invoke(
        graph,
        { userId: payload.userId, ...payload.metadata },
        // Pass userId in configurable so the ToolNode can forward it to the
        // fetch_transactions tool at call time — tool never accepts userId as input.
        { configurable: { userId: payload.userId } },
      );
      this.logger.log(
        `Insights graph complete — userId=${payload.userId} trigger=${payload.trigger} severity=${result.severity}`,
      );

      const insight = await this.prisma.aiInsight.create({
        data: {
          userId: payload.userId,
          trigger: TRIGGER_MAP[payload.trigger],
          severity: SEVERITY_MAP[result.severity],
          summary: result.summary,
          anomalies: result.anomalies,
          goalAlerts: result.goalAlerts,
          cashFlowForecast: result.cashFlowForecast ?? null,
          recommendations: result.recommendations as any,
          macroContext: result.macroContext as any,
        },
      });
      await this.redis.del(`insights:${payload.userId}:**`).catch((err) => {
        // log error as no up
        this.logger.error(
          'Redis invalidation failed for insighst',
          JSON.stringify(err),
        );
      });
      // Fire-and-forget — notification failure must not fail the insight job.
      this.dispatchNotification(insight).catch((err) =>
        this.logger.error(`dispatchNotification failed: ${err.message}`),
      );
      return result;
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured',
      });
    }
  }

  // ── Notification dispatch ─────────────────────────────────────────────────

  /**
   * Dispatches FCM push and/or email after an insight is persisted.
   *
   * Routing table:
   *   info/warning + FCM available  → FCM only
   *   info/warning + no FCM         → email only
   *   critical                      → FCM AND email in parallel (each wrapped
   *                                   independently so one failure won't block the other)
   *
   * `notifiedAt` guard prevents re-dispatch on re-runs of the same insight.
   */
  private async dispatchNotification(insight: AiInsight): Promise<void> {
    if (insight.notifiedAt) return;

    const user = await this.prisma.user.findUnique({
      where: { id: insight.userId },
      select: { email: true, firstName: true, fcmDevices: true },
    });

    // early return for misssing user
    if (!user) return;

    const hasFcm = user.fcmDevices.length > 0;
    // InsightSeverity enum → lowercase for payload/template consumption
    const severity = insight.severity.toLowerCase() as
      | 'info'
      | 'warning'
      | 'critical';
    const isCritical = insight.severity === InsightSeverity.CRITICAL;

    const tasks: Promise<void>[] = [];

    if (hasFcm) {
      const fcmPayload: FcmNotificationPayload = {
        userId: insight.userId,
        title: isCritical ? 'Action needed' : 'Financial insight',
        body: insight.summary.slice(0, 140),
        data: {
          type: 'insight',
          insightId: insight.id,
          conversationThreadId: insight.conversationThreadId ?? '',
          severity,
        },
      };
      tasks.push(
        this.fcmQueue
          .add(FCM_NOTIFICATION_JOB, fcmPayload)
          .then(() => undefined)
          .catch((err) =>
            this.logger.error(`FCM enqueue failed: ${err.message}`),
          ),
      );
    }

    // Critical always sends email; non-critical uses email only as FCM fallback
    const shouldEmail = isCritical || !hasFcm;
    if (shouldEmail) {
      const emailPayload: InsightNotificationEmailPayload = {
        email: user.email,
        firstName: user.firstName,
        severity,
        summary: insight.summary,
        insightId: insight.id,
        conversationThreadId: insight.conversationThreadId,
      };
      tasks.push(
        this.notificationQueue
          .add(INSIGHT_NOTIFICATION_JOB, emailPayload)
          .then(() => undefined)
          .catch((err) =>
            this.logger.error(`Email enqueue failed: ${err.message}`),
          ),
      );
    }

    await Promise.all(tasks);

    await this.prisma.aiInsight.update({
      where: { id: insight.id },
      data: { notifiedAt: new Date() },
    });
  }

  // ── Graph builder ─────────────────────────────────────────────────────────

  private buildGraph() {
    // Tool is created once per graph build with prisma bound.
    // userId is injected at call time via config.configurable.
    const txTool = createTransactionsTool(this.prisma);

    const graph = new StateGraph(InsightState)
      .addNode('load_context', this.makeLoadContextNode(), {
        retryPolicy: {
          maxAttempts: 3,
          initialInterval: 1.0,
          backoffFactor: 2,
          retryOn: isTransientNetworkError,
        },
      })
      .addNode('summarize', this.makeSummarizeNode(), {
        retryPolicy: {
          maxAttempts: 2,
          initialInterval: 2.0,
          retryOn: isTransientLLMError,
        },
      })
      .addNode('analysis_think', this.makeAnalysisThinkNode(txTool), {
        retryPolicy: {
          maxAttempts: 2,
          initialInterval: 2.0,
          retryOn: isTransientLLMError,
        },
      })
      // ToolNode executes tool calls emitted by analysis_think.
      // Reads userId from config.configurable, writes ToolMessages to state.messages.
      .addNode('tx_tools', new ToolNode([txTool]))
      .addNode('analysis_parse', this.makeAnalysisParseNode(), {
        retryPolicy: {
          maxAttempts: 2,
          initialInterval: 2.0,
          retryOn: isTransientLLMError,
        },
      })
      .addNode('cash_flow', this.makeCashFlowNode(), {
        retryPolicy: {
          maxAttempts: 2,
          initialInterval: 2.0,
          retryOn: isTransientLLMError,
        },
      })
      .addNode('recommend', this.makeRecommendNode(), {
        retryPolicy: {
          maxAttempts: 2,
          initialInterval: 2.0,
          retryOn: isTransientLLMError,
        },
      })
      // Fan-out from load_context
      .addEdge(START, 'load_context')
      .addEdge('load_context', 'summarize')
      .addEdge('load_context', 'analysis_think')
      .addEdge('load_context', 'cash_flow')
      // Analysis ReAct loop: think → (tool calls?) → tx_tools → think; or → parse
      .addConditionalEdges('analysis_think', this.makeAnalyticsCondition())
      .addEdge('tx_tools', 'analysis_think')
      // Fan-in: all three branches must reach recommend before it fires
      .addEdge('summarize', 'recommend')
      .addEdge('analysis_parse', 'recommend')
      .addEdge('cash_flow', 'recommend')
      .addEdge('recommend', END);

    return this.langraph.compile(graph);
  }

  // ── Node factories ────────────────────────────────────────────────────────

  /**
   * load_context — loads all non-transaction context into state.
   *
   * Transactions are NOT loaded here. The analysis branch fetches them
   * on-demand via the fetch_transactions tool if the LLM decides it needs them.
   *
   * Critical fetches (Prisma + oracle) use Promise.all — failures throw and
   * the retryPolicy handles them. Non-critical gRPC calls use Promise.allSettled.
   */
  private makeLoadContextNode() {
    return async (state: typeof InsightState.State) => {
      const { userId } = state;
      const meta = this.buildMeta(userId);
      const now = dayjs();

      // ── Critical: must succeed (or trigger retry policy) ────────────────
      const [historicalInsights, balance, macroContext] = await Promise.all([
        this.prisma.aiInsight.findMany({
          where: { userId },
          orderBy: { generatedAt: 'desc' },
          take: 3,
        }),
        this.prisma.userBalance.findUnique({ where: { userId } }),
        this.oracle.getMacroContext(), // always resolves (has internal fallback)
      ]);

      // ── Non-critical: degrade gracefully on failure ──────────────────────
      const [goalsRes, budgetsRes, recurringsRes, splitsRes, snapshotRes] =
        await Promise.allSettled([
          lastValueFrom(
            this.financeService.getGoals(
              { status: ['ACTIVE'], priority: [] },
              meta,
            ),
          ),
          lastValueFrom(
            this.financeService.getBudgets(
              { month: now.month(), year: now.year() },
              meta,
            ),
          ),
          lastValueFrom(
            this.financeService.getRecurrings(
              { isActive: true, type: [], frequency: [] },
              meta,
            ),
          ),
          lastValueFrom(
            this.financeService.getSplits(
              { status: ['OPEN'], page: 1, limit: 100 },
              meta,
            ),
          ),
          this.prisma.analyticsSnapshot.findFirst({
            where: { userId, type: SnapshotType.MONTHLY_SUMMARY },
            orderBy: { computedAt: 'desc' },
          }),
        ]);

      const nodeErrors: Record<string, string> = {};
      const settled = <T>(
        res: PromiseSettledResult<T>,
        fallback: T,
        key: string,
      ): T => {
        if (res.status === 'rejected') {
          const msg = (res.reason as Error)?.message ?? 'unknown error';
          nodeErrors[`load_context.${key}`] = msg;
          this.logger.warn(`load_context: ${key} fetch failed — ${msg}`);
          return fallback;
        }
        return res.value;
      };

      const goals =
        settled(goalsRes, { goals: [] } as any, 'goals').goals ?? [];
      const budgets =
        settled(budgetsRes, { budgets: [] } as any, 'budgets').budgets ?? [];
      const recurringItems =
        settled(recurringsRes, { recurrings: [] } as any, 'recurrings')
          .recurrings ?? [];
      const splits =
        settled(splitsRes, { splits: [] } as any, 'splits').splits ?? [];
      const snapshot = settled(snapshotRes, null as any, 'snapshot');

      return {
        historicalInsights,
        analyticsSnapshot: snapshot?.data ?? null,
        goals,
        budgets,
        recurringItems,
        splits,
        macroContext,
        userBalance: balance
          ? {
              netBalance: balance.netBalance.toNumber(),
              totalIncome: balance.totalIncome.toNumber(),
              totalExpense: balance.totalExpense.toNumber(),
              monthlyIncome: balance.monthlyIncome.toNumber(),
              monthlyExpense: balance.monthlyExpense.toNumber(),
              monthYear: balance.monthYear,
            }
          : null,
        ...(Object.keys(nodeErrors).length ? { nodeErrors } : {}),
      };
    };
  }

  /**
   * summarize — prose summary of the financial month.
   * Uses summary model (cheap). Transient → rethrow. Unrecoverable → nodeErrors.
   */
  private makeSummarizeNode() {
    return async (state: typeof InsightState.State) => {
      const {
        userBalance,
        analyticsSnapshot,
        historicalInsights,
        macroContext,
      } = state;
      if (!userBalance) return { summary: '' };

      const topCategories = (
        (analyticsSnapshot as any)?.topCategories ?? []
      ).slice(0, 3);
      const prevSummary = (historicalInsights[0] as any)?.summary ?? null;

      const human = [
        `Month: ${userBalance.monthYear}`,
        `Balance: ${formatCurrency(userBalance.netBalance)} | Income: ${formatCurrency(userBalance.monthlyIncome)} | Expenses: ${formatCurrency(userBalance.monthlyExpense)}`,
        `Top spend categories: ${topCategories.map((c: any) => `${c.slug} ${formatCurrency(c.total)}`).join(', ') || 'none recorded'}`,
        `NGN/USD rate: ${macroContext.ngnUsdRate} | Food CPI YoY: ${macroContext.foodCpiYoY}%`,
        prevSummary ? `Previous month summary: "${prevSummary}"` : '',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        const res = await this.summaryModel.invoke([
          new SystemMessage(SUMMARIZE_SYSTEM),
          new HumanMessage(human),
        ]);
        return { summary: extractText(res.content) };
      } catch (err) {
        if (isTransientLLMError(err)) throw err;
        this.logger.error('summarize_node unrecoverable error', err);
        return {
          summary: '',
          nodeErrors: { summarize: (err as Error).message },
        };
      }
    };
  }

  /**
   * analysis_think — think phase of the analysis ReAct loop.
   *
   * The decision model is bound with the fetch_transactions tool.
   * On the first call `state.messages` is empty, so the full context HumanMessage
   * is prepended. On subsequent calls (after tool execution), the accumulated
   * messages (HumanMessage + AIMessage(tool_calls) + ToolMessage(results)) are
   * included so the model has full context when deciding its next step.
   *
   * `analysisCondition` routes output:
   *   - AI message has tool calls  → tx_tools (executes fetch_transactions)
   *   - No tool calls             → analysis_parse (structured output)
   */
  private makeAnalysisThinkNode(
    txTool: ReturnType<typeof createTransactionsTool>,
  ) {
    // Bind tool to model — the LLM can call fetch_transactions if it judges
    // that budget/snapshot data is insufficient for confident anomaly detection.
    // bindTools is optional on BaseChatModel but present on all concrete LLM implementations
    const agentModel = this.decisionModel.bindTools!([txTool]);

    return async (state: typeof InsightState.State) => {
      const {
        messages,
        budgets,
        goals,
        analyticsSnapshot,
        macroContext,
        recurringItems,
        userBalance,
      } = state;

      const isFirstCall = messages.length === 0;
      const newMessages: BaseMessage[] = [];

      if (isFirstCall) {
        const today = dayjs();
        const goalProgress = (analyticsSnapshot as any)?.goalProgress ?? [];
        const utilisation = (analyticsSnapshot as any)?.budgetUtilisation ?? [];

        const context = [
          `Date: ${today.format('YYYY-MM-DD')} (day ${today.date()} of ${today.daysInMonth()}, ${today.format('MMMM YYYY')})`,
          `Active budgets: ${JSON.stringify(budgets)}`,
          `Budget utilisation: ${JSON.stringify(utilisation)}`,
          `Active goals: ${JSON.stringify(goals)}`,
          `Goal progress snapshot: ${JSON.stringify(goalProgress)}`,
          `Recurring items: ${JSON.stringify(recurringItems)}`,
          `Macro: NGN/USD ${macroContext.ngnUsdRate}, Food CPI YoY ${macroContext.foodCpiYoY}%, CBN rate ${macroContext.cbnPolicyRate}%`,
          userBalance
            ? `Balance: ${formatCurrency(userBalance.netBalance)} | Monthly income: ${formatCurrency(userBalance.monthlyIncome)} | Monthly expense: ${formatCurrency(userBalance.monthlyExpense)}`
            : 'Balance data unavailable.',
        ]
          .filter(Boolean)
          .join('\n');

        newMessages.push(new HumanMessage(context));
      }

      const allMessages: BaseMessage[] = [
        new SystemMessage(ANALYSIS_THINK_SYSTEM),
        ...messages,
        ...newMessages,
      ];

      try {
        const res = await agentModel.invoke(allMessages);
        // Append both the context message (first call only) and the AI response
        return { messages: [...newMessages, res] };
      } catch (err) {
        if (isTransientLLMError(err)) throw err;
        this.logger.error('analysis_think unrecoverable error', err);
        // Graceful degradation: return empty analysis + error, condition routes to parse
        return {
          anomalies: [],
          goalAlerts: [],
          nodeErrors: { analysis_think: (err as Error).message },
        };
      }
    };
  }

  /**
   * analysis_parse — structured output phase.
   *
   * Reads the full message history (may include ToolMessages with transaction
   * data from tx_tools) and produces structured anomalies + goalAlerts.
   */
  private makeAnalysisParseNode() {
    const parseModel = this.decisionModel.withStructuredOutput(AnalysisSchema, {
      strict: true,
    });

    return async (state: typeof InsightState.State) => {
      const { messages } = state;

      if (!messages.length) {
        return { anomalies: [], goalAlerts: [] };
      }

      try {
        const res = (await parseModel.invoke([
          new SystemMessage(ANALYSIS_PARSE_SYSTEM),
          ...messages,
        ])) as any;
        return {
          anomalies: res.anomalies ?? [],
          goalAlerts: res.goalAlerts ?? [],
        };
      } catch (err) {
        if (isTransientLLMError(err)) throw err;
        this.logger.error('analysis_parse unrecoverable error', err);
        return {
          anomalies: [],
          goalAlerts: [],
          nodeErrors: { analysis_parse: (err as Error).message },
        };
      }
    };
  }

  /**
   * cash_flow — projects available cash for the rest of the month.
   * Uses summary model. Transient → rethrow. Unrecoverable → nodeErrors + ''.
   */
  private makeCashFlowNode() {
    return async (state: typeof InsightState.State) => {
      const { userBalance, recurringItems, splits } = state;
      if (!userBalance) return { cashFlowForecast: '' };

      const today = dayjs();
      const human = [
        `Current net balance: ${formatCurrency(userBalance.netBalance)}`,
        `Monthly income: ${formatCurrency(userBalance.monthlyIncome)}`,
        `Days remaining in month: ${today.daysInMonth() - today.date()}`,
        `Recurring items (bills/subscriptions): ${JSON.stringify(recurringItems)}`,
        `Outstanding bill splits: ${JSON.stringify(splits)}`,
      ].join('\n');

      try {
        const res = await this.summaryModel.invoke([
          new SystemMessage(CASH_FLOW_SYSTEM),
          new HumanMessage(human),
        ]);
        return { cashFlowForecast: extractText(res.content) };
      } catch (err) {
        if (isTransientLLMError(err)) throw err;
        this.logger.error('cash_flow_node unrecoverable error', err);
        return {
          cashFlowForecast: '',
          nodeErrors: { cash_flow: (err as Error).message },
        };
      }
    };
  }

  /**
   * recommend — fan-in node; reads all prior analysis + nodeErrors to produce
   * ranked recommendations + severity. Transient → rethrow. Unrecoverable → safe defaults.
   */
  private makeRecommendNode() {
    const structuredModel = this.decisionModel.withStructuredOutput(
      RecommendOutputSchema,
      { strict: true },
    );

    return async (state: typeof InsightState.State) => {
      const {
        summary,
        anomalies,
        goalAlerts,
        cashFlowForecast,
        budgets,
        userBalance,
        macroContext,
        nodeErrors,
      } = state;

      const skippedAnalyses = Object.keys(nodeErrors ?? {});

      const human = [
        summary ? `Financial summary: ${summary}` : '',
        anomalies.length
          ? `Anomalies: ${anomalies.join(' | ')}`
          : 'No anomalies detected.',
        goalAlerts.length
          ? `Goal alerts: ${goalAlerts.join(' | ')}`
          : 'All goals on track.',
        cashFlowForecast ? `Cash flow: ${cashFlowForecast}` : '',
        `Active budgets: ${JSON.stringify(budgets)}`,
        userBalance
          ? `Balance ${formatCurrency(userBalance.netBalance)} | Income ${formatCurrency(userBalance.monthlyIncome)} | Expense ${formatCurrency(userBalance.monthlyExpense)}`
          : '',
        `NGN/USD: ${macroContext.ngnUsdRate} | Food CPI: ${macroContext.foodCpiYoY}% | CBN rate: ${macroContext.cbnPolicyRate}%`,
        skippedAnalyses.length
          ? `Note: the following data was unavailable (service errors): ${skippedAnalyses.join(', ')}. Base recommendations only on what is provided above.`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        const res = (await structuredModel.invoke([
          new SystemMessage(RECOMMEND_SYSTEM),
          new HumanMessage(human),
        ])) as any;
        return {
          recommendations: res.recommendations ?? [],
          severity: res.severity ?? ('info' as const),
        };
      } catch (err) {
        if (isTransientLLMError(err)) throw err;
        this.logger.error('recommend_node unrecoverable error', err);
        return {
          recommendations: [],
          severity: 'info' as const,
          nodeErrors: { recommend: (err as Error).message },
        };
      }
    };
  }

  /**
   * Conditional edge for the analysis ReAct loop.
   * Routes to tx_tools when the last AI message contains tool calls,
   * otherwise proceeds to analysis_parse for structured output.
   */

  private makeAnalyticsCondition() {
    return function analysisCondition(
      state: typeof InsightState.State,
    ): 'tx_tools' | 'analysis_parse' {
      const last = state.messages[state.messages.length - 1];
      const toolCalls = (last as any)?.tool_calls;
      return Array.isArray(toolCalls) && toolCalls.length > 0
        ? 'tx_tools'
        : 'analysis_parse';
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildMeta(userId: string): Metadata {
    const meta = new Metadata();
    meta.set('x-user-id', userId);
    return meta;
  }
}
