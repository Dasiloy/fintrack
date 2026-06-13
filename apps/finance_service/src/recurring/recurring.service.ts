import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';

import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import {
  ACTIVITY_NOTIFICATION_JOB,
  ACTIVITY_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import {
  Recurinrg as ProtoRecurring,
  CreateRecurringReq,
  UpdateRecurringReq,
  GetRecurringsReq,
  GetRecurringsRes,
  RecurringAggregateRes,
  RecurringReq,
} from '@fintrack/types/protos/finance/recurring';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import {
  ActivityLogs,
  Category,
  RecurringItem,
  RecurringItemFrequency,
  Transaction,
} from '@fintrack/database/types';

import {
  computeFirstRunAt,
  computeNextRunAt,
  utcToday,
} from '@fintrack/utils/recurring';

import { UtilsService } from '../utils.service';
import { TransactionService } from '../transaction/transaction.service';

type RecurringWithCategory = RecurringItem & {
  category?: Category | null;
};

const MONTHLY_MULTIPLIER: Record<string, number> = {
  DAILY: 30,
  WEEKLY: 4.33,
  BIWEEKLY: 2.17,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12,
  CUSTOM: 0,
};

/**
 * Core service for all recurring-item operations in the Finance microservice.
 *
 * ## Responsibilities
 * Processes gRPC requests for creating, reading, updating, toggling, and
 * deleting recurring items, and computing aggregate stats for the bills page.
 *
 * ## `nextRunAt` computation rule
 * - `startDate >= today` → `nextRunAt = startDate` (scheduler fires on that date)
 * - `startDate < today`  → next occurrence computed forward from today by frequency
 *   (no transactions are backfilled)
 * - Frequency change or reactivation → recomputed from today via `computeNextRunAt`
 *
 * ## Aggregate strategy
 * `getRecurringsAggregate` uses a single Prisma `groupBy` query (≤ 24 rows:
 * 6 frequencies × 2 types × 2 `isActive` states). Monthly totals are derived
 * by applying `MONTHLY_MULTIPLIER` per frequency — no row-level iteration,
 * no blocking computation on the server.
 *
 * ## Side effects
 * Every mutation enqueues an `ACTIVITY_NOTIFICATION_JOB` to BullMQ for
 * activity logging and analytics.
 *
 * @class RecurringService
 */
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue(ACTIVITY_NOTIFICATION_QUEUE)
    private readonly activityNotificationQueue: Queue,
    private readonly utils: UtilsService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Creates a new recurring item for a user.
   *
   * `nextRunAt` is computed automatically:
   * - Future startDate  → nextRunAt = startDate
   * - Past startDate    → nextRunAt = next occurrence from today (no backfill)
   *
   * The scheduler service is responsible for actually executing runs; this
   * method only persists the record.
   *
   * @async
   * @param {string} userId
   * @param {CreateRecurringReq} data
   * @returns {Promise<ProtoRecurring>}
   * @throws {RpcException} NOT_FOUND if category does not exist
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async createRecurring(
    userId: string,
    data: CreateRecurringReq,
  ): Promise<ProtoRecurring> {
    try {
      const category = await this.utils.getCategory(userId, data.categorySlug);

      const startDate = new Date(data.startDate);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = data.endDate ? new Date(data.endDate) : null;
      const frequency = data.frequency as RecurringItemFrequency;
      const today = utcToday();

      const nextRunAt =
        startDate >= today
          ? startDate
          : computeFirstRunAt(frequency, startDate, today);

      const recurring = await this.prismaService.recurringItem.create({
        data: {
          userId,
          name: data.name,
          amount: data.amount,
          type: data.type as any,
          frequency,
          startDate,
          endDate,
          description: data.description,
          merchant: data.merchant,
          nextRunAt,
          isActive: true,
          reminderEnabled: data.reminderEnabled ?? true,
          categoryId: category.id!,
        },
        include: { category: true },
      });

      this.callEvents(userId, recurring, 'Recurring Created');
      return this.formatRecurring(recurring);
    } catch (error) {
      this.logger.error('createRecurring error:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Returns all recurring items for a user, optionally filtered by isActive.
   *
   * @async
   * @param {string} userId
   * @param {GetRecurringsReq} data
   * @returns {Promise<GetRecurringsRes>}
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getRecurrings(
    userId: string,
    data: GetRecurringsReq,
  ): Promise<GetRecurringsRes> {
    try {
      const orderBy = this.buildOrderBy(data.sortBy);

      const items = await this.prismaService.recurringItem.findMany({
        where: {
          userId,
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.type?.length && { type: { in: data.type as any[] } }),
          ...(data.frequency?.length && {
            frequency: { in: data.frequency as any[] },
          }),
        },
        include: { category: true },
        orderBy,
      });

      return { recurrings: items.map((r) => this.formatRecurring(r)) };
    } catch (error) {
      this.logger.error('getRecurrings error:', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Returns a single recurring item by ID.
   *
   * @async
   * @param {string} userId
   * @param {RecurringReq} data
   * @returns {Promise<ProtoRecurring>}
   * @throws {RpcException} NOT_FOUND if item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getRecurring(
    userId: string,
    data: RecurringReq,
  ): Promise<ProtoRecurring> {
    try {
      const [recurring, transactions] = await Promise.all([
        this.prismaService.recurringItem.findFirst({
          where: { id: data.id, userId },
          include: { category: true },
        }),
        this.prismaService.transaction.findMany({
          where: { recurringItemId: data.id, userId },
          orderBy: { date: 'desc' },
        }),
      ]);

      if (!recurring) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Recurring item not found',
        });
      }

      return this.formatRecurring(recurring, transactions);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('getRecurring error:', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Updates an existing recurring item.
   *
   * If `frequency` changes, `nextRunAt` is recomputed from today so the
   * scheduler picks up the new cadence immediately.
   *
   * @async
   * @param {string} userId
   * @param {UpdateRecurringReq} data
   * @returns {Promise<ProtoRecurring>}
   * @throws {RpcException} NOT_FOUND if item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async updateRecurring(
    userId: string,
    data: UpdateRecurringReq,
  ): Promise<ProtoRecurring> {
    try {
      const existing = await this.prismaService.recurringItem.findFirst({
        where: { id: data.id, userId },
      });

      if (!existing) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Recurring item not found',
        });
      }

      const frequencyChanged =
        data.frequency && data.frequency !== existing.frequency;

      const recurring = await this.prismaService.recurringItem.update({
        where: { id: data.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.frequency && {
            frequency: data.frequency as RecurringItemFrequency,
          }),
          ...(data.endDate !== undefined && {
            endDate: data.endDate ? new Date(data.endDate) : null,
          }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.merchant !== undefined && { merchant: data.merchant }),
          ...(data.reminderEnabled !== undefined && {
            reminderEnabled: data.reminderEnabled,
          }),
          ...(frequencyChanged && {
            nextRunAt: computeNextRunAt(data.frequency as string, utcToday()),
          }),
        },
        include: { category: true },
      });

      this.callEvents(userId, recurring, 'Recurring Updated');
      return this.formatRecurring(recurring);
    } catch (error) {
      this.logger.error('updateRecurring error:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Toggles the `isActive` flag on a recurring item.
   * Deactivating pauses the scheduler from running it.
   * Reactivating recomputes `nextRunAt` from today so it resumes correctly.
   *
   * @async
   * @param {string} userId
   * @param {RecurringReq} data
   * @returns {Promise<ProtoRecurring>}
   * @throws {RpcException} NOT_FOUND if item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async toggleRecurring(
    userId: string,
    data: RecurringReq,
  ): Promise<ProtoRecurring> {
    try {
      const existing = await this.prismaService.recurringItem.findFirst({
        where: { id: data.id, userId },
      });

      if (!existing) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Recurring item not found',
        });
      }

      const nextIsActive = !existing.isActive;

      const recurring = await this.prismaService.recurringItem.update({
        where: { id: data.id },
        data: {
          isActive: nextIsActive,
          // When reactivating, reset nextRunAt to the next valid occurrence
          // so the scheduler doesn't miss a beat
          ...(nextIsActive && {
            nextRunAt: computeNextRunAt(
              existing.frequency as string,
              utcToday(),
            ),
          }),
        },
        include: { category: true },
      });

      const event = nextIsActive ? 'Recurring Activated' : 'Recurring Paused';
      this.callEvents(userId, recurring, event);
      return this.formatRecurring(recurring);
    } catch (error) {
      this.logger.error('toggleRecurring error:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Toggles the `reminderEnabled` flag on a recurring item — a lightweight
   * opt-in/out for advance billing reminders that doesn't touch the schedule.
   *
   * @async
   * @param {string} userId
   * @param {RecurringReq} data
   * @returns {Promise<ProtoRecurring>}
   * @throws {RpcException} NOT_FOUND if item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async toggleReminder(
    userId: string,
    data: RecurringReq,
  ): Promise<ProtoRecurring> {
    try {
      const existing = await this.prismaService.recurringItem.findFirst({
        where: { id: data.id, userId },
        select: { id: true, reminderEnabled: true },
      });

      if (!existing) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Recurring item not found',
        });
      }

      const recurring = await this.prismaService.recurringItem.update({
        where: { id: data.id },
        data: { reminderEnabled: !existing.reminderEnabled },
        include: { category: true },
      });

      return this.formatRecurring(recurring);
    } catch (error) {
      this.logger.error('toggleReminder error:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Permanently deletes a recurring item.
   *
   * @async
   * @param {string} userId
   * @param {RecurringReq} data
   * @returns {Promise<Empty>}
   * @throws {RpcException} NOT_FOUND if item does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async deleteRecurring(userId: string, data: RecurringReq): Promise<Empty> {
    try {
      const existing = await this.prismaService.recurringItem.findFirst({
        where: { id: data.id, userId },
        select: { id: true },
      });

      if (!existing) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Recurring item not found',
        });
      }

      const deleted = await this.prismaService.recurringItem.delete({
        where: { id: data.id },
        include: { category: true },
      });

      this.callEvents(userId, deleted, 'Recurring Deleted');
      return {};
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error('deleteRecurring error:', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Returns aggregate metrics for the bills page widgets using a single
   * `groupBy` query — no row-level iteration, no blocking computation.
   *
   * The DB returns at most `6 frequencies × 2 types × 2 isActive states = 24`
   * rows. The only server-side work is a single `.reduce()` over those rows to
   * apply the per-frequency monthly multiplier.
   *
   * @async
   * @param {string} userId
   * @returns {Promise<RecurringAggregateRes>}
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getRecurringsAggregate(userId: string): Promise<RecurringAggregateRes> {
    try {
      const groups = await this.prismaService.recurringItem.groupBy({
        by: ['frequency', 'type', 'isActive'],
        where: { userId },
        _count: { id: true },
        _sum: { amount: true },
      });

      let activeCount = 0;
      let pausedCount = 0;
      let monthlyExpense = 0;
      let monthlyIncome = 0;

      for (const g of groups) {
        const count = g._count.id;
        const sum = Number(g._sum.amount ?? 0);
        const multiplier = MONTHLY_MULTIPLIER[g.frequency] ?? 0;

        if (g.isActive) {
          activeCount += count;
          if (g.type === 'EXPENSE') monthlyExpense += sum * multiplier;
          else monthlyIncome += sum * multiplier;
        } else {
          pausedCount += count;
        }
      }

      return { activeCount, pausedCount, monthlyExpense, monthlyIncome };
    } catch (error) {
      this.logger.error('getRecurringsAggregate error:', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Builds a Prisma `orderBy` array for recurring item queries.
   *
   * Active items always float to the top via a leading `{ isActive: 'desc' }`
   * clause, regardless of the chosen sort field. The secondary sort is:
   * - `'amount'`  → highest amount first
   * - `'name'`    → alphabetical ascending
   * - default     → nearest `nextRunAt` first (soonest due)
   *
   * @private
   * @param {string} [sortBy] - Sort key from the API request
   * @returns Prisma-compatible orderBy array
   */
  private buildOrderBy(sortBy?: string) {
    const active = { isActive: 'desc' as const };
    switch (sortBy) {
      case 'amount':
        return [active, { amount: 'desc' as const }];
      case 'name':
        return [active, { name: 'asc' as const }];
      default:
        return [active, { nextRunAt: 'asc' as const }];
    }
  }

  /**
   * Enqueues activity-log and analytics notification jobs for a recurring event.
   *
   * @private
   * @param {string} userId
   * @param {RecurringWithCategory} recurring
   * @param {string} event - Human-readable label e.g. 'Recurring Created'
   */
  private callEvents(
    userId: string,
    recurring: RecurringWithCategory,
    event: string,
  ) {
    const normalizedEvent = event.split(' ').join('_').toLowerCase();

    const data = {
      type: 'recurring',
      recurringId: recurring.id,
      recurringName: recurring.name,
      recurringAmount: recurring.amount.toString(),
      recurringFrequency: recurring.frequency,
    };

    const activityData: ActivityLogs = {
      userId,
      id: recurring.id,
      createdAt: recurring.createdAt,
      event: normalizedEvent,
      entityId: recurring.id,
      entityType: 'recurring',
      data,
    };
    this.activityNotificationQueue.add(ACTIVITY_NOTIFICATION_JOB, activityData);
  }

  /**
   * Maps a Prisma RecurringItem record to the proto Recurinrg shape.
   * Accepts an optional pre-fetched transactions list (only populated for
   * getRecurring — list endpoints omit transactions for performance).
   *
   * @private
   * @param {RecurringWithCategory} recurring
   * @param {Transaction[]} transactions - Pre-fetched linked transactions
   * @returns {ProtoRecurring}
   */
  private formatRecurring(
    recurring: RecurringWithCategory,
    transactions: Transaction[] = [],
  ): ProtoRecurring {
    return {
      id: recurring.id,
      name: recurring.name,
      amount: recurring.amount,
      type: recurring.type,
      frequency: recurring.frequency,
      startDate: recurring.startDate.toISOString(),
      endDate: recurring.endDate?.toISOString(),
      description: recurring.description ?? undefined,
      notes: recurring.notes ?? undefined,
      merchant: recurring.merchant ?? undefined,
      lastRunAt: recurring.lastRunAt?.toISOString(),
      nextRunAt: recurring.nextRunAt.toISOString(),
      isActive: recurring.isActive,
      reminderEnabled: recurring.reminderEnabled,
      category: this.utils.formatCategory(recurring.category),
      createdAt: recurring.createdAt.toISOString(),
      updatedAt: recurring.updatedAt.toISOString(),
      transactions: transactions.length
        ? transactions.map((t) => this.transactionService.formatTransaction(t))
        : [],
    };
  }
}
