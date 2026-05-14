import { Queue, Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import { TransactionType } from '@fintrack/database/types';
import {
  BUDGET_ALERT_EMAIL_JOB,
  BUDGET_CHECK_JOB,
  BUDGET_CHECK_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { BudgetCheckJobPayload } from '@fintrack/types/interfaces/finance';
import { BudgetAlertEmailPayload } from '@fintrack/types/interfaces/mail.interface';

import { UtilsService } from '../utils.service';

/**
 * BullMQ processor that consumes `BUDGET_CHECK_QUEUE` jobs enqueued after
 * any EXPENSE transaction write (create, update, or batch import).
 *
 * Running this check asynchronously means the gRPC caller receives its
 * response immediately — the alert evaluation and email dispatch happen in
 * the background within seconds rather than blocking the request.
 *
 * ## Job handled
 * | Job name          | Payload                  | Handler               |
 * |-------------------|--------------------------|-----------------------|
 * | `BUDGET_CHECK_JOB`| `BudgetCheckJobPayload`  | `handleBudgetCheck()` |
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
   * its alert threshold and, if so, enqueues a budget-alert email job.
   *
   * Alert suppression: an alert is skipped when `alertedAt` is non-null,
   * falls within the current budget period, and is more recent than the
   * budget's `alertAtFrequency` window — preventing duplicate emails.
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
          return { budget, spent: Number(_sum.amount ?? 0), periodStart };
        }),
      );

      const newBreaches = results.filter(({ budget, spent, periodStart }) => {
        const ratio = spent / Number(budget.amount);
        const throttleCutoff = new Date(
          referenceDate.getTime() - budget.alertAtFrequency * 86_400_000,
        );
        const suppressed =
          budget.alertedAt !== null &&
          budget.alertedAt >= periodStart &&
          budget.alertedAt >= throttleCutoff;
        return ratio >= budget.alertThreshold && !suppressed;
      });

      if (newBreaches.length === 0) return;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      });
      if (!user) return;

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
    } catch (error) {
      this.logger.error('handleBudgetCheck error', error);
      throw error;
    }
  }
}
