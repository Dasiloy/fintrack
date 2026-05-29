import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';

import dayjs from '@fintrack/utils/date';

import { Inject, Logger } from '@nestjs/common';
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
import {
  INSIGHTS_COOLDOWN,
  INSIGHTS_COOLDOWN_TTL,
  REDIS_CLIENT,
} from '@fintrack/types/constants/redis.costants';

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
 * For each breached budget, one thing fire:
 * 2. Insights job — enqueued for both warning and critical zones with daily
 *    Insights run per expense however mailing depends on the user alert threshold handled in the insghts processor
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
    @InjectQueue(INSIGHTS_QUEUE)
    private readonly insightsQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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
   *   2. Enqueues an insights job for the AI pipeline.
   *
   * The insights trigger fires for both the warning zone (threshold − 0.20)
   * and critical zone (>= threshold), carrying the severity and current %
   * so the graph can tailor its messaging.
   *
   * Errors are logged and re-thrown so BullMQ can retry the job.
   */
  private async handleBudgetCheck(data: BudgetCheckJobPayload): Promise<void> {
    try {
      const { userId, transactions } = data;

      const categoryRefDateMap = new Map(
        transactions.map((tx) => [tx.categoryId, tx.referenceDate]),
      );

      const budgets = await this.prisma.budget.findMany({
        where: {
          userId,
          categoryId: { in: transactions.map((tx) => tx.categoryId) },
        },
        include: { category: true },
      });
      if (budgets.length === 0) return;

      const results = await Promise.all(
        budgets.map(async (budget) => {
          const refDate = new Date(
            categoryRefDateMap.get(budget.categoryId) ?? Date.now(),
          );
          const periodStart = this.utils.getStartOfPeriod(
            budget.period,
            refDate,
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

      //  Insights job (Phase 11, fires for both warning and critical) ──
      // Each budget in the warning zone triggers the AI insights pipeline so
      // the user gets a tailored, data-driven message rather than a generic email.
      //
      // Redis TTL handles the duplication of insghts to prevent over working the ai
      // user waiting a bit does not affect realtime, EOD insights will fix any missing insights

      const insightTasksMeta = results
        .filter(({ budget, ratio }) => {
          const warnAt = Number(budget.alertThreshold) - 0.2;
          return ratio >= warnAt;
        })
        .map(({ budget, ratio }) => {
          const threshold = Number(budget.alertThreshold);
          const severity: 'warning' | 'critical' =
            ratio >= threshold ? 'critical' : 'warning';

          return {
            categorySlug: budget.category.slug,
            budgetId: budget.id,
            severity,
            currentPct: ratio,
            threshold,
          };
        });

      if (insightTasksMeta.length === 0) return; // no braeches no need fopr insghts

      const cooldownKey = `${INSIGHTS_COOLDOWN}:${userId}`;
      const ttl = await this.redis.ttl(cooldownKey);

      if (ttl > 0) {
        this.logger.log('Cool off.... Stop insghts');
        return;
      }

      await this.insightsQueue.add(
        INSIGHTS_JOB,
        {
          userId,
          trigger: 'budget_breach',
          metadata: insightTasksMeta,
        } satisfies InsightsJobPayload,
        {
          removeOnComplete: true,
          removeOnFail: true,
        },
      );

      void this.redis
        .setex(cooldownKey, INSIGHTS_COOLDOWN_TTL, '1')
        .catch(() => {});
    } catch (error) {
      this.logger.error('handleBudgetCheck error', error);
      throw error;
    }
  }
}
