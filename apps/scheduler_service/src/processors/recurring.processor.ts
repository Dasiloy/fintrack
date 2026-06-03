import { Queue } from 'bullmq';
import { Job } from 'bullmq';
import type Redis from 'ioredis';

import { Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { BalanceService } from '@fintrack/common/services/balance.service';

import { PrismaService } from '@fintrack/database/service';
import {
  BUDGET_CHECK_JOB,
  BUDGET_CHECK_QUEUE,
  CREATE_RECURRING_TRANSACTION,
  RECURRING_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
  RECURRING_TRANSACTIONS_EMAIL_JOB,
  TRANSACTION_SEMANTIC_QUEUE,
  TRANSACTION_SEMANTIC_JOB,
} from '@fintrack/types/constants/queus.constants';
import { TransactionSematicJob } from '@fintrack/types/interfaces/finance';
import {
  BUDGET_TREND_CACHE_PREFIX,
  REDIS_CLIENT,
} from '@fintrack/types/constants/redis.costants';
import {
  Category,
  Prisma,
  RecurringItem,
  TransactionType,
} from '@fintrack/database/types';
import { computeNextRunAt } from '@fintrack/utils/recurring';
import { genRecurringSourceId } from '@fintrack/utils/format';

type RecurringWithCategory = RecurringItem & { category: Category };

@Processor(RECURRING_QUEUE)
export class RecurringProcessor extends WorkerHost {
  private readonly logger = new Logger(RecurringProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly balanceService: BalanceService,
    @InjectQueue(TOKEN_NOTIFICATION_QUEUE)
    private readonly emailQueue: Queue,
    @InjectQueue(BUDGET_CHECK_QUEUE)
    private readonly budgetCheckQueue: Queue,
    @InjectQueue(TRANSACTION_SEMANTIC_QUEUE)
    private readonly transactionSemanticQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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

    const recurrings = (await this.prisma.recurringItem.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { category: true },
    })) as RecurringWithCategory[];

    this.logger.log(
      `${recurrings.length} recurring item(s) due at ${now.toISOString()}`,
    );

    if (recurrings.length === 0) {
      return;
    }

    // userId → items created this run, for the notification summary
    const createdByUser = new Map<string, RecurringWithCategory[]>();

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

    // Invalidate budget trend + export caches for every user that got new transactions
    if (createdByUser.size > 0) {
      await this.invalidateCachesForUsers([...createdByUser.keys()]);
    }

    // Dispatch budget check for each user whose expense recurring transactions were created
    for (const [userId, items] of createdByUser.entries()) {
      const expenseItems = items.filter(
        (i) => i.type === TransactionType.EXPENSE,
      );
      if (expenseItems.length === 0) continue;

      void this.budgetCheckQueue.add(BUDGET_CHECK_JOB, {
        userId,
        transactions: expenseItems.map((i) => ({
          categoryId: i.categoryId,
          referenceDate: i.nextRunAt.toISOString(),
        })),
      });
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

          await this.transactionSemanticQueue.add(TRANSACTION_SEMANTIC_JOB, {
            userId,
            transactions: items.map((tx) => ({
              id: tx.id,
              amount: tx.amount,
              type: tx.type,
              date: tx.lastRunAt!,
              description: tx.description!,
              categoryName: tx.category.name,
            })),
          } satisfies TransactionSematicJob);
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
   * Invalidates budget-trend and export Redis caches for each affected user
   * so the dashboard and export endpoints reflect the newly created transactions
   * without waiting for TTL expiry.
   */
  private async invalidateCachesForUsers(userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      try {
        // Budget spending-trend keys: budget_trend:{userId}:*
        const trendKeys = await this.redis.keys(
          `${BUDGET_TREND_CACHE_PREFIX}:${userId}:*`,
        );

        // Export keys: export:{userId}:* — use SCAN to avoid blocking on large keyspaces
        const exportKeys: string[] = [];
        let cursor = '0';
        do {
          const [next, batch] = await this.redis.scan(
            cursor,
            'MATCH',
            `export:${userId}:*`,
            'COUNT',
            100,
          );
          cursor = next;
          exportKeys.push(...batch);
        } while (cursor !== '0');

        const all = [...trendKeys, ...exportKeys];
        if (all.length > 0) {
          await this.redis.del(...all);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(
          `Cache invalidation failed for user ${userId}: ${error.message}`,
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
    item: RecurringWithCategory,
    createdByUser: Map<string, RecurringWithCategory[]>,
  ): Promise<void> {
    const sourceId = genRecurringSourceId(item.id, item.nextRunAt);

    const alreadyCreated = await this.prisma.transaction.findFirst({
      where: { userId: item.userId, source: 'RECURRING', sourceId },
      select: { id: true },
    });

    if (alreadyCreated) {
      this.logger.warn(
        `SKIP ${item.id} ("${item.name}") — sourceId ${sourceId} already exists`,
      );
      return;
    }

    const nextRunAt = computeNextRunAt(item.frequency, item.nextRunAt);
    const shouldDeactivate = item.endDate !== null && nextRunAt > item.endDate;

    await this.prisma.$transaction(
      async (tx) => {
        // Step 1: ensure balance row is on the current month before creating the transaction
        await this.balanceService.ensureCurrentMonth(tx, item.userId);

        await tx.transaction.create({
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

        // Step 2: apply balance delta after the transaction row exists
        await this.balanceService.applyBalanceDelta(
          tx,
          item.userId,
          item.type,
          Number(item.amount),
          'ADD',
          item.nextRunAt,
        );

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
        `Recurring item ${item.id} ("${item.name}") deactivated — endDate reached`,
      );
    }

    const userItems = createdByUser.get(item.userId) ?? [];
    createdByUser.set(item.userId, [...userItems, item]);
  }
}
