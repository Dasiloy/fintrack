import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';

import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import {
  ACTIVITY_NOTIFICATION_JOB,
  ACTIVITY_NOTIFICATION_QUEUE,
  ANALYTICS_NOTIFICATION_JOB,
  ANALYTICS_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import {
  Budget as ProtoBudget,
  CreateBudgetReq,
  DeleteBudgetReq,
  UpdateBudgetReq,
} from '@fintrack/types/protos/finance/budget';
import {
  ActivityLogs,
  Budget,
  BudgetPeriod,
  Category,
  Prisma,
} from '@fintrack/database/types';

import { UtilsService } from '../utils.service';
import { AnalyticsNotificationPayload } from '@fintrack/types/interfaces/finance';

type BudgetWithOptionalJoins = Budget & {
  category?: Category | null;
};

/**
 * Service responsible for handling all budget-related operations.
 * Processes gRPC requests for creating, updating, and deleting budgets.
 * Budget history is maintained as a Slowly Changing Dimension (SCD) to track
 * limit changes over time.
 *
 * @class BudgetService
 */
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue(ACTIVITY_NOTIFICATION_QUEUE)
    private readonly activityNotificationQueue: Queue,
    @InjectQueue(ANALYTICS_NOTIFICATION_QUEUE)
    private readonly analyticsNotificationQueue: Queue,
    private readonly utils: UtilsService,
  ) {}

  /**
   * Creates a new budget for a user and opens its first history entry.
   *
   * The startDate is derived from the optional `month` and `year` fields to
   * support backdating — allowing users to create budgets for past periods.
   * If neither is supplied the budget starts today.
   *
   * After computing the startDate the service checks whether an existing
   * BudgetHistory entry for the same user+category starts after that date.
   * If one exists, the new entry's endDate is set to that future startDate so
   * history periods never overlap. Otherwise endDate is null, indicating this
   * is the current active entry.
   *
   * @async
   * @param {string} userId - The authenticated user's ID
   * @param {CreateBudgetReq} data - Budget creation payload
   * @returns {Promise<ProtoBudget>} The newly created budget
   * @throws {RpcException} NOT_FOUND if the category does not exist
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async createBudget(
    userId: string,
    data: CreateBudgetReq,
  ): Promise<ProtoBudget> {
    try {
      const category = await this.utils.getCategory(userId, data.categorySlug);

      const anchorDate =
        data.month !== undefined && data.year !== undefined
          ? new Date(Date.UTC(data.year, data.month, 1))
          : new Date();
      const period = (data.period as BudgetPeriod) ?? BudgetPeriod.MONTHLY;
      const startDate = this.getStartOfPeriod(period, anchorDate);

      const futureHistory = await this.prismaService.budgetHistory.findFirst({
        where: {
          budget: {
            userId,
            categoryId: category.id!,
          },
          startDate: {
            gt: startDate,
          },
        },
        orderBy: { startDate: 'asc' },
        select: { startDate: true },
      });

      const endDate = futureHistory ? futureHistory.startDate : null;

      const budget = await this.prismaService.budget.create({
        data: {
          userId,
          name: data.name,
          amount: data.amount,
          alertThreshold: data.alertThreshold,
          description: data.description,
          categoryId: category.id!,
          period,
          budgetHistory: {
            create: {
              limit: data.amount,
              startDate,
              endDate,
            },
          },
        },
        include: { category: true },
      });

      this.callEvents(userId, budget, 'Budget Created');
      return this.formatBudget(budget);
    } catch (error) {
      this.logger.error('createBudget error in BudgetService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured',
        details: error.message,
      });
    }
  }

  /**
   * Updates an existing budget owned by the user.
   *
   * All mutations run inside a single Prisma transaction. If the `amount`
   * field changes, the currently active BudgetHistory entry (endDate = null)
   * is closed at the current timestamp and a new entry is opened with the
   * updated limit. This preserves a complete audit trail of all limit changes
   * without losing historical data.
   *
   * @async
   * @param {string} userId - The authenticated user's ID
   * @param {UpdateBudgetReq} data - Budget update payload (all fields optional except id)
   * @returns {Promise<ProtoBudget>} The updated budget
   * @throws {RpcException} NOT_FOUND if the budget does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async updateBudget(
    userId: string,
    data: UpdateBudgetReq,
  ): Promise<ProtoBudget> {
    try {
      const updatedBudget = await this.prismaService.$transaction(
        async (tx) => {
          const budget = await this.prismaService.budget.findFirst({
            where: { id: data.id, userId },
          });

          if (!budget) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: 'Budget not found',
            });
          }

          const amountChanged =
            data.amount !== undefined && data.amount !== budget.amount;

          if (amountChanged) {
            const now = new Date();
            const currentPeriodStart = this.getStartOfPeriod(
              budget.period,
              now,
            );

            // Find the active history entry (endDate = null)
            const activeHistory = await tx.budgetHistory.findFirst({
              where: { budgetId: budget.id, endDate: null },
              select: { id: true, startDate: true },
            });

            const activePeriodStart = activeHistory
              ? this.getStartOfPeriod(budget.period, activeHistory.startDate)
              : null;

            const isSamePeriod =
              activePeriodStart?.getTime() === currentPeriodStart.getTime();

            if (isSamePeriod && activeHistory) {
              // Same period — correct the limit in place, no new entry needed
              await tx.budgetHistory.update({
                where: { id: activeHistory.id },
                data: { limit: data.amount! },
              });
            } else {
              // Period has rolled over — close the old entry and open a new one
              if (activeHistory) {
                await tx.budgetHistory.update({
                  where: { id: activeHistory.id },
                  data: { endDate: currentPeriodStart },
                });
              }

              await tx.budgetHistory.create({
                data: {
                  budgetId: budget.id,
                  limit: data.amount!,
                  startDate: currentPeriodStart,
                  endDate: null,
                },
              });
            }
          }

          return tx.budget.update({
            where: { id: budget.id },
            data: {
              ...(data.name && { name: data.name }),
              ...(data.amount !== undefined && { amount: data.amount }),
              ...(data.description !== undefined && {
                description: data.description,
              }),
              ...(data.alertThreshold !== undefined && {
                alertThreshold: data.alertThreshold,
              }),
            },
            include: { category: true },
          });
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      this.callEvents(userId, updatedBudget, 'Budget Updated');
      return this.formatBudget(updatedBudget);
    } catch (error) {
      this.logger.error('updateBudget error in BudgetService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured',
        details: error.message,
      });
    }
  }

  /**
   * Permanently deletes a budget and all its history.
   *
   * BudgetHistory rows are removed automatically via the cascade delete
   * defined in the Prisma schema — no explicit history deletion is needed.
   *
   * @async
   * @param {string} userId - The authenticated user's ID
   * @param {DeleteBudgetReq} data - Contains the budget ID to delete
   * @returns {Promise<Empty>} Empty response on success
   * @throws {RpcException} NOT_FOUND if the budget does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async deleteBudget(userId: string, data: DeleteBudgetReq): Promise<Empty> {
    try {
      const budget = await this.prismaService.budget.findFirst({
        where: {
          id: data.id,
          userId,
        },
        select: { id: true },
      });

      if (!budget) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Budget not found',
        });
      }

      const deletedBudget = await this.prismaService.budget.delete({
        where: {
          id: data.id,
          userId,
        },
        include: { category: true },
      });

      this.callEvents(userId, deletedBudget, 'Budget Deleted');
      return {};
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured',
        details: error.message,
      });
    }
  }

  /**
   * Enqueues activity-log and analytics notification jobs for a budget event.
   *
   * @private
   * @param {string} userId - The user who triggered the event
   * @param {BudgetWithOptionalJoins} budget - The budget involved in the event
   * @param {string} event - Human-readable event label e.g. 'Budget Created'
   */
  private callEvents(
    userId: string,
    budget: BudgetWithOptionalJoins,
    event: string,
  ) {
    const normalizedEvent = event.split(' ').join('_').toLowerCase();

    const data = {
      type: 'budget',
      budgetId: budget.id,
      budgetAmount: budget.amount.toString(),
      budgetName: budget.name,
      budgetDescription: budget.description ?? 'No description provided',
      budgetPeriod: budget.period,
    };

    const activityData: ActivityLogs = {
      userId,
      id: budget.id,
      createdAt: budget.createdAt,
      event: normalizedEvent,
      entityId: budget.id,
      entityType: 'budget',
      data,
    };
    this.activityNotificationQueue.add(ACTIVITY_NOTIFICATION_JOB, activityData);

    const analyticsData: AnalyticsNotificationPayload = {
      userId,
      event: normalizedEvent,
      entityId: budget.id,
      data,
    };
    this.analyticsNotificationQueue.add(
      ANALYTICS_NOTIFICATION_JOB,
      analyticsData,
    );
  }

  /**
   * Returns the start of the current period unit for a given date and budget period.
   * All history entry startDates are snapped to this value so each entry maps
   * unambiguously to exactly one period unit.
   *
   * - MONTHLY   → first day of the month  (Jan 8  → Jan 1)
   * - WEEKLY    → most recent Monday      (Wed Apr 9 → Mon Apr 7)
   * - QUARTERLY → first day of the quarter (May 1 → Apr 1)
   * - YEARLY    → first day of the year   (Aug 3 → Jan 1)
   *
   * @private
   * @param {BudgetPeriod} period - The budget's period
   * @param {Date} date - The reference date
   * @returns {Date} Start of the period at midnight UTC
   */
  private getStartOfPeriod(period: BudgetPeriod, date: Date): Date {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();

    switch (period) {
      case BudgetPeriod.WEEKLY: {
        const day = date.getUTCDay(); // 0 = Sun, 1 = Mon … 6 = Sat
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(date);
        monday.setUTCDate(date.getUTCDate() + diff);
        return new Date(
          Date.UTC(
            monday.getUTCFullYear(),
            monday.getUTCMonth(),
            monday.getUTCDate(),
          ),
        );
      }
      case BudgetPeriod.MONTHLY:
        return new Date(Date.UTC(y, m, 1));
      case BudgetPeriod.QUARTERLY: {
        // Quarters: Jan–Mar (0), Apr–Jun (3), Jul–Sep (6), Oct–Dec (9)
        const quarterStartMonth = Math.floor(m / 3) * 3;
        return new Date(Date.UTC(y, quarterStartMonth, 1));
      }
      case BudgetPeriod.YEARLY:
        return new Date(Date.UTC(y, 0, 1));
      default:
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Invalid budget period',
        });
    }
  }

  /**
   * Maps a Prisma Budget record to the proto Budget shape.
   *
   * @private
   * @param {BudgetWithOptionalJoins} budget - Prisma budget with optional category join
   * @returns {ProtoBudget}
   */
  private formatBudget(budget: BudgetWithOptionalJoins): ProtoBudget {
    return {
      id: budget.id,
      name: budget.name,
      period: budget.period,
      amount: budget.amount,
      carryOver: budget.carryOver,
      description: budget.description ?? '',
      alertThreshold: budget.alertThreshold,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
      category: this.utils.formatCategory(budget.category),
    };
  }
}
