import { Queue, Job } from 'bullmq';
import dayjs from '@fintrack/utils/date';

import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import { TransactionType } from '@fintrack/database/types';
import {
  BUDGET_ALERT_EMAIL_JOB,
  BUDGET_CHECK_JOB,
  BUDGET_CHECK_QUEUE,
  INSIGHTS_JOB,
  INSIGHTS_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { BudgetCheckJobPayload } from '@fintrack/types/interfaces/finance';
import { BudgetAlertEmailPayload } from '@fintrack/types/interfaces/mail.interface';
import { InsightsJobPayload } from '@fintrack/types/interfaces/insights';

import { UtilsService } from '../utils.service';

/**
 * BullMQ processor that consumes `BUDGET_CHECK_QUEUE` jobs enqueued after
 * any EXPENSE transaction write (create, update, or batch import).
 *
 * Running this check asynchronously means the gRPC caller receives its
 * response immediately — the alert evaluation and email dispatch happen in
 * the background within seconds rather than blocking the request.
 *
 * ## Jobs handled
 * | Job name          | Payload                  | Handler               |
 * |-------------------|--------------------------|-----------------------|
 * | `BUDGET_CHECK_JOB`| `BudgetCheckJobPayload`  | `handleBudgetCheck()` |
 *
 * ## Dual dispatch (Phase 11)
 * For each breached budget, two independent actions fire:
 * 1. Email alert (existing) — suppressed by `alertedAt` to prevent duplicate emails.
 * 2. Insights job — enqueued for both warning and critical zones with daily
 *    deduplication via BullMQ `jobId` so the AI pipeline runs at most once
 *    per budget per severity level per day.
 *
 * Alert zone levels (based on per-budget `alertThreshold`, e.g. 0.80):
 *   warning  — ratio >= threshold − 0.20  (within 20pp of threshold)
 *   critical — ratio >= threshold          (at or above threshold)
 *
 * @class BudgetCheckProcessor
 */
@Processor(BUDGET_CHECK_QUEUE)
export class BudgetCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(BudgetCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    @InjectQueue(TOKEN_NOTIFICATION_QUEUE)
    private readonly tokenNotificationQueue: Queue,
    @InjectQueue(INSIGHTS_QUEUE)
    private readonly insightsQueue: Queue,
  ) {
    super();
  }

  /** Routes incoming BullMQ jobs to the appropriate handler by job name. */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case BUDGET_CHECK_JOB:
        await this.handleBudgetCheck(job.data as BudgetCheckJobPayload);
        break;
      default:
        this.logger.warn(`Unhandled job: ${job.name}`);
    }
  }

  /**
   * Evaluates whether any budget covering the given categories has breached
   * its alert threshold and, if so:
   *   1. Enqueues a budget-alert email (suppressed by alertedAt frequency guard).
   *   2. Enqueues an insights job for the AI pipeline (daily dedup via jobId).
   *
   * The insights trigger fires for both the warning zone (threshold − 0.20)
   * and critical zone (>= threshold), carrying the severity and current %
   * so the graph can tailor its messaging.
   *
   * Errors are logged and re-thrown so BullMQ can retry the job.
   */
  private async handleBudgetCheck(data: BudgetCheckJobPayload): Promise<void> {
    try {
      const { userId, categoryIds, referenceDate: referenceDateStr } = data;
      const referenceDate = new Date(referenceDateStr);

      const budgets = await this.prisma.budget.findMany({
        where: { userId, categoryId: { in: categoryIds } },
        include: { category: true },
      });
      if (budgets.length === 0) return;

      const results = await Promise.all(
        budgets.map(async (budget) => {
          const periodStart = this.utils.getStartOfPeriod(
            budget.period,
            referenceDate,
          );
          const periodEnd = this.utils.getEndOfPeriod(
            budget.period,
            periodStart,
          );
          const { _sum } = await this.prisma.transaction.aggregate({
            where: {
              userId,
              categoryId: budget.categoryId,
              type: TransactionType.EXPENSE,
              date: { gte: periodStart, lte: periodEnd },
            },
            _sum: { amount: true },
          });
          return {
            budget,
            spent: Number(_sum.amount ?? 0),
            periodStart,
            ratio: Number(_sum.amount ?? 0) / Number(budget.amount),
          };
        }),
      );

      // ── 1. Email alert (existing, suppression-guarded) ───────────────────
      const newBreaches = results.filter(({ budget, ratio, periodStart }) => {
        const throttleCutoff = new Date(
          referenceDate.getTime() - budget.alertAtFrequency * 86_400_000,
        );
        const suppressed =
          budget.alertedAt !== null &&
          budget.alertedAt >= periodStart &&
          budget.alertedAt >= throttleCutoff;
        return ratio >= budget.alertThreshold && !suppressed;
      });

      if (newBreaches.length > 0) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true, lastName: true },
        });
        if (user) {
          await this.tokenNotificationQueue.add(BUDGET_ALERT_EMAIL_JOB, {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            budgetIds: newBreaches.map(({ budget }) => budget.id),
            alerts: newBreaches.map(({ budget, spent }) => ({
              budgetName: budget.name,
              categoryName: budget.category.name,
              spent,
              limit: Number(budget.amount),
              percentage: Math.round((spent / Number(budget.amount)) * 100),
            })),
          } satisfies BudgetAlertEmailPayload);
        }
      }

      // ── 2. Insights job (Phase 11, fires for both warning and critical) ──
      // Each budget in the warning zone triggers the AI insights pipeline so
      // the user gets a tailored, data-driven message rather than a generic email.
      //
      // Daily deduplication: BullMQ skips the enqueue if a job with the same
      // `jobId` is already waiting. Format: `budget_breach:{budgetId}:{severity}:{date}`
      // This allows a severity escalation (warning→critical) on the same day to
      // still fire as a distinct insights run.
      const today = dayjs(referenceDate).format('YYYY-MM-DD');

      const insightTasks = results
        .filter(({ budget, ratio }) => {
          const warnAt = Number(budget.alertThreshold) - 0.2;
          return ratio >= warnAt;
        })
        .map(({ budget, ratio }) => {
          const threshold = Number(budget.alertThreshold);
          const severity: 'warning' | 'critical' =
            ratio >= threshold ? 'critical' : 'warning';
          const jobId = `budget_breach:${budget.id}:${severity}:${today}`;

          return this.insightsQueue.add(
            INSIGHTS_JOB,
            {
              userId,
              trigger: 'budget_breach',
              metadata: {
                categorySlug: budget.category.slug,
                budgetId: budget.id,
                severity,
                currentPct: ratio,
                threshold,
              },
            } satisfies InsightsJobPayload,
            { jobId }, // BullMQ deduplicates: same jobId already queued → skip
          );
        });

      await Promise.all(insightTasks);
    } catch (error) {
      this.logger.error('handleBudgetCheck error', error);
      throw error;
    }
  }
}
