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
  BudgetDetail,
  CreateBudgetReq,
  DeleteBudgetReq,
  GetBudgetReq,
  GetBudgetsReq,
  GetBudgetsRes,
  GetSpendingTrendReq,
  GetSpendingTrendRes,
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
      const startDate = this.utils.getStartOfPeriod(period, anchorDate);

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
            const currentPeriodStart = this.utils.getStartOfPeriod(
              budget.period,
              now,
            );

            // Find the active history entry (endDate = null)
            const activeHistory = await tx.budgetHistory.findFirst({
              where: { budgetId: budget.id, endDate: null },
              select: { id: true, startDate: true },
            });

            const activePeriodStart = activeHistory
              ? this.utils.getStartOfPeriod(
                  budget.period,
                  activeHistory.startDate,
                )
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
  async getBudgets(userId: string, req: GetBudgetsReq): Promise<GetBudgetsRes> {
    try {
      const anchor = new Date(Date.UTC(req.year, req.month, 1));
      const periodStart = this.utils.getStartOfPeriod(BudgetPeriod.MONTHLY, anchor);
      const periodEnd = this.utils.getEndOfPeriod(BudgetPeriod.MONTHLY, periodStart);

      const [budgets, allSpend] = await Promise.all([
        this.prismaService.budget.findMany({
          where: { userId },
          include: { category: true },
        }),
        this.prismaService.transaction.groupBy({
          by: ['categoryId'],
          where: { userId, type: 'EXPENSE', date: { gte: periodStart, lte: periodEnd } },
          _sum: { amount: true },
        }),
      ]);

      const budgetedIds = new Set(budgets.map((b) => b.categoryId));
      const spentMap = new Map(allSpend.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]));

      const unbudgetedSpend = allSpend.filter((r) => !budgetedIds.has(r.categoryId));
      const unbudgetedCategories = unbudgetedSpend.length
        ? await this.prismaService.category.findMany({
            where: { id: { in: unbudgetedSpend.map((r) => r.categoryId) } },
          })
        : [];

      return {
        budgets: budgets.map((b) => this.formatBudget(b, spentMap.get(b.categoryId) ?? 0)),
        unbudgeted: unbudgetedCategories.map((c) => ({
          slug: c.slug,
          name: c.name,
          color: c.color ?? '',
          icon: c.icon ?? '',
          spent: spentMap.get(c.id) ?? 0,
        })),
      };
    } catch (error) {
      this.logger.error('getBudgets error:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({ code: status.INTERNAL, message: 'An error occurred', details: error.message });
    }
  }

  async getBudget(userId: string, req: GetBudgetReq): Promise<BudgetDetail> {
    try {
      const budget = await this.prismaService.budget.findFirst({
        where: { id: req.id, userId },
        include: {
          category: true,
          budgetHistory: { orderBy: { startDate: 'asc' } },
        },
      });

      if (!budget) {
        throw new RpcException({ code: status.NOT_FOUND, message: 'Budget not found' });
      }

      return {
        budget: this.formatBudget(budget),
        history: budget.budgetHistory.map((h) => ({
          id: h.id,
          limit: h.limit,
          startDate: h.startDate.toISOString(),
          endDate: h.endDate?.toISOString(),
          createdAt: h.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({ code: status.INTERNAL, message: 'An error occurred', details: error.message });
    }
  }

  async getSpendingTrend(userId: string, req: GetSpendingTrendReq): Promise<GetSpendingTrendRes> {
    try {
      const now = new Date();
      const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (req.months - 1), 1));
      const endDate = this.utils.getEndOfPeriod(BudgetPeriod.MONTHLY, currentMonthStart);

      const transactions = await this.prismaService.transaction.findMany({
        where: { userId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
        include: { category: true },
      });

      // Pre-fill all months in range with zero so gaps render as 0 on the chart
      const monthSlots: Array<{ year: number; month: number; label: string }> = [];
      for (let i = 0; i < req.months; i++) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (req.months - 1 - i), 1));
        monthSlots.push({
          year: d.getUTCFullYear(),
          month: d.getUTCMonth(),
          label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
        });
      }

      // Group amounts by month-key → category slug
      const monthMap = new Map<string, Map<string, { slug: string; name: string; color: string; amount: number }>>();
      for (const tx of transactions) {
        const key = `${tx.date.getUTCFullYear()}-${tx.date.getUTCMonth()}`;
        if (!monthMap.has(key)) monthMap.set(key, new Map());
        const catMap = monthMap.get(key)!;
        const slug = tx.category?.slug ?? 'other';
        if (!catMap.has(slug)) {
          catMap.set(slug, { slug, name: tx.category?.name ?? 'Other', color: tx.category?.color ?? '#888', amount: 0 });
        }
        catMap.get(slug)!.amount += Number(tx.amount);
      }

      const data = monthSlots.map(({ year, month, label }) => {
        const catMap = monthMap.get(`${year}-${month}`) ?? new Map();
        const byCategory = Array.from(catMap.values());
        return { label, total: byCategory.reduce((s, c) => s + c.amount, 0), byCategory };
      });

      return { data };
    } catch (error) {
      this.logger.error('getSpendingTrend error:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({ code: status.INTERNAL, message: 'An error occurred', details: error.message });
    }
  }

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
   * Maps a Prisma Budget record to the proto Budget shape.
   *
   * @private
   * @param {BudgetWithOptionalJoins} budget - Prisma budget with optional category join
   * @returns {ProtoBudget}
   */
  private formatBudget(
    budget: BudgetWithOptionalJoins,
    spent = 0,
  ): ProtoBudget {
    return {
      id: budget.id,
      name: budget.name,
      period: budget.period,
      amount: budget.amount,
      carryOver: budget.carryOver,
      description: budget.description ?? '',
      alertThreshold: budget.alertThreshold,
      spent: String(spent),
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
      category: this.utils.formatCategory(budget.category),
    };
  }
}
