import { Queue } from 'bullmq';
import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import {
  CREATE_RECURRING_TRANSACTION,
  RECURRING_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
  RECURRING_TRANSACTIONS_EMAIL_JOB,
} from '@fintrack/types/constants/queus.constants';
import {
  Category,
  Prisma,
  RecurringItem,
  RecurringItemFrequency,
} from '@fintrack/database/types';

@Processor(RECURRING_QUEUE)
export class RecurringProcessor extends WorkerHost {
  private readonly logger = new Logger(RecurringProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(TOKEN_NOTIFICATION_QUEUE)
    private readonly emailQueue: Queue,
  ) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${RECURRING_QUEUE} queue is ready`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `${RECURRING_QUEUE} queue: Job ${job.id} [${job.name}] started`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: unknown) {
    this.logger.log(
      `${RECURRING_QUEUE} queue: Job ${job.id} [${job.name}] completed. Result: ${JSON.stringify(result)}`,
    );
  }

  @OnWorkerEvent('failed')
  onFail(job: Job, err: Error) {
    this.logger.error(
      `${RECURRING_QUEUE} queue: Job ${job.id} [${job.name}] failed: ${err.message}`,
      err.stack,
    );
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log(`${RECURRING_QUEUE} queue is drained`);
  }

  @OnWorkerEvent('error')
  onError(err: Error) {
    this.logger.error(
      `${RECURRING_QUEUE} queue: Worker error: ${err.message}`,
      err.stack,
    );
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case CREATE_RECURRING_TRANSACTION:
        await this.createRecurringTransactions();
        break;
      default:
        this.logger.error(`Unknown job name: ${job.name}`);
    }
  }

  /**
   * Hourly batch processor for recurring transactions.
   *
   * Fetches all active recurring items whose nextRunAt is due, processes each
   * one independently (failures are isolated per-item), then dispatches a
   * single activity notification and email per user summarising what was created.
   *
   * Idempotency is enforced at two levels:
   * - The sourceId `{recurringId}-{nextRunAt.toISOString()}` is unique per run
   *   period, so the DB unique constraint on (userId, source, sourceId) prevents
   *   duplicate transactions even under concurrent workers.
   * - We do an explicit pre-check to skip items already processed this cycle,
   *   avoiding a wasted DB round-trip into the transaction block.
   */
  private async createRecurringTransactions(): Promise<void> {
    const now = new Date();

    const recurrings = await this.prisma.recurringItem.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { category: true },
    });

    if (recurrings.length === 0) {
      this.logger.log('No recurring items due — nothing to process');
      return;
    }

    this.logger.log(`Processing ${recurrings.length} due recurring item(s)`);

    // userId → items created this run, for the notification summary
    const createdByUser = new Map<string, RecurringItem[]>();

    for (const item of recurrings) {
      try {
        await this.processItem(item, createdByUser);
      } catch (error: unknown) {
        // Isolate failures so one bad item never blocks the rest of the batch
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Failed to process recurring item ${item.id} (${item.name}): ${err.message}`,
          err.stack,
        );
      }
    }

    // Dispatch per-user in-app activity notification + email summary
    for (const [userId, items] of createdByUser.entries()) {
      if (items.length === 0) continue;

      // Fetch user contact details and dispatch email
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true, lastName: true },
        });

        if (user) {
          await this.emailQueue.add(RECURRING_TRANSACTIONS_EMAIL_JOB, {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            date: now.toISOString(),
            items: items.map((r) => ({
              name: r.name,
              amount: r.amount.toString(),
              frequency: r.frequency,
              type: r.type,
            })),
          });
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Failed to dispatch recurring email for user ${userId}: ${err.message}`,
          err.stack,
        );
      }
    }
  }

  /**
   * Processes a single recurring item — creates the transaction and advances
   * nextRunAt inside a serializable transaction for safety.
   *
   * @private
   * @param {RecurringItem & { category: Category}} item
   * @param {Map<string, RecurringItem[]>} createdByUser - Accumulates results
   */
  private async processItem(
    item: RecurringItem & { category: Category },
    createdByUser: Map<string, RecurringItem[]>,
  ): Promise<void> {
    const sourceId = `${item.id}-${item.nextRunAt.toISOString()}`;

    const alreadyCreated = await this.prisma.transaction.findFirst({
      where: { userId: item.userId, source: 'RECURRING', sourceId },
      select: { id: true },
    });

    if (alreadyCreated) {
      this.logger.warn(
        `Transaction for recurring item ${item.id} period ${item.nextRunAt.toISOString()} already exists — skipping`,
      );
      return;
    }

    const nextRunAt = this.computeNextRunAt(item.frequency, item.nextRunAt);

    // Deactivate if the next run would exceed the endDate
    const shouldDeactivate = item.endDate !== null && nextRunAt > item.endDate;

    await this.prisma.$transaction(
      async (tx) => {
        await tx.transaction.create({
          data: {
            userId: item.userId,
            categoryId: item.category.id,
            date: item.nextRunAt,
            amount: item.amount,
            type: item.type,
            source: 'RECURRING',
            sourceId,
            description: item.description,
            merchant: item.merchant,
          },
        });

        await tx.recurringItem.update({
          where: { id: item.id },
          data: {
            lastRunAt: item.nextRunAt,
            nextRunAt,
            ...(shouldDeactivate && { isActive: false }),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    if (shouldDeactivate) {
      this.logger.log(
        `Recurring item ${item.id} (${item.name}) deactivated — endDate reached`,
      );
    }

    const userItems = createdByUser.get(item.userId) ?? [];
    createdByUser.set(item.userId, [...userItems, item]);
  }

  /**
   * Computes the next run date from a reference date based on frequency.
   * All arithmetic uses UTC to avoid DST boundary issues.
   *
   * @private
   * @param {RecurringItemFrequency} frequency
   * @param {Date} from - The current nextRunAt (not "now")
   * @returns {Date}
   */
  private computeNextRunAt(
    frequency: RecurringItemFrequency,
    from: Date,
  ): Date {
    const next = new Date(from);

    switch (frequency) {
      case RecurringItemFrequency.DAILY:
        next.setUTCDate(next.getUTCDate() + 1);
        break;
      case RecurringItemFrequency.WEEKLY:
        next.setUTCDate(next.getUTCDate() + 7);
        break;
      case RecurringItemFrequency.BIWEEKLY:
        next.setUTCDate(next.getUTCDate() + 14);
        break;
      case RecurringItemFrequency.MONTHLY:
        next.setUTCMonth(next.getUTCMonth() + 1);
        break;
      case RecurringItemFrequency.QUARTERLY:
        next.setUTCMonth(next.getUTCMonth() + 3);
        break;
      case RecurringItemFrequency.YEARLY:
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;
      case RecurringItemFrequency.CUSTOM:
        // CUSTOM cadence is externally driven — advance by one day as a safe default
        next.setUTCDate(next.getUTCDate() + 1);
        break;
    }

    return next;
  }
}
