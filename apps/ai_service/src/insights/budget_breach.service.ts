import { Queue } from 'bullmq';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import { InsightSeverity, InsightTrigger } from '@fintrack/database/types';
import {
  FCM_NOTIFICATION_JOB,
  FCM_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import {
  BudgetBreachEntry,
  BudgetBreachInsightData,
  InsightsJobPayload,
} from '@fintrack/types/interfaces/insights';
import { FcmNotificationPayload } from '@fintrack/types/interfaces/finance';
import { slugToName } from '@fintrack/utils/format';

import { ModelRessolver } from '../registory/repositories';
import { extractText } from '../registory/llm.utils';
import { isTransientLLMError } from '../registory/retry.utils';
import { BUDGET_BREACH_SYSTEM } from './insights.prompts';
import { SUMMARY_MODEL } from './insights.constants';
import { InsightService } from './insights.service';

@Injectable()
export class BudgetBreachService implements OnModuleInit {
  private readonly logger = new Logger(BudgetBreachService.name);
  private model: BaseChatModel;

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelRessolver: ModelRessolver,
    private readonly insightService: InsightService,
    @InjectQueue(FCM_NOTIFICATION_QUEUE) private readonly fcmQueue: Queue,
  ) {}

  onModuleInit() {
    this.model = this.modelRessolver.getRunnable(SUMMARY_MODEL);
  }

  async run(payload: InsightsJobPayload): Promise<void> {
    const { userId, metadata: entries } = payload;
    if (!userId || !entries?.length) return;

    // Silently drop the job if the user has exhausted their monthly insight quota.
    const allowed = await this.insightService.isInsightAllowed(
      payload.userId!,
      'budget_breach',
    );
    if (!allowed) {
      this.logger.log(
        `[InsightService] Skipping insights — userId=${payload.userId} has reached monthly limit`,
      );
      return;
    }

    // ── Step 1: load budget names for the breached budgets ───────────────────
    const budgets = await this.prisma.budget.findMany({
      where: { id: { in: entries.map((e) => e.budgetId) }, userId },
      select: { id: true, name: true, amount: true },
    });

    // ── Step 2: determine overall severity ───────────────────────────────────
    const newSeverity: 'warning' | 'critical' = entries.some(
      (e) => e.severity === 'critical',
    )
      ? 'critical'
      : 'warning';

    const budgetNameMap = new Map(budgets.map((b) => [b.id, b.name]));
    const budgetAmountMap = new Map(budgets.map((b) => [b.id, b.amount]));
    const topEntry = [...entries].sort(
      (a, b) => b.currentPct - a.currentPct,
    )[0];

    // ── Step 3: generate AI message covering all breached budgets ────────────
    const aiMessage = await this.generateAiMessage(
      entries,
      budgetNameMap,
      budgetAmountMap,
    );

    // ── Step 4: build breach data ────────────────────────────────────────────
    const now = new Date().toISOString();
    const breachData: BudgetBreachInsightData[] = entries.map((e, idx) => ({
      categorySlug: e.categorySlug,
      budgetName: budgetNameMap.get(e.budgetId) ?? slugToName(e.categorySlug),
      severity: e.severity,
      currentPct: e.currentPct,
      threshold: e.threshold,
      updatedAt: now,
      ...(idx === 0 && aiMessage ? { aiMessage } : {}),
    }));

    // ── Step 5: always create a fresh breach insight ─────────────────────────
    // Each breach is its own standalone insight (own summary + severity), never
    // a patch onto the latest insight.
    const topBudgetName =
      budgetNameMap.get(topEntry.budgetId) ?? slugToName(topEntry.categorySlug);

    const created = await this.prisma.aiInsight.create({
      data: {
        userId,
        trigger: InsightTrigger.BUDGET_BREACH,
        severity:
          newSeverity === 'critical'
            ? InsightSeverity.CRITICAL
            : InsightSeverity.WARNING,
        summary:
          aiMessage ??
          `Budget alert: ${topBudgetName} is at ${Math.round(topEntry.currentPct * 100)}%`,
        anomalies: [],
        goalAlerts: [],
        budgetBreach: breachData as any,
      },
    });

    const insightId = created.id;
    this.logger.log(
      `[BudgetBreachService] Created insight ${insightId} for userId=${userId}`,
    );

    await this.insightService.incrementInsightUsage(payload.userId!);

    // Bust the gateway insight cache so the FE sees this new breach insight
    // immediately instead of the stale cached one.
    await this.insightService.invalidateInsightCache(userId);

    // ── Step 6: dispatch FCM ─────────────────────────────────────────────────
    const pct = Math.round(topEntry.currentPct * 100);

    const fcmPayload: FcmNotificationPayload = {
      userId,
      title:
        newSeverity === 'critical' ? 'Budget limit reached' : 'Budget alert',
      body: aiMessage ?? `${topBudgetName} is at ${pct}% of your budget`,
      data: {
        type: 'budget_breach',
        severity: newSeverity,
        insightId,
      },
    };

    await this.fcmQueue
      .add(FCM_NOTIFICATION_JOB, fcmPayload)
      .catch((err) =>
        this.logger.error(
          `[BudgetBreachService] FCM enqueue failed: ${err.message}`,
        ),
      );
  }

  private async generateAiMessage(
    entries: BudgetBreachEntry[],
    budgetNameMap: Map<string, string>,
    budgetAmountMap: Map<string, number>,
  ): Promise<string | undefined> {
    const lines = entries.map((e) => {
      const name = budgetNameMap.get(e.budgetId) ?? slugToName(e.categorySlug);
      const amount = budgetAmountMap.get(e.budgetId) ?? 0;
      const pct = Math.round(e.currentPct * 100);
      const spent =
        amount > 0
          ? `₦${Math.round(amount * e.currentPct).toLocaleString()} of ₦${amount.toLocaleString()}`
          : `${pct}%`;
      return `- ${name}: ${spent} used (${pct}%), threshold ${Math.round(e.threshold * 100)}%, severity: ${e.severity}`;
    });

    const human = `Breached budgets:\n${lines.join('\n')}`;

    try {
      const res = await this.model.invoke([
        new SystemMessage(BUDGET_BREACH_SYSTEM),
        new HumanMessage(human),
      ]);
      return extractText(res.content);
    } catch (err) {
      if (isTransientLLMError(err)) throw err;
      this.logger.warn(
        `[BudgetBreachService] AI message generation failed: ${(err as Error).message}`,
      );
      return undefined;
    }
  }
}
