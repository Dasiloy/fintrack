import { lastValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { Metadata, status } from '@grpc/grpc-js';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  BaseMessage,
  SystemMessage,
  HumanMessage,
} from '@langchain/core/messages';
import { END, Runtime, START, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { Queue } from 'bullmq';
import dayjs, { getTimeFromNow } from '@fintrack/utils/date';
import { formatCurrency } from '@fintrack/utils/format';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ClientGrpc, RpcException } from '@nestjs/microservices';

import { slugToName } from '@fintrack/utils/format';
import { PrismaService } from '@fintrack/database/service';
import {
  AiInsight,
  InsightSeverity,
  SnapshotType,
  UsageFeature,
} from '@fintrack/database/types';
import { PLAN_LIMITS, Usage } from '@fintrack/types/constants/plan.constants';
import { FINANCE_PACKAGE_NAME } from '@fintrack/types/protos/finance/finance';
import {
  FinanceServiceClient,
  FINANCE_SERVICE_NAME,
} from '@fintrack/types/protos/finance/finance';
import {
  REDIS_CLIENT,
  INSIGHTS_CACHE_PREFIX,
  INSIGHTS_UNREAD_CACHE_PREFIX,
} from '@fintrack/types/constants/redis.costants';
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
import {
  InsightsContext,
  InsightsJobPayload,
  MacroContext,
} from './insights.types';
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
  /** Decision model with the fetch_transactions tool bound once at init. */
  private decisionAgentModel: ReturnType<
    NonNullable<BaseChatModel['bindTools']>
  >;
  /** Gemini 2.0 Flash — cheap text generation, summarisation nodes */
  private summaryModel: BaseChatModel;
  /** fetch_transactions tool with prisma bound; shared by the model and ToolNode. */
  private txTool: ReturnType<typeof createTransactionsTool>;

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

    // Tool + bound model built once at init (prisma is stable for the process).
    // bindTools is optional on BaseChatModel but present on all concrete LLMs.
    this.txTool = createTransactionsTool(this.prisma);
    this.decisionAgentModel = this.decisionModel.bindTools!([this.txTool]);
  }

  async runGraph(
    payload: InsightsJobPayload,
  ): Promise<typeof InsightState.State | null> {
    // Silently drop the job if the user has exhausted their monthly insight quota.
    const allowed = await this.isInsightAllowed(
      payload.userId!,
      payload.trigger,
    );
    if (!allowed) {
      this.logger.log(
        `[InsightService] Skipping insights — userId=${payload.userId} has reached monthly limit`,
      );
      return null;
    }

    try {
      const graph = this.buildGraph();
      const result = await this.langraph.invoke<
        typeof InsightState.State,
        never,
        InsightsContext
      >(
        graph,
        { trigger: payload.trigger },
        // Pass userId as per-run context — nodes read it via runtime.context and
        // the ToolNode forwards it to fetch_transactions via config.context.
        { context: { userId: payload.userId! } },
      );
      this.logger.log(
        `Insights graph complete — userId=${payload.userId} trigger=${payload.trigger} severity=${result.severity}`,
      );

      const insight = await this.prisma.aiInsight.create({
        data: {
          userId: payload.userId!,
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

      // Increment monthly usage — fire-and-forget, never block the happy path.
      void this.incrementInsightUsage(payload.userId!);

      await this.invalidateInsightCache(payload.userId!);
      // Fire-and-forget — notification failure must not fail the insight job.
      this.dispatchNotification(insight, {
        skipEmail: payload.trigger === 'daily',
      }).catch((err) =>
        this.logger.error(`dispatchNotification failed: ${err.message}`),
      );
      return result;
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      if (payload.trigger === 'manual') {
        await this.fcmQueue
          .add(FCM_NOTIFICATION_JOB, {
            userId: payload.userId!,
            title: 'Manual Isnight Failed',
            body: 'There was an error generating your manual insght, Please try again later!',
            data: {
              type: 'insight',
            },
          } satisfies FcmNotificationPayload)
          .then(() => undefined)
          .catch((err) =>
            this.logger.error(`FCM enqueue failed: ${err.message}`),
          );
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured',
      });
    }
  }

  // ── Plan limit helpers ────────────────────────────────────────────────────

  async isInsightAllowed(
    userId: string,
    trigger: InsightsJobPayload['trigger'],
  ): Promise<boolean> {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId },
      select: {
        plan: true,
        user: {
          select: {
            fcmDevices: {
              select: { id: true },
            },
            setting: {
              select: {
                dailyInsightsEnabled: true,
                budgetInsightsEnabled: true,
              },
            },
          },
        },
      },
    });

    // No sub - early return
    if (!sub) return false;

    const limit = PLAN_LIMITS['FREE'][
      Usage.AI_INSIGHTS_QUERIES_PER_MONTH
    ] as number;

    const tracker = await this.prisma.usageTracker.findFirst({
      where: { userId, feature: UsageFeature.AI_INSIGHTS_QUERIES },
      select: { count: true },
    });

    if (!tracker) return false;

    const hasPriv = tracker.count < limit;

    if (trigger === 'manual') {
      // send fcm notification if has priv is false
      if (!hasPriv && sub.user.fcmDevices.length > 0) {
        await this.fcmQueue
          .add(FCM_NOTIFICATION_JOB, {
            userId,
            title: 'Manual Isnight Limit Reached',
            body: 'You have exhausted your ai insghts queries this month. Upgrade to Pro to get unlimited insighst',
            data: {
              type: 'insight',
              status: 'Limit Exceeded',
            },
          } satisfies FcmNotificationPayload)
          .then(() => undefined)
          .catch((err) =>
            this.logger.error(`FCM enqueue failed: ${err.message}`),
          );
      }
      return hasPriv;
    }

    if (trigger === 'budget_breach') {
      return hasPriv && !!sub.user.setting?.budgetInsightsEnabled;
    }

    if (trigger === 'daily') {
      return hasPriv && !!sub.user.setting?.dailyInsightsEnabled;
    }
    return hasPriv;
  }

  async incrementInsightUsage(userId: string): Promise<void> {
    await this.prisma.usageTracker.updateMany({
      where: { userId, feature: UsageFeature.AI_INSIGHTS_QUERIES },
      data: { count: { increment: 1 } },
    });
  }

  /**
   * Invalidates the API-gateway insight caches for a user after a new insight
   * is persisted, so the next read serves the fresh row instead of the stale
   * cached one. Deletes both the latest-insight key (`insights:{userId}`) and
   * the unread-count key (`insights_unread:{userId}`). Fire-and-forget: a Redis
   * failure must never fail the insight job.
   */
  async invalidateInsightCache(userId: string): Promise<void> {
    await this.redis
      .del(
        `${INSIGHTS_CACHE_PREFIX}:${userId}`,
        `${INSIGHTS_UNREAD_CACHE_PREFIX}:${userId}`,
      )
      .catch((err) =>
        this.logger.error(
          'Redis invalidation failed for insights',
          JSON.stringify(err),
        ),
      );
  }

  /**
   * Formats macro context for a prompt, omitting any field whose value is null
   * (no live data). Returns an empty string when nothing is available, so the
   * line is dropped by the surrounding `.filter(Boolean)`.
   */
  private formatMacroContext(macro: MacroContext): string {
    const parts: string[] = [];
    if (macro.ngnUsdRate !== null) parts.push(`NGN/USD ${macro.ngnUsdRate}`);
    if (macro.foodCpiYoY !== null) {
      parts.push(`Food CPI YoY ${macro.foodCpiYoY}%`);
    }
    if (macro.cbnPolicyRate !== null) {
      parts.push(`CBN rate ${macro.cbnPolicyRate}%`);
    }
    return parts.length ? `Macro: ${parts.join(', ')}` : '';
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
  private async dispatchNotification(
    insight: AiInsight,
    options?: { skipEmail?: boolean },
  ): Promise<void> {
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

    // Critical always sends email; non-critical uses email only as FCM fallback.
    // Daily trigger suppresses email entirely (FCM-only by design).
    const shouldEmail = (isCritical || !hasFcm) && !options?.skipEmail;
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
    // Tool + bound model are created once in onModuleInit.
    // userId is injected at call time via config.context.
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
      .addNode('analysis_think', this.makeAnalysisThinkNode(), {
        retryPolicy: {
          maxAttempts: 2,
          initialInterval: 2.0,
          retryOn: isTransientLLMError,
        },
      })
      // ToolNode executes tool calls emitted by analysis_think.
      // Reads userId from config.context, writes ToolMessages to state.messages.
      .addNode('tx_tools', new ToolNode([this.txTool]))
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
    return async (_state: typeof InsightState.State, runtime: Runtime) => {
      // userId is per-run context, not graph state.
      const userId = (runtime.context as InsightsContext | undefined)?.userId;
      if (!userId) throw new Error('load_context: userId missing from context');
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
        this.oracle.getMacroContext(), // read-through cache; fields may be null when live data is unavailable
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

      const historicalSummaries = historicalInsights
        .map((h: any) => h.summary as string)
        .filter(Boolean);

      const historicalAnomalies = historicalInsights.flatMap(
        (h: any) => (Array.isArray(h.anomalies) ? h.anomalies : []) as string[],
      );

      const historicalRecommendations = historicalInsights.flatMap((h: any) =>
        (Array.isArray(h.recommendations) ? h.recommendations : []).map(
          (r: any) => r.text as string,
        ),
      );

      const lastInsight = historicalInsights[0] as any;
      const insightGap: string = lastInsight?.generatedAt
        ? getTimeFromNow(new Date(lastInsight.generatedAt))
        : 'first insight';

      return {
        historicalInsights,
        historicalSummaries,
        historicalAnomalies,
        historicalRecommendations,
        insightGap,
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
        historicalSummaries,
        macroContext,
        trigger,
        insightGap,
      } = state;
      if (!userBalance) return { summary: '' };

      const today = dayjs();
      const topCategories = (
        (analyticsSnapshot as any)?.topCategories ?? []
      ).slice(0, 3);

      const systemPrompt = SUMMARIZE_SYSTEM.replace(
        '{historicalSummaries}',
        historicalSummaries.length
          ? historicalSummaries.map((s, i) => `${i + 1}. "${s}"`).join('\n')
          : '(none yet)',
      );

      const human = [
        `Today: ${today.format('YYYY-MM-DD')} (day ${today.date()} of ${today.daysInMonth()}, ${today.format('MMMM YYYY')})`,
        `Trigger: ${trigger}`,
        `Last insight generated: ${insightGap}`,
        `Balance: ${formatCurrency(userBalance.netBalance)} | Monthly income so far: ${formatCurrency(userBalance.monthlyIncome)} | Monthly expenses so far: ${formatCurrency(userBalance.monthlyExpense)}`,
        topCategories.length > 0
          ? `Top spend categories this month: ${topCategories.map((c: any) => `${c.name ?? slugToName(c.slug)}: ${formatCurrency(c.total)} (${c.transactionCount ?? 0} transactions)`).join('; ')}`
          : 'Top spend categories this month: none recorded yet',
        this.formatMacroContext(macroContext),
      ]
        .filter(Boolean)
        .join('\n');

      try {
        const res = await this.summaryModel.invoke([
          new SystemMessage(systemPrompt),
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
  private makeAnalysisThinkNode() {
    // Uses the decision model with fetch_transactions already bound at init —
    // the LLM can call it if budget/snapshot data is insufficient for confident
    // anomaly detection.
    const agentModel = this.decisionAgentModel;

    return async (state: typeof InsightState.State) => {
      const {
        messages,
        budgets,
        goals,
        analyticsSnapshot,
        macroContext,
        recurringItems,
        userBalance,
        historicalAnomalies,
        trigger,
        insightGap,
      } = state;

      const anomalyContext = historicalAnomalies.length
        ? historicalAnomalies.map((a, i) => `${i + 1}. ${a}`).join('\n')
        : '(none yet)';

      const analysisThinkSystem = ANALYSIS_THINK_SYSTEM.replace(
        '{historicalAnomalies}',
        anomalyContext,
      );

      const isFirstCall = messages.length === 0;
      const newMessages: BaseMessage[] = [];

      if (isFirstCall) {
        const today = dayjs();
        const goalProgress = (analyticsSnapshot as any)?.goalProgress ?? [];
        const utilisation = (analyticsSnapshot as any)?.budgetUtilisation ?? [];

        // Build lookup maps so analytics-snapshot entries can resolve names
        const goalNameMap = new Map(
          goals.map((g: any) => [g.id, g.name as string]),
        );
        const budgetCatMap = new Map(
          budgets.map((b: any) => [
            b.category?.slug,
            b.category?.name as string,
          ]),
        );

        // Clean entities — strip all IDs, slugs, and internal fields
        const cleanBudgets = budgets.map((b: any) => ({
          name: b.name,
          category: b.category?.name ?? slugToName(b.category?.slug ?? ''),
          limit: formatCurrency(b.amount),
          spent: formatCurrency(Number(b.spent) || 0),
          utilisation:
            b.amount > 0
              ? `${Math.round((Number(b.spent) / b.amount) * 100)}%`
              : '0%',
          alertAt: `${Math.round(b.alertThreshold * 100)}%`,
          period: (b.period as string)?.toLowerCase(),
        }));

        const cleanUtilisation = utilisation.map((u: any) => ({
          category:
            budgetCatMap.get(u.categorySlug) ?? slugToName(u.categorySlug),
          budget: formatCurrency(u.budgeted),
          spent: formatCurrency(u.spent),
          utilisation: `${Math.round(u.pct * 100)}%`,
          status:
            u.pct >= 1
              ? 'OVER BUDGET'
              : u.pct >= 0.8
                ? 'NEAR LIMIT'
                : 'within limit',
        }));

        const cleanGoals = goals.map((g: any) => ({
          name: g.name,
          target: formatCurrency(g.targetAmount),
          saved: formatCurrency(g.contributedAmount ?? 0),
          deadline: g.targetDate,
          paceStatus: g.paceStatus ?? g.status,
          monthsLeft: g.monthsLeft,
        }));

        const cleanGoalProgress = goalProgress.map((gp: any) => ({
          goal: goalNameMap.get(gp.goalId) ?? 'Unknown goal',
          target: formatCurrency(gp.targetAmount),
          saved: formatCurrency(gp.savedAmount),
          progress: `${Math.round(gp.pct * 100)}%`,
        }));

        const cleanRecurrings = recurringItems.map((r: any) => ({
          name: r.name,
          category: r.category?.name ?? slugToName(r.category?.slug ?? ''),
          amount: formatCurrency(r.amount),
          type: (r.type as string)?.toLowerCase(),
          frequency: (r.frequency as string)?.toLowerCase(),
          merchant: r.merchant || undefined,
          nextDue: r.nextRunAt
            ? dayjs(r.nextRunAt).format('DD MMM')
            : undefined,
        }));

        const context = [
          `Date: ${today.format('YYYY-MM-DD')} (day ${today.date()} of ${today.daysInMonth()}, ${today.format('MMMM YYYY')})`,
          `Trigger: ${trigger} | Last insight: ${insightGap}`,
          `Active budgets: ${JSON.stringify(cleanBudgets)}`,
          `Budget utilisation: ${JSON.stringify(cleanUtilisation)}`,
          `Active goals: ${JSON.stringify(cleanGoals)}`,
          `Goal progress: ${JSON.stringify(cleanGoalProgress)}`,
          `Recurring items: ${JSON.stringify(cleanRecurrings)}`,
          this.formatMacroContext(macroContext),
          userBalance
            ? `Balance: ${formatCurrency(userBalance.netBalance)} | Monthly income: ${formatCurrency(userBalance.monthlyIncome)} | Monthly expense: ${formatCurrency(userBalance.monthlyExpense)}`
            : 'Balance data unavailable.',
        ]
          .filter(Boolean)
          .join('\n');

        newMessages.push(new HumanMessage(context));
      }

      const allMessages: BaseMessage[] = [
        new SystemMessage(analysisThinkSystem),
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
      const { messages, historicalAnomalies } = state;

      if (!messages.length) {
        return { anomalies: [], goalAlerts: [] };
      }

      const anomalyContext = historicalAnomalies.length
        ? historicalAnomalies.map((a, i) => `${i + 1}. ${a}`).join('\n')
        : '(none yet)';

      const analysisParseSystem = ANALYSIS_PARSE_SYSTEM.replace(
        '{historicalAnomalies}',
        anomalyContext,
      );

      try {
        const res = (await parseModel.invoke([
          new SystemMessage(analysisParseSystem),
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

      const cleanRecurrings = recurringItems.map((r: any) => ({
        name: r.name,
        category: r.category?.name ?? slugToName(r.category?.slug ?? ''),
        amount: formatCurrency(r.amount),
        type: (r.type as string)?.toLowerCase(),
        frequency: (r.frequency as string)?.toLowerCase(),
        merchant: r.merchant || undefined,
        nextDue: r.nextRunAt ? dayjs(r.nextRunAt).format('DD MMM') : undefined,
      }));

      const cleanSplits = splits.map((s: any) => ({
        name: s.name,
        totalAmount: formatCurrency(s.amount),
        outstanding: formatCurrency(s.amount - (s.totalPaid ?? 0)),
        status: (s.status as string)?.toLowerCase().replace(/_/g, ' '),
      }));

      const human = [
        `Current net balance: ${formatCurrency(userBalance.netBalance)}`,
        `Monthly income so far: ${formatCurrency(userBalance.monthlyIncome)}`,
        `Days remaining in month: ${today.daysInMonth() - today.date()}`,
        `Recurring items (bills/subscriptions): ${JSON.stringify(cleanRecurrings)}`,
        `Outstanding bill splits: ${JSON.stringify(cleanSplits)}`,
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
        historicalRecommendations,
      } = state;

      const skippedAnalyses = Object.keys(nodeErrors ?? {});

      const recommendSystem = RECOMMEND_SYSTEM.replace(
        '{historicalRecommendations}',
        historicalRecommendations.length
          ? historicalRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
          : '(none yet)',
      );

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
        this.formatMacroContext(macroContext),
        skippedAnalyses.length
          ? `Note: the following data was unavailable (service errors): ${skippedAnalyses.join(', ')}. Base recommendations only on what is provided above.`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        const res = (await structuredModel.invoke([
          new SystemMessage(recommendSystem),
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
