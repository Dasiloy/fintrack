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

import { ModelRessolver } from '../registory/repositories';
import { extractText } from '../registory/llm.utils';
import { isTransientLLMError } from '../registory/retry.utils';
import { BUDGET_BREACH_SYSTEM } from './insights.prompts';
import { SUMMARY_MODEL } from './insights.constants';

const SEVERITY_RANK: Record<string, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

@Injectable()
export class BudgetBreachService implements OnModuleInit {
  private readonly logger = new Logger(BudgetBreachService.name);
  private model: BaseChatModel;

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelRessolver: ModelRessolver,
    @InjectQueue(FCM_NOTIFICATION_QUEUE) private readonly fcmQueue: Queue,
  ) {}

  onModuleInit() {
    this.model = this.modelRessolver.getRunnable(SUMMARY_MODEL);
  }

  async run(payload: InsightsJobPayload): Promise<void> {
    const { userId, metadata: entries } = payload;
    if (!userId || !entries?.length) return;

    // ── Step 1: load latest insight + budget names in parallel ───────────────
    const [existingInsight, budgets] = await Promise.all([
      this.prisma.aiInsight.findFirst({
        where: { userId },
        orderBy: { generatedAt: 'desc' },
        select: { id: true, budgetBreach: true, severity: true },
      }),
      this.prisma.budget.findMany({
        where: { id: { in: entries.map((e) => e.budgetId) }, userId },
        select: { id: true, name: true, amount: true },
      }),
    ]);

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

    // ── Step 4: build patch data ─────────────────────────────────────────────
    const now = new Date().toISOString();
    const patchData: BudgetBreachInsightData[] = entries.map((e, idx) => ({
      categorySlug: e.categorySlug,
      budgetName: budgetNameMap.get(e.budgetId) ?? e.categorySlug,
      severity: e.severity,
      currentPct: e.currentPct,
      threshold: e.threshold,
      updatedAt: now,
      ...(idx === 0 && aiMessage ? { aiMessage } : {}),
    }));

    // ── Step 5: upsert — update existing or create new ───────────────────────
    let insightId: string;

    if (existingInsight) {
      const existingSeverityStr = existingInsight.severity.toLowerCase() as
        | 'info'
        | 'warning'
        | 'critical';
      const shouldEscalate =
        SEVERITY_RANK[newSeverity] > SEVERITY_RANK[existingSeverityStr];

      await this.prisma.aiInsight.update({
        where: { id: existingInsight.id },
        data: {
          budgetBreach: patchData as any,
          ...(shouldEscalate && {
            severity:
              newSeverity === 'critical'
                ? InsightSeverity.CRITICAL
                : InsightSeverity.WARNING,
          }),
          updatedAt: new Date(),
        },
      });

      insightId = existingInsight.id;
      this.logger.log(
        `[BudgetBreachService] Patched insight ${insightId} for userId=${userId}`,
      );
    } else {
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
            `Budget alert: ${budgetNameMap.get(topEntry.budgetId) ?? topEntry.categorySlug} is at ${Math.round(topEntry.currentPct * 100)}%`,
          anomalies: [],
          goalAlerts: [],
          budgetBreach: patchData as any,
        },
      });

      insightId = created.id;
      this.logger.log(
        `[BudgetBreachService] Created insight ${insightId} for userId=${userId}`,
      );
    }

    // ── Step 6: dispatch FCM ─────────────────────────────────────────────────
    const pct = Math.round(topEntry.currentPct * 100);
    const topBudgetName =
      budgetNameMap.get(topEntry.budgetId) ?? topEntry.categorySlug;

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
      const name = budgetNameMap.get(e.budgetId) ?? e.categorySlug;
      const amount = budgetAmountMap.get(e.budgetId) ?? 0;
      const pct = Math.round(e.currentPct * 100);
      const spent =
        amount > 0
          ? `₦${Math.round(amount * e.currentPct).toLocaleString()} of ₦${amount.toLocaleString()}`
          : `${pct}%`;
      return `- ${name} (${e.categorySlug}): ${spent} used (${pct}%), threshold ${Math.round(e.threshold * 100)}%, severity: ${e.severity}`;
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
