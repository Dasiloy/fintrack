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
import { Category, Prisma, RecurringItem } from '@fintrack/database/types';
import { computeNextRunAt } from '@fintrack/utils/recurring';
import { genRecurringSourceId } from '@fintrack/utils/format';

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
   * - The sourceId `REC-{YYMMDD}-{6CHARS}` is deterministic per item per run
   *   date, so the DB unique constraint on (userId, source, sourceId) prevents
   *   duplicate transactions even under concurrent workers.
   * - We do an explicit pre-check to skip items already processed this cycle,
   *   avoiding a wasted DB round-trip into the transaction block.
   */
  private async createRecurringTransactions(): Promise<void> {
    const now = new Date();
    this.logger.log(`[AUDIT] Job started at ${now.toISOString()}`);

    const recurrings = await this.prisma.recurringItem.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { category: true },
    });

    this.logger.log(`[AUDIT] Query returned ${recurrings.length} due item(s)`);

    if (recurrings.length === 0) {
      // Log all active items with their nextRunAt so we can see why none are due
      const allActive = await this.prisma.recurringItem.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          nextRunAt: true,
          frequency: true,
          userId: true,
        },
      });
      this.logger.log(
        `[AUDIT] No items due. Active items (${allActive.length}): ${JSON.stringify(
          allActive.map((r) => ({
            id: r.id,
            name: r.name,
            frequency: r.frequency,
            nextRunAt: r.nextRunAt,
            secondsUntilDue: r.nextRunAt
              ? Math.round((r.nextRunAt.getTime() - now.getTime()) / 1000)
              : null,
          })),
          null,
          2,
        )}`,
      );
      return;
    }

    this.logger.log(
      `[AUDIT] Due items: ${JSON.stringify(
        recurrings.map((r) => ({
          id: r.id,
          name: r.name,
          userId: r.userId,
          frequency: r.frequency,
          nextRunAt: r.nextRunAt,
          amount: r.amount,
          type: r.type,
        })),
        null,
        2,
      )}`,
    );

    // userId → items created this run, for the notification summary
    const createdByUser = new Map<string, RecurringItem[]>();

    for (const item of recurrings) {
      try {
        await this.processItem(item, createdByUser);
      } catch (error: unknown) {
        // Isolate failures so one bad item never blocks the rest of the batch
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[AUDIT] Failed to process recurring item ${item.id} (${item.name}): ${err.message}`,
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
          const emailItems = items.map((r) => ({
            name: r.name,
            amount: r.amount.toString(),
            frequency: r.frequency,
            type: r.type,
          }));

          await this.emailQueue.add(RECURRING_TRANSACTIONS_EMAIL_JOB, {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            date: now.toISOString(),
            count: emailItems.length,
            items: emailItems,
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
    const sourceId = genRecurringSourceId(item.id, item.nextRunAt);
    this.logger.log(
      `[AUDIT] processItem → id=${item.id} name="${item.name}" userId=${item.userId} sourceId="${sourceId}"`,
    );

    const alreadyCreated = await this.prisma.transaction.findFirst({
      where: { userId: item.userId, source: 'RECURRING', sourceId },
      select: { id: true },
    });

    if (alreadyCreated) {
      this.logger.warn(
        `[AUDIT] SKIP id=${item.id} — transaction ${alreadyCreated.id} already exists for sourceId="${sourceId}"`,
      );
      return;
    }

    const nextRunAt = computeNextRunAt(item.frequency, item.nextRunAt);
    const shouldDeactivate = item.endDate !== null && nextRunAt > item.endDate;

    this.logger.log(
      `[AUDIT] DATE INSPECTION — item.nextRunAt raw: ${item.nextRunAt} | toISOString: ${item.nextRunAt.toISOString()} | toLocaleDateString: ${item.nextRunAt.toLocaleDateString()} | getTime: ${item.nextRunAt.getTime()} | UTC day: ${item.nextRunAt.getUTCDate()}/${item.nextRunAt.getUTCMonth() + 1}/${item.nextRunAt.getUTCFullYear()} | local day: ${item.nextRunAt.getDate()}/${item.nextRunAt.getMonth() + 1}/${item.nextRunAt.getFullYear()}`,
    );

    this.logger.log(
      `[AUDIT] Creating transaction for id=${item.id} — amount=${item.amount} type=${item.type} date=${item.nextRunAt.toISOString()} nextRunAt→${nextRunAt.toISOString()} shouldDeactivate=${shouldDeactivate}`,
    );

    await this.prisma.$transaction(
      async (tx) => {
        const created = await tx.transaction.create({
          data: {
            userId: item.userId,
            categoryId: item.category.id,
            date: item.nextRunAt,
            amount: item.amount,
            type: item.type,
            source: 'RECURRING',
            sourceId,
            recurringItemId: item.id,
            description: item.description,
            merchant: item.merchant,
            sourceData: {
              recurringItemId: item.id,
              name: item.name,
              frequency: item.frequency,
              amount: Number(item.amount),
              type: item.type,
              _meta: {
                runAt: item.nextRunAt.toISOString(),
                prevRunAt: item.lastRunAt?.toISOString() ?? null,
                nextRunAt: nextRunAt.toISOString(),
              },
            },
          },
        });

        this.logger.log(
          `[AUDIT] Transaction created → txId=${created.id} | stored date ISO: ${created.date.toISOString()} | UTC day: ${created.date.getUTCDate()}/${created.date.getUTCMonth() + 1}/${created.date.getUTCFullYear()} | local day: ${created.date.getDate()}/${created.date.getMonth() + 1}/${created.date.getFullYear()}`,
        );

        await tx.recurringItem.update({
          where: { id: item.id },
          data: {
            lastRunAt: item.nextRunAt,
            nextRunAt,
            ...(shouldDeactivate && { isActive: false }),
          },
        });

        this.logger.log(
          `[AUDIT] RecurringItem updated → id=${item.id} lastRunAt=${item.nextRunAt.toISOString()} nextRunAt=${nextRunAt.toISOString()}${shouldDeactivate ? ' isActive=false' : ''}`,
        );
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    if (shouldDeactivate) {
      this.logger.log(
        `[AUDIT] Recurring item ${item.id} (${item.name}) deactivated — endDate reached`,
      );
    }

    const userItems = createdByUser.get(item.userId) ?? [];
    createdByUser.set(item.userId, [...userItems, item]);
    this.logger.log(`[AUDIT] processItem DONE → id=${item.id} "${item.name}"`);
  }
}
