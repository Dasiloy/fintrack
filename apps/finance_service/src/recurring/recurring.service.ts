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
  RecurringReq,
} from '@fintrack/types/protos/finance/recurring';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import {
  ActivityLogs,
  Category,
  RecurringItem,
  RecurringItemFrequency,
  Transaction,
  TransactionSource,
} from '@fintrack/database/types';

import { UtilsService } from '../utils.service';
import { TransactionService } from '../transaction/transaction.service';

type RecurringWithCategory = RecurringItem & {
  category?: Category | null;
};

/**
 * Service responsible for all recurring-item operations.
 * Processes gRPC requests for creating, reading, updating, toggling, and
 * deleting recurring items.
 *
 * Creation rule for nextRunAt:
 * - If startDate >= today  → nextRunAt = startDate (scheduler fires on that date)
 * - If startDate < today   → compute the next occurrence from today forward
 *   based on the frequency. No transactions are backfilled.
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

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const nextRunAt =
        startDate >= today
          ? startDate
          : this.computeNextRunAt(frequency, today);

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
      this.logger.debug('isActive', data);
      const items = await this.prismaService.recurringItem.findMany({
        where: {
          userId,
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: { category: true },
        orderBy: { nextRunAt: 'desc' },
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
          where: {
            source: TransactionSource.RECURRING,
            sourceId: data.id,
            userId,
          },
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
          ...(frequencyChanged && {
            nextRunAt: this.computeNextRunAt(
              data.frequency as RecurringItemFrequency,
              new Date(),
            ),
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
            nextRunAt: this.computeNextRunAt(existing.frequency, new Date()),
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
      category: this.utils.formatCategory(recurring.category),
      createdAt: recurring.createdAt.toISOString(),
      updatedAt: recurring.updatedAt.toISOString(),
      transactions: transactions.length
        ? transactions.map(this.transactionService.formatTransaction)
        : [],
    };
  }
}
