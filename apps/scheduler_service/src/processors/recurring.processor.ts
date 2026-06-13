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
  FCM_NOTIFICATION_JOB,
  FCM_NOTIFICATION_QUEUE,
  RECURRING_QUEUE,
  RECURRING_REMINDER_JOB,
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
import { computeNextRunAt, computeReminderAt } from '@fintrack/utils/recurring';
import { genRecurringSourceId, formatCurrency } from '@fintrack/utils/format';
import { FcmNotificationPayload } from '@fintrack/types/interfaces/finance';

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
    @InjectQueue(FCM_NOTIFICATION_QUEUE)
    private readonly fcmNotificationQueue: Queue,
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
      case RECURRING_REMINDER_JOB:
        await this.sendReminders();
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
   * Frequency-aware advance-notice reminders for upcoming recurring charges.
   *
   * Runs every hour (offset from the charge job). For each active, reminder-
   * enabled item whose lead window has opened but whose charge hasn't happened
   * yet, dispatches a single in-app + push notification via the FCM queue
   * (`FcmService.sendToUser` persists the in-app Notification row *and* sends
   * the push — no email, by design).
   *
   * ## Exactly-once-per-cycle
   * The reminder window is `[reminderAt, nextRunAt)` where
   * `reminderAt = nextRunAt - lead(frequency)`. We fire when:
   * - `now >= reminderAt`  → the lead time has arrived or passed (tolerates a
   *   delayed/missed tick — no exact-time match required), and
   * - `now < nextRunAt`    → the charge hasn't run yet (enforced in the query),
   *   so we never send a stale "upcoming" reminder after the fact, and
   * - `lastReminderSentAt` is unset or predates this cycle's `reminderAt`
   *   → not already reminded for this occurrence.
   *
   * After a reminder fires, `lastReminderSentAt` is stamped to `now`; the next
   * occurrence advances `nextRunAt` (and thus `reminderAt`) forward, so a fresh
   * reminder naturally fires next cycle while repeat ticks this cycle are
   * suppressed.
   */
  private async sendReminders(): Promise<void> {
    const now = new Date();

    // Only items that could plausibly be in a reminder window: active,
    // opted-in, not yet charged, and not past their end date.
    const items = await this.prisma.recurringItem.findMany({
      where: {
        isActive: true,
        reminderEnabled: true,
        nextRunAt: { gt: now },
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
    });

    const due = items.filter((item) => {
      const reminderAt = computeReminderAt(item.frequency, item.nextRunAt);
      if (now < reminderAt) return false; // lead window not open yet
      // already reminded for this occurrence?
      return (
        item.lastReminderSentAt === null || item.lastReminderSentAt < reminderAt
      );
    });

    this.logger.log(
      `${due.length}/${items.length} recurring item(s) due a reminder at ${now.toISOString()}`,
    );

    if (due.length === 0) return;

    const sentIds: string[] = [];

    for (const item of due) {
      try {
        const fcmData: FcmNotificationPayload = {
          userId: item.userId,
          title: `Reminder: ${item.name}`,
          body: this.buildReminderBody(item, now),
          data: {
            type: 'recurring_reminder',
            recurringId: item.id,
            recurringName: item.name,
            amount: String(item.amount),
            frequency: item.frequency,
            nextRunAt: item.nextRunAt.toISOString(),
          },
        };
        await this.fcmNotificationQueue.add(FCM_NOTIFICATION_JOB, fcmData);
        sentIds.push(item.id);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[AUDIT] Failed to enqueue reminder for item ${item.id} (${item.name}): ${err.message}`,
          err.stack,
        );
      }
    }

    // Stamp lastReminderSentAt only for items we actually enqueued, so a failed
    // enqueue is retried on the next tick rather than silently swallowed.
    if (sentIds.length > 0) {
      await this.prisma.recurringItem.updateMany({
        where: { id: { in: sentIds } },
        data: { lastReminderSentAt: now },
      });
    }
  }

  /**
   * Builds the frequency-aware body copy for a reminder notification.
   * The "due" phrasing scales with how far out the charge is so a daily bill
   * reads naturally ("in about an hour") alongside a yearly one ("on Jun 13").
   *
   * @private
   */
  private buildReminderBody(item: RecurringItem, now: Date): string {
    const HOUR_MS = 60 * 60 * 1000;
    const DAY_MS = 24 * HOUR_MS;
    const ms = item.nextRunAt.getTime() - now.getTime();

    let due: string;
    if (ms <= 2 * HOUR_MS) {
      due = 'in about an hour';
    } else {
      const days = Math.round(ms / DAY_MS);
      if (days <= 0) due = 'today';
      else if (days === 1) due = 'tomorrow';
      else if (days <= 14) due = `in ${days} days`;
      else
        due = `on ${item.nextRunAt.toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC',
        })}`;
    }

    const money = formatCurrency(item.amount);
    const verb =
      item.type === TransactionType.EXPENSE ? 'is due' : 'is expected';
    return `${money} ${verb} ${due}.`;
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
