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
} from '@fintrack/types/constants/queus.constants';
import {
  Budget as ProtoBudget,
  BudgetDetail,
  CreateBudgetReq,
  DeleteBudgetReq,
  GetArchivedBudgetsRes,
  GetBudgetReq,
  GetBudgetsReq,
  GetBudgetsRes,
  GetSpendingTrendReq,
  GetSpendingTrendRes,
  RestoreBudgetReq,
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
    private readonly utils: UtilsService,
  ) {}

  /**
   * Creates a new budget for a user or re-activates a previously deactivated one.
   *
   * Uses an upsert on the `@@unique([userId, categoryId, period])` index.
   * - **Create path:** a new Budget row and its first BudgetHistory entry are
   *   inserted. `startDate` is derived from the optional `month`/`year` fields
   *   to support backdating; defaults to today when omitted.
   * - **Re-activation path (deactivated budget exists for the same category+period):**
   *   `deactivatedAt` is cleared, core fields are refreshed, and a new
   *   BudgetHistory entry is opened for the current period — preserving all
   *   prior history intact.
   *
   * Before creating the history entry the service looks for an existing
   * BudgetHistory row whose `startDate` is after the anchor date; if found its
   * `startDate` becomes the new entry's `endDate` to prevent history overlap.
   *
   * @async
   * @param {string} userId - The authenticated user's ID
   * @param {CreateBudgetReq} data - Budget creation payload; `month`/`year` are
   *   optional and used to backdate the budget period
   * @returns {Promise<ProtoBudget>} The created or re-activated budget
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

      const budget = await this.prismaService.budget.upsert({
        where: {
          userId_categoryId_period: {
            userId,
            categoryId: category.id!,
            period,
          },
        },
        create: {
          userId,
          name: data.name,
          amount: data.amount,
          description: data.description,
          alertThreshold: data.alertThreshold,
          categoryId: category.id!,
          period,
          ...(data.alertAtFrequency && {
            alertAtFrequency: data.alertAtFrequency,
          }),
          budgetHistory: { create: { limit: data.amount, startDate, endDate } },
        },
        update: {
          // Re-activate: clear deactivatedAt, refresh fields, open new history entry
          deactivatedAt: null,
          name: data.name,
          amount: data.amount,
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.alertThreshold !== undefined && {
            alertThreshold: data.alertThreshold,
          }),
          ...(data.alertAtFrequency !== undefined && {
            alertAtFrequency: data.alertAtFrequency,
          }),
          budgetHistory: { create: { limit: data.amount, startDate, endDate } },
        },
        include: { category: true },
      });

      this.callEvents(userId, budget, 'Budget Upserted');
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
   * All mutations run inside a Serializable Prisma transaction. When `amount`
   * changes, the service derives the period anchor from the required `month`
   * and `year` fields (not from server time) so the history entry is always
   * stamped with the period the user is actually editing.
   *
   * History SCD logic (three cases):
   * 1. Same period as the current active entry → limit corrected in place, no new row.
   * 2. Past period (`currentPeriodStart < activePeriodStart`) → only that past period's
   *    history entry is updated (or created ending at `activePeriodStart`). The current
   *    active entry is never touched and `budget.amount` is not overwritten.
   * 3. Newer period (month rolled over) → active entry's `endDate` is set to
   *    `currentPeriodStart` and a new open entry is created.
   *
   * @async
   * @param {string} userId - The authenticated user's ID
   * @param {UpdateBudgetReq} data - Budget update payload; `id`, `month`, and
   *   `year` are required — all other fields are optional
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

          let isPastPeriodAmountEdit = false;

          if (amountChanged) {
            const anchorDate =
              data.month !== undefined && data.year !== undefined
                ? new Date(Date.UTC(data.year, data.month, 1))
                : new Date();
            const currentPeriodStart = this.utils.getStartOfPeriod(
              budget.period,
              anchorDate,
            );

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

            const isEditingPastPeriod =
              activePeriodStart !== null &&
              currentPeriodStart.getTime() < activePeriodStart.getTime();

            if (isSamePeriod && activeHistory) {
              // Editing the current active period — correct the limit in place
              await tx.budgetHistory.update({
                where: { id: activeHistory.id },
                data: { limit: data.amount! },
              });
            } else if (isEditingPastPeriod) {
              // Editing a past period — update only that period's history entry.
              // Never close or touch the current active entry; budget.amount stays
              // as the current period's limit.
              isPastPeriodAmountEdit = true;
              const existingPastEntry = await tx.budgetHistory.findFirst({
                where: { budgetId: budget.id, startDate: currentPeriodStart },
              });
              if (existingPastEntry) {
                await tx.budgetHistory.update({
                  where: { id: existingPastEntry.id },
                  data: { limit: data.amount! },
                });
              } else {
                // No entry for this past period yet — create one ending at the
                // start of the next known period (activePeriodStart)
                await tx.budgetHistory.create({
                  data: {
                    budgetId: budget.id,
                    limit: data.amount!,
                    startDate: currentPeriodStart,
                    endDate: activePeriodStart,
                  },
                });
              }
            } else {
              // Period has rolled over to a newer month — close the old entry
              // and open a new one
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
              // Past-period edits only update history; don't overwrite the current limit
              ...(data.amount !== undefined &&
                !isPastPeriodAmountEdit && { amount: data.amount }),
              ...(data.description !== undefined && {
                description: data.description,
              }),
              ...(data.alertThreshold !== undefined && {
                alertThreshold: data.alertThreshold,
              }),
              ...(data.alertAtFrequency !== undefined && {
                alertAtFrequency: data.alertAtFrequency,
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
   * Returns all budgets for the given month/year alongside per-category spending totals.
   * Unbudgeted categories that have spend in the period are also returned so the UI
   * can surface uncovered spend.
   *
   * Only budgets that were active during the requested period are returned.
   * A budget is considered active when `deactivatedAt` is null (never deactivated)
   * or when `deactivatedAt > periodStart` (deactivated after this period began).
   *
   * The `amount` field on each returned budget reflects the effective limit for the
   * requested period, resolved from `BudgetHistory` (the entry whose `startDate <=
   * periodStart` and `endDate > periodStart OR endDate IS NULL`). Falls back to
   * `budget.amount` for budgets with no matching history entry (legacy data).
   *
   * @async
   * @public
   * @param {string} userId - The authenticated user's ID
   * @param {GetBudgetsReq} req - Year and month (0-indexed) for the period to query
   * @returns {Promise<GetBudgetsRes>} Budget list with computed spend and unbudgeted categories
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getBudgets(userId: string, req: GetBudgetsReq): Promise<GetBudgetsRes> {
    try {
      const anchor = new Date(Date.UTC(req.year, req.month, 1));
      const periodStart = this.utils.getStartOfPeriod(
        BudgetPeriod.MONTHLY,
        anchor,
      );
      const periodEnd = this.utils.getEndOfPeriod(
        BudgetPeriod.MONTHLY,
        periodStart,
      );

      const [budgets, allSpend] = await Promise.all([
        this.prismaService.budget.findMany({
          where: {
            userId,
            OR: [
              { deactivatedAt: null },
              { deactivatedAt: { gt: periodStart } },
            ],
          },
          include: { category: true },
        }),
        this.prismaService.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: periodStart, lte: periodEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      const budgetedIds = new Set(budgets.map((b) => b.categoryId));
      const spentMap = new Map(
        allSpend.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]),
      );

      // Batch-resolve the effective limit for each budget at periodStart.
      const effectiveLimitRows = budgets.length
        ? await this.prismaService.budgetHistory.findMany({
            where: {
              budgetId: { in: budgets.map((b) => b.id) },
              startDate: { lte: periodStart },
              OR: [{ endDate: null }, { endDate: { gt: periodStart } }],
            },
            select: { budgetId: true, limit: true },
            orderBy: { startDate: 'asc' },
          })
        : [];
      const limitMap = new Map<string, number>(
        effectiveLimitRows.map((h) => [h.budgetId, h.limit]),
      );

      const unbudgetedCategories = await this.prismaService.category.findMany({
        where: { id: { notIn: budgets.map((b) => b.categoryId) } },
      });

      return {
        budgets: budgets.map((b) =>
          this.formatBudget(
            b,
            spentMap.get(b.categoryId) ?? 0,
            limitMap.get(b.id),
          ),
        ),
        unbudgeted: unbudgetedCategories.map((c) => ({
          slug: c.slug,
          name: c.name,
          color: c.color ?? '',
          icon: c.icon ?? '',
          spent: spentMap.get(c.id) ?? 0,
          id: c.id,
          isUserOwned: !c.isSystem && !!c.userId,
        })),
      };
    } catch (error) {
      this.logger.error('getBudgets error:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Returns a single budget with its full history timeline and the `spent`
   * total scoped to the explicitly requested period.
   *
   * The `month` and `year` fields on `GetBudgetReq` determine the period used
   * to aggregate EXPENSE transactions for the `spent` field — they are never
   * inferred from server time, so viewing a February budget from a May session
   * always returns the correct February spend.
   *
   * The `amount` field on the returned budget reflects the effective limit for
   * the requested period, derived from the already-loaded `BudgetHistory` entries
   * (the SCD entry whose `startDate <= periodStart` and `endDate > periodStart OR
   * endDate IS NULL`). Falls back to `budget.amount` if no entry covers the period.
   *
   * @async
   * @public
   * @param {string} userId - The authenticated user's ID
   * @param {GetBudgetReq} req - Budget ID plus `month` (0-indexed) and `year`
   *   that scope the spent total
   * @returns {Promise<BudgetDetail>} Budget detail with history entries ordered
   *   oldest-first and a period-scoped `spent` total
   * @throws {RpcException} NOT_FOUND if the budget does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getBudget(userId: string, req: GetBudgetReq): Promise<BudgetDetail> {
    try {
      const budget = await this.prismaService.budget.findFirst({
        where: { id: req.id, userId },
        include: {
          category: true,
          budgetHistory: {
            orderBy: { startDate: 'asc' },
          },
        },
      });

      if (!budget) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Budget not found',
        });
      }

      const anchor = new Date(Date.UTC(req.year, req.month, 1));
      const periodStart = this.utils.getStartOfPeriod(
        BudgetPeriod.MONTHLY,
        anchor,
      );
      const periodEnd = this.utils.getEndOfPeriod(
        BudgetPeriod.MONTHLY,
        periodStart,
      );
      const aggregates = await this.prismaService.transaction.aggregate({
        where: {
          categoryId: budget.categoryId,
          userId,
          type: 'EXPENSE',
          date: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      });

      // Resolve effective limit from already-loaded history — no extra query needed.
      // SCD is non-overlapping so at most one entry matches.
      const effectiveEntry = budget.budgetHistory.find(
        (h) =>
          h.startDate <= periodStart &&
          (h.endDate === null || h.endDate > periodStart),
      );

      return {
        budget: this.formatBudget(
          budget,
          aggregates._sum.amount ?? 0,
          effectiveEntry?.limit,
        ),
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
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Returns a monthly spending breakdown across the requested number of past months.
   * Each slot is pre-filled with zero so months with no transactions still appear on the chart.
   * Amounts are grouped per category slug within each month.
   *
   * @async
   * @public
   * @param {string} userId - The authenticated user's ID
   * @param {GetSpendingTrendReq} req - Number of months to include (counting back from the current month)
   * @returns {Promise<GetSpendingTrendRes>} Ordered array of monthly spend totals with per-category breakdown
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getSpendingTrend(
    userId: string,
    req: GetSpendingTrendReq,
  ): Promise<GetSpendingTrendRes> {
    try {
      const now = new Date();
      const currentMonthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      const startDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (req.months - 1), 1),
      );
      const endDate = this.utils.getEndOfPeriod(
        BudgetPeriod.MONTHLY,
        currentMonthStart,
      );

      const transactions = await this.prismaService.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: startDate, lte: endDate },
        },
        include: { category: true },
      });

      // Pre-fill all months in range with zero so gaps render as 0 on the chart
      const monthSlots: Array<{ year: number; month: number; label: string }> =
        [];
      for (let i = 0; i < req.months; i++) {
        const d = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - (req.months - 1 - i),
            1,
          ),
        );
        monthSlots.push({
          year: d.getUTCFullYear(),
          month: d.getUTCMonth(),
          label: d.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          }),
        });
      }

      // Group amounts by month-key → category slug
      const monthMap = new Map<
        string,
        Map<
          string,
          { slug: string; name: string; color: string; amount: number }
        >
      >();
      for (const tx of transactions) {
        const key = `${tx.date.getUTCFullYear()}-${tx.date.getUTCMonth()}`;
        if (!monthMap.has(key)) monthMap.set(key, new Map());
        const catMap = monthMap.get(key)!;
        const slug = tx.category?.slug ?? 'other';
        if (!catMap.has(slug)) {
          catMap.set(slug, {
            slug,
            name: tx.category?.name ?? 'Other',
            color: tx.category?.color ?? '#888',
            amount: 0,
          });
        }
        catMap.get(slug)!.amount += Number(tx.amount);
      }

      const data = monthSlots.map(({ year, month, label }) => {
        const catMap = monthMap.get(`${year}-${month}`) ?? new Map();
        const byCategory = Array.from(catMap.values());
        return {
          label,
          total: byCategory.reduce((s, c) => s + c.amount, 0),
          byCategory,
        };
      });

      return { data };
    } catch (error) {
      this.logger.error('getSpendingTrend error:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Deactivates or permanently deletes a budget depending on `hardDelete`.
   *
   * **Soft-deactivate** (`hardDelete: false`, default): sets `deactivatedAt` to
   * the first day of the current server UTC month and closes the open
   * BudgetHistory entry at the same date. The budget and all prior history
   * remain in the database. `getBudgets` will hide this budget for the current
   * and future months but continue to show it for past months where it was
   * active. The budget can be restored at any time via `restoreBudget`.
   *
   * **Hard-delete** (`hardDelete: true`): permanently removes the Budget row.
   * All BudgetHistory rows are cascade-deleted. This is irreversible.
   *
   * @async
   * @public
   * @param {string} userId - The authenticated user's ID
   * @param {DeleteBudgetReq} data - Contains the budget ID and `hardDelete` flag
   * @returns {Promise<Empty>} Empty response on success
   * @throws {RpcException} NOT_FOUND if the budget does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async deleteBudget(userId: string, data: DeleteBudgetReq): Promise<Empty> {
    try {
      const budget = await this.prismaService.budget.findFirst({
        where: { id: data.id, userId },
        include: { category: true },
      });
      if (!budget)
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Budget not found',
        });

      if (data.hardDelete) {
        await this.prismaService.budget.delete({ where: { id: data.id } });
      } else {
        const now = new Date();
        const deactivationDate = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
        );
        await this.prismaService.$transaction([
          this.prismaService.budget.update({
            where: { id: data.id },
            data: { deactivatedAt: deactivationDate },
          }),
          this.prismaService.budgetHistory.updateMany({
            where: { budgetId: data.id, endDate: null },
            data: { endDate: deactivationDate },
          }),
        ]);
      }

      this.callEvents(
        userId,
        budget,
        data.hardDelete ? 'Budget Deleted' : 'Budget Deactivated',
      );
      return {};
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Returns all soft-deleted budgets for the user, ordered newest-deactivated first.
   *
   * @async
   * @public
   * @param {string} userId - The authenticated user's ID
   * @returns {Promise<GetArchivedBudgetsRes>} List of archived budgets
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getArchivedBudgets(userId: string): Promise<GetArchivedBudgetsRes> {
    try {
      const budgets = await this.prismaService.budget.findMany({
        where: { userId, deactivatedAt: { not: null } },
        include: { category: true },
        orderBy: { deactivatedAt: 'desc' },
      });
      return { budgets: budgets.map((b) => this.formatBudget(b)) };
    } catch (error) {
      this.logger.error('getArchivedBudgets error:', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: error.message,
      });
    }
  }

  /**
   * Restores a soft-deleted budget, clearing deactivatedAt and reopening a
   * history entry for the current period. If a history entry already exists
   * for the current period start (deactivated and restored within the same
   * month) it is reopened in place rather than creating a duplicate.
   *
   * @async
   * @public
   * @param {string} userId - The authenticated user's ID
   * @param {RestoreBudgetReq} data - Contains the budget ID to restore
   * @returns {Promise<ProtoBudget>} The restored budget
   * @throws {RpcException} NOT_FOUND if the budget does not exist or is not archived
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async restoreBudget(
    userId: string,
    data: RestoreBudgetReq,
  ): Promise<ProtoBudget> {
    try {
      const budget = await this.prismaService.budget.findFirst({
        where: { id: data.id, userId, deactivatedAt: { not: null } },
        include: { category: true },
      });
      if (!budget)
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Archived budget not found',
        });

      const now = new Date();
      const startDate = this.utils.getStartOfPeriod(budget.period, now);

      const restored = await this.prismaService.$transaction(async (tx) => {
        await tx.budgetHistory.upsert({
          where: {
            budgetId_startDate: { budgetId: budget.id, startDate: startDate },
          },
          create: {
            budgetId: budget.id,
            limit: budget.amount,
            startDate,
            endDate: null,
          },
          update: {
            endDate: null,
          },
        });

        return tx.budget.update({
          where: { id: budget.id },
          data: { deactivatedAt: null },
          include: { category: true },
        });
      }, {});

      this.callEvents(userId, restored, 'Budget Restored');
      return this.formatBudget(restored);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
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
    historicalAmount?: number,
  ): ProtoBudget {
    return {
      id: budget.id,
      name: budget.name,
      period: budget.period,
      amount: historicalAmount ?? budget.amount,
      carryOver: budget.carryOver,
      description: budget.description ?? '',
      alertThreshold: budget.alertThreshold,
      alertAtFrequency: budget.alertAtFrequency,
      spent: String(spent),
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
      deactivatedAt: budget.deactivatedAt?.toISOString() ?? undefined,
      category: this.utils.formatCategory(budget.category),
    };
  }
}
