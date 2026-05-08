import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import {
  Contribution as ProtoContribution,
  CreateGoalContributionReq,
  CreateGoalReq,
  GetGoalsReq,
  GetGoalsRes,
  GoalReq,
  Goal as ProtoGoal,
  UpdateGoalReq,
  DeleteGoalContributionReq,
  UpdateGoalContributionReq,
  GoalsAggregate,
  MonthlyContributionSummary,
  ProjectionPoint,
  UpdateGoalStatusReq,
} from '@fintrack/types/protos/finance/goal';
import {
  ACTIVITY_NOTIFICATION_JOB,
  ACTIVITY_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { GoalMonthlyGrouping, GoalPace } from '@fintrack/types/interfaces/goal';
import {
  Goal,
  GoalContribution,
  GoalPriority,
  Goalstatus,
  Prisma,
  TransactionType,
} from '@fintrack/database/types';
import { ActivityLogs } from '@fintrack/database/types';
import { format } from '@fintrack/utils/date';
import { Empty } from '@fintrack/types/protos/finance/transaction';

import {
  TransactionService,
  TransactionWithOptionalJoins,
} from '../transaction/transaction.service';

type GoalContributionWithTransaction = GoalContribution & {
  transaction?: TransactionWithOptionalJoins | null;
};

type GoalWithOptionalJoins = Goal & {
  contributedAmount?: number;
  contributions?: GoalContributionWithTransaction[];
};

/**
 * Service responsible for all goal and goal-contribution operations.
 * Processes gRPC requests for creating, reading, updating, and deleting goals
 * and their associated contributions.
 *
 * Contribution overflow rule:
 * - The running sum of all contributions must never exceed the goal's targetAmount.
 * - On update, the current contribution is excluded from the aggregate before
 *   the new value is added, preventing double-counting.
 *
 * Transaction linkage:
 * - A contribution may optionally reference an INCOME transaction.
 * - When transactionId is supplied the contribution date is overridden with
 *   the transaction's date (DB remains the source of truth).
 *
 * @class GoalService
 */
@Injectable()
export class GoalService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly transactionService: TransactionService,
    @InjectQueue(ACTIVITY_NOTIFICATION_QUEUE)
    private readonly activityQueue: Queue,
  ) {}

  /**
   * Creates a new savings goal for a user.
   * targetDate must be in the future; priority defaults to MEDIUM at the DB level.
   *
   * @async
   * @param {string} userId
   * @param {CreateGoalReq} data
   * @returns {Promise<ProtoGoal>}
   * @throws {RpcException} FAILED_PRECONDITION if targetDate is not in the future
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async createGoal(userId: string, data: CreateGoalReq): Promise<ProtoGoal> {
    try {
      if (!this.isFutureDate(data.targetDate)) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Target date must be in the future',
        });
      }

      const goal = await this.prismaService.goal.create({
        data: {
          userId,
          name: data.name,
          targetAmount: data.targetAmount,
          description: data.description,
          targetDate: new Date(data.targetDate),
        },
      });

      this.callEvents(userId, goal, 'Goal Created');
      return this.formatGoal(goal);
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
   * Returns all goals for a user with optional filters, the total contributed
   * amount per goal, and a full month-by-month contribution breakdown.
   *
   * Filters:
   * - status   → array of Goalstatus values (ACTIVE | COMPLETED | ON_HOLD | CANCELLED)
   * - priority → array of GoalPriority values (LOW | MEDIUM | HIGH)
   * - amount + operator → filter on targetAmount using a whitelisted comparator
   *   (gt | gte | lt | lte | eq | ne). Invalid operators are silently ignored.
   *
   * After loading goals, a single raw SQL query groups all contribution rows by
   * (goalId, "YYYY-MM") across the full history of the goal. From those grouped
   * rows two lookup maps are built in one pass:
   *
   *   monthlyMap  — per-goal breakdown used to populate the mini contribution
   *                 chart on each goal card (all-time history, ordered ASC):
   *                 Map<goalId, Map<"YYYY-MM", monthTotal>>
   *                 e.g. { "goal-abc" => { "2025-11" => 40000, "2025-12" => 35000 } }
   *
   *   totalMap    — per-goal running sum derived from the same rows, used as
   *                 the contributedAmount field (avoids a separate aggregation
   *                 query):
   *                 Map<goalId, allTimeTotal>
   *                 e.g. { "goal-abc" => 75000 }
   *
   * Both maps are populated in a single O(n) loop over the SQL result set.
   * The raw SQL query is skipped entirely when goalIds is empty.
   *
   * @async
   * @param {string} userId
   * @param {GetGoalsReq} data
   * @returns {Promise<GetGoalsRes>}
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getGoals(userId: string, data: GetGoalsReq): Promise<GetGoalsRes> {
    try {
      const query: Prisma.GoalWhereInput = { userId };

      if (data.status?.length) {
        query.status = { in: data.status as Goalstatus[] };
      }

      if (data.priority?.length) {
        query.priority = { in: data.priority as GoalPriority[] };
      }

      if (data.amount && data.operator) {
        const amount = parseFloat(data.amount);
        if (!isNaN(amount)) {
          // Whitelist-only — never pass the operator string directly to Prisma
          const operatorMap: Record<string, Prisma.FloatFilter<'Goal'>> = {
            gt: { gt: amount },
            gte: { gte: amount },
            lt: { lt: amount },
            lte: { lte: amount },
            eq: { equals: amount },
            ne: { not: amount },
          };
          const filter = operatorMap[data.operator];
          if (filter) query.targetAmount = filter;
        }
      }

      const goals = await this.prismaService.goal.findMany({
        where: query,
        orderBy: { createdAt: 'desc' },
      });

      const goalIds = goals.map((g) => g.id);

      // Aggregate all contribution rows grouped by (goalId, month) at the DB level.
      // Doing the GROUP BY in SQL avoids loading individual contribution rows into memory.
      const monthlyGroupings = goalIds.length
        ? await this.prismaService.$queryRaw<GoalMonthlyGrouping[]>`
            SELECT "goalId",
                   TO_CHAR("date", 'YYYY-MM') AS month,
                   SUM(amount)::float         AS total
            FROM   "GoalContribution"
            WHERE  "goalId" = ANY(${goalIds}::text[])
            GROUP  BY "goalId", TO_CHAR("date", 'YYYY-MM')
            ORDER  BY "goalId", month ASC
          `
        : [];

      // Single pass over the SQL result to build both lookup maps simultaneously.
      const monthlyMap = new Map<string, Map<string, number>>();
      const totalMap = new Map<string, number>();

      for (const { goalId, month, total } of monthlyGroupings) {
        // monthlyMap: goalId → (month → monthTotal)
        if (!monthlyMap.has(goalId)) monthlyMap.set(goalId, new Map());
        monthlyMap.get(goalId)!.set(month, total);

        // totalMap: goalId → allTimeTotal (sum across all months)
        totalMap.set(goalId, (totalMap.get(goalId) ?? 0) + total);
      }

      return {
        goals: goals.map((goal) =>
          this.formatGoal(
            { ...goal, contributedAmount: totalMap.get(goal.id) ?? 0 },
            monthlyMap.get(goal.id),
          ),
        ),
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
   * Computes a health snapshot across all of the user's savings goals.
   *
   * ── Query strategy ─────────────────────────────────────────────────────────
   * Four independent DB queries run in parallel via Promise.all:
   *
   *   Q1a — goal.groupBy(status)   Returns ≤ 3 rows (one per status).
   *                                Provides status counts and the sum of
   *                                targetAmount for ACTIVE goals. Never grows
   *                                with the number of goals.
   *
   *   Q1b — goal.findMany(ACTIVE)  Full records for ACTIVE goals only — the
   *                                only subset needed for on-track evaluation
   *                                and the savings projection. Skips COMPLETED
   *                                and ON_HOLD rows entirely.
   *
   *   Q2 — goalContribution.groupBy  All-time contribution total per goal.
   *                                Used for totalSaved, activePercent, on-track
   *                                remaining balance, and projection base values.
   *
   *   Q3 — goalContribution.findMany  Individual rows from the last 12 calendar
   *                                months. Fine-grained data needed to build
   *                                monthBuckets and goalMonthBuckets, which
   *                                feed streak, heatmap, avgMonthly, and
   *                                per-goal on-track rate calculations.
   *
   * After the four queries, in-memory work is delegated to focused private
   * helpers (one concern each). The total allocation is O(goals + contributions).
   *
   * ── Returned fields ────────────────────────────────────────────────────────
   * totalSaved           Grand total of all contributions across every goal and
   *                      every status (ACTIVE, COMPLETED, ON_HOLD). This is the
   *                      user's lifetime savings figure — money set aside is real
   *                      regardless of whether the goal is still being pursued.
   *
   * activeTarget         Sum of targetAmount for ACTIVE goals only. ON_HOLD and
   *                      COMPLETED goals are excluded — this reflects the user's
   *                      current active workload, not all-time ambition.
   *
   * activePercent        Progress on ACTIVE goals only.
   *                      Formula: (contributions to ACTIVE goals) / activeTarget × 100,
   *                      capped at 100. Using active-goal contributions as the numerator
   *                      prevents ON_HOLD goal savings — which can be large — from
   *                      inflating the percent against an active-only denominator.
   *                      Returns 0 when there are no active goals.
   *
   * activeCount          Goals currently in progress (Goalstatus.ACTIVE).
   * completedCount       Goals fully funded and reached (Goalstatus.COMPLETED).
   * onHoldCount          Goals the user has paused (Goalstatus.ON_HOLD).
   *
   * avgMonthlyContribution  Mean monthly contribution over complete calendar months
   *                      before the current month. The current (partial) month is
   *                      excluded. Divided by activePeriods — months that actually
   *                      had contributions — not a fixed constant, preventing
   *                      dilution when the user skipped a month or two.
   *
   * onTrackCount         ACTIVE goals where the user's goal-specific average
   *                      monthly contribution >= the pace required to reach the
   *                      target by targetDate. Goals past their due date count
   *                      as overdue, not on-track.
   *
   * streakMonths         Consecutive complete calendar months (backwards from the
   *                      last complete month) with >= 1 contribution to any goal.
   *                      The current month is excluded — it may not have ended
   *                      yet. Bounded by monthBuckets.size, no hardcoded cap.
   *
   * contributionHeatmap  Fixed 12-element array (oldest → newest) of monthly
   *                      cross-goal totals, suitable for a GitHub-style heat grid.
   *                      Months with no contributions carry amount = 0.
   *
   * projectionData       15-point time series: 3 past actual months (isProjected:
   *                      false) + 12 future projected months (isProjected: true).
   *                      Future points sum each ACTIVE goal's required monthly pace
   *                      up to its target date.
   *
   * @async
   * @param {string} userId
   * @returns {Promise<GoalsAggregate>}
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getGoalsAggregate(userId: string): Promise<GoalsAggregate> {
    try {
      const now = new Date();
      const currentMonth = format(now, 'YYYY-MM');
      const twelveMonthsAgo = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
      );

      // ── Parallel DB fetch ──────────────────────────────────────────────────
      const [statusCounts, activeGoals, contribAggs, recentContributions] =
        await Promise.all([
          // Q1a: one aggregate row per status — always ≤ 3 rows regardless of goal count
          this.prismaService.goal.groupBy({
            by: ['status'],
            where: { userId },
            _count: { id: true },
            _sum: { targetAmount: true },
          }),

          // Q1b: ACTIVE goal details for on-track evaluation and projection
          this.prismaService.goal.findMany({
            where: { userId, status: Goalstatus.ACTIVE },
            select: { id: true, targetAmount: true, targetDate: true },
          }),

          // Q2: all-time contribution total per goal (one aggregate row per goal)
          this.prismaService.goalContribution.groupBy({
            by: ['goalId'],
            where: { goal: { userId } },
            _sum: { amount: true },
          }),

          // Q3: individual contribution rows for the last 12 months
          this.prismaService.goalContribution.findMany({
            where: { goal: { userId }, date: { gte: twelveMonthsAgo } },
            select: { date: true, amount: true, goalId: true },
          }),
        ]);

      // ── Status counts + active target (Q1a) ────────────────────────────────
      let activeCount = 0;
      let completedCount = 0;
      let onHoldCount = 0;
      let activeTarget = 0;

      for (const row of statusCounts) {
        const count = row._count.id;
        if (row.status === Goalstatus.ACTIVE) {
          activeCount = count;
          activeTarget = Number(row._sum.targetAmount ?? 0);
        } else if (row.status === Goalstatus.COMPLETED) {
          completedCount = count;
        } else if (row.status === Goalstatus.ON_HOLD) {
          onHoldCount = count;
        }
      }

      // ── Contribution totals ─────────────────────────────────────────────────
      const allTimeTotalMap = this.buildAllTimeTotalMap(contribAggs);

      // totalSaved spans every status — the user's lifetime savings figure
      const totalSaved = Array.from(allTimeTotalMap.values()).reduce(
        (s, v) => s + v,
        0,
      );

      // activeSaved is scoped to ACTIVE goals only to prevent ON_HOLD savings
      // from inflating activePercent against an active-only denominator
      const activeSaved = activeGoals.reduce(
        (s, g) => s + (allTimeTotalMap.get(g.id) ?? 0),
        0,
      );
      const activePercent =
        activeTarget > 0
          ? Math.min(100, (activeSaved / activeTarget) * 100)
          : 0;

      // ── Monthly bucket maps ─────────────────────────────────────────────────
      const { monthBuckets, goalMonthBuckets } =
        this.buildMonthlyBuckets(recentContributions);

      // ── Aggregate metrics — each helper owns exactly one concern ────────────
      const avgMonthlyContribution = this.computeAvgMonthlyContribution(
        monthBuckets,
        currentMonth,
      );
      const streakMonths = this.computeStreak(monthBuckets, now);
      const contributionHeatmap = this.buildContributionHeatmap(
        monthBuckets,
        now,
      );
      const { onTrackCount, overdueCount } = this.computeOnTrackAndOverdue(
        activeGoals,
        allTimeTotalMap,
        goalMonthBuckets,
        currentMonth,
        now,
      );
      const projectionData = this.buildProjectionData(
        activeGoals,
        allTimeTotalMap,
        monthBuckets,
        currentMonth,
        now,
      );

      return {
        totalSaved,
        activeTarget,
        activePercent,
        activeCount,
        completedCount,
        onHoldCount,
        overdueCount,
        avgMonthlyContribution,
        onTrackCount,
        streakMonths,
        contributionHeatmap,
        projectionData,
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
   * Returns a single goal by ID including all contributions and their linked
   * transactions (with category).
   *
   * @async
   * @param {string} userId
   * @param {GoalReq} data
   * @returns {Promise<ProtoGoal>}
   * @throws {RpcException} NOT_FOUND if goal does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getGoal(userId: string, data: GoalReq): Promise<ProtoGoal> {
    try {
      const goal = await this.prismaService.goal.findFirst({
        where: { id: data.id, userId },
        include: {
          contributions: {
            include: {
              transaction: {
                include: { category: true },
              },
            },
          },
        },
      });

      if (!goal) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      return this.formatGoal(goal as GoalWithOptionalJoins);
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
   * Updates an existing goal.
   *
   * If targetAmount changes the service re-evaluates goal status:
   * - sum of contributions === new targetAmount → COMPLETED
   * - sum < new targetAmount → ACTIVE
   * - sum > new targetAmount → FAILED_PRECONDITION (cannot reduce below contributed)
   *
   * If targetDate changes it must still be in the future.
   *
   * @async
   * @param {string} userId
   * @param {UpdateGoalReq} data
   * @returns {Promise<ProtoGoal>}
   * @throws {RpcException} NOT_FOUND if goal does not exist or belongs to another user
   * @throws {RpcException} FAILED_PRECONDITION if new amount is below contributions or date is past
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async updateGoal(userId: string, data: UpdateGoalReq): Promise<ProtoGoal> {
    try {
      const goal = await this.prismaService.goal.findFirst({
        where: { id: data.id, userId },
        select: { id: true, targetAmount: true, status: true },
      });

      if (!goal) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      const hasAmountChanged =
        data.targetAmount && data.targetAmount !== goal.targetAmount;
      let goalstatus = goal.status;

      if (hasAmountChanged) {
        const contributed = await this.prismaService.goalContribution.aggregate(
          {
            _sum: { amount: true },
            where: { goalId: goal.id },
          },
        );

        const sum = contributed._sum.amount ?? 0;

        if (sum > data.targetAmount!) {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: 'Goal contributions exceed the target amount',
          });
        }

        // status resets regardless of what it was before
        goalstatus =
          parseFloat(sum.toFixed(2)) ===
          parseFloat(data.targetAmount!.toFixed(2))
            ? Goalstatus.COMPLETED
            : Goalstatus.ACTIVE;
      }

      if (data.targetDate && !this.isFutureDate(data.targetDate)) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Target date must be in the future',
        });
      }

      const priority = data.priority as GoalPriority;
      const updatedGoal = await this.prismaService.goal.update({
        where: { id: goal.id },
        data: {
          status: goalstatus,
          ...(data.name && { name: data.name }),
          ...(priority && { priority }),
          ...(data.description && { description: data.description }),
          ...(data.targetAmount && { targetAmount: data.targetAmount }),
          ...(data.targetDate && { targetDate: new Date(data.targetDate) }),
        },
      });

      this.callEvents(userId, updatedGoal, 'Goal Updated');
      return this.formatGoal(updatedGoal as GoalWithOptionalJoins);
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
   * Manually changes the status of a goal to ACTIVE or ON_HOLD.
   *
   * COMPLETED is intentionally excluded from the allowed set — it is an
   * auto-only status set by `contributeToGoal` when the running contribution
   * sum reaches `targetAmount`. Allowing manual completion would bypass that
   * invariant and produce inconsistent aggregate metrics.
   *
   * Guards:
   * - Rejects unknown / disallowed status values with INVALID_ARGUMENT before
   *   they reach Prisma, so the caller always gets a clean gRPC error.
   * - Rejects any status change on an already-COMPLETED goal with
   *   FAILED_PRECONDITION — once a goal is completed it is immutable via this
   *   endpoint (it can only be deleted or have its targetAmount raised via
   *   updateGoal, which re-evaluates completion automatically).
   *
   * @async
   * @param {string} userId
   * @param {UpdateGoalStatusReq} data - { id: goalId, status: 'ACTIVE' | 'ON_HOLD' }
   * @returns {Promise<ProtoGoal>}
   * @throws {RpcException} INVALID_ARGUMENT  if status is not one of the allowed values
   * @throws {RpcException} NOT_FOUND         if goal does not exist or belongs to another user
   * @throws {RpcException} FAILED_PRECONDITION if the goal is already COMPLETED
   * @throws {RpcException} INTERNAL          on unexpected errors
   */
  async updateGoalStatus(
    userId: string,
    data: UpdateGoalStatusReq,
  ): Promise<ProtoGoal> {
    const ALLOWED_STATUSES: Goalstatus[] = [
      Goalstatus.ACTIVE,
      Goalstatus.ON_HOLD,
    ];

    try {
      if (!ALLOWED_STATUSES.includes(data.status as Goalstatus)) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }

      const goal = await this.prismaService.goal.findFirst({
        where: { id: data.id, userId },
        select: { id: true, status: true },
      });

      if (!goal) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      if (goal.status === Goalstatus.COMPLETED) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Cannot change the status of a completed goal',
        });
      }

      const updatedGoal = await this.prismaService.goal.update({
        where: { id: goal.id, userId },
        data: { status: data.status as Goalstatus },
      });

      this.callEvents(userId, updatedGoal, 'Goal Status Updated');
      return this.formatGoal(updatedGoal as GoalWithOptionalJoins);
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
   * Permanently deletes a goal and all its contributions (cascade).
   *
   * @async
   * @param {string} userId
   * @param {GoalReq} data
   * @returns {Promise<Empty>}
   * @throws {RpcException} NOT_FOUND if goal does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async deleteGoal(userId: string, data: GoalReq): Promise<Empty> {
    try {
      const goal = await this.prismaService.goal.findUnique({
        where: { id: data.id, userId },
        select: { id: true },
      });

      if (!goal) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      const deletedGoal = await this.prismaService.goal.delete({
        where: { id: data.id },
      });

      this.callEvents(
        userId,
        deletedGoal as GoalWithOptionalJoins,
        'Goal Deleted',
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
   * Records a contribution toward a goal.
   *
   * Overflow check: the running total of existing contributions plus the new
   * amount must not exceed the goal's targetAmount.
   *
   * Transaction linkage: when transactionId is provided the contribution date
   * is overridden with the linked INCOME transaction's date.
   *
   * @async
   * @param {string} userId
   * @param {CreateGoalContributionReq} data
   * @returns {Promise<ProtoContribution>}
   * @throws {RpcException} NOT_FOUND if goal or transaction does not exist
   * @throws {RpcException} FAILED_PRECONDITION if contribution would exceed targetAmount
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async createContribution(
    userId: string,
    data: CreateGoalContributionReq,
  ): Promise<ProtoContribution> {
    try {
      const goal = await this.prismaService.goal.findUnique({
        where: { id: data.goalId, userId },
        select: {
          id: true,
          targetAmount: true,
          _count: { select: { contributions: true } },
        },
      });

      if (!goal) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Goal not found',
        });
      }

      let sum = 0;
      if (goal._count.contributions > 0) {
        const summary = await this.prismaService.goalContribution.aggregate({
          where: { goal: { userId, id: data.goalId } },
          _sum: { amount: true },
        });
        sum = (summary._sum.amount ?? 0) + data.amount;
      }

      // Contributions cannot exceed the goal target
      if (
        parseFloat(sum.toFixed(2)) > parseFloat(goal.targetAmount.toFixed(2))
      ) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Contributions would exceed the goal target amount',
        });
      }

      if (data.transactionId) {
        const tx = await this.resolveTransaction(userId, data.transactionId);
        if (data.amount > tx.amount) {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message:
              'Contribution amount cannot exceed the linked transaction amount',
          });
        }
        data.date = tx.date;
      }

      const contribution = await this.prismaService.goalContribution.create({
        data: {
          amount: data.amount,
          date: new Date(data.date),
          description: data.description,
          goalId: goal.id,
          transactionId: data.transactionId,
        },
      });

      this.callContributionEvents(
        userId,
        contribution,
        goal.id,
        'Goal Contribution Created',
      );
      return this.formatContribution(contribution);
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
   * Updates an existing contribution.
   *
   * Overflow check: the sum of all OTHER contributions for the goal plus the
   * new amount must not exceed targetAmount (current contribution is excluded
   * to prevent double-counting).
   *
   * Transaction linkage: when transactionId changes the date is overridden
   * with the new INCOME transaction's date.
   *
   * @async
   * @param {string} userId
   * @param {UpdateGoalContributionReq} data
   * @returns {Promise<ProtoContribution>}
   * @throws {RpcException} NOT_FOUND if contribution or transaction does not exist
   * @throws {RpcException} FAILED_PRECONDITION if new amount would exceed targetAmount
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async updateContribution(
    userId: string,
    data: UpdateGoalContributionReq,
  ): Promise<ProtoContribution> {
    try {
      const [contribution, goal] = await Promise.all([
        this.prismaService.goalContribution.findFirst({
          where: {
            id: data.goalContributionId,
            goal: { id: data.goalId, userId },
          },
          select: { id: true, amount: true },
        }),
        this.prismaService.goal.findUnique({
          where: { id: data.goalId },
          select: { targetAmount: true },
        }),
      ]);

      if (!contribution) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Goal contribution not found',
        });
      }

      if (data.amount) {
        const summary = await this.prismaService.goalContribution.aggregate({
          where: {
            goal: { userId, id: data.goalId },
            id: { not: contribution.id },
          },
          _sum: { amount: true },
        });

        // Sum of all other contributions + the new amount being set
        const sum = (summary._sum.amount ?? 0) + data.amount;

        if (
          parseFloat(sum.toFixed(2)) > parseFloat(goal!.targetAmount.toFixed(2))
        ) {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: 'Contributions would exceed the goal target amount',
          });
        }
      }

      if (data.transactionId) {
        const tx = await this.resolveTransaction(userId, data.transactionId);
        const amountToCheck = data.amount ?? contribution.amount;
        if (amountToCheck > tx.amount) {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message:
              'Contribution amount cannot exceed the linked transaction amount',
          });
        }
        data.date = tx.date;
      }

      const updatedContribution =
        await this.prismaService.goalContribution.update({
          where: { id: contribution.id },
          data: {
            ...(data.amount && { amount: data.amount }),
            ...(data.date && { date: new Date(data.date) }),
            ...(data.description && { description: data.description }),
            ...(data.transactionId && { transactionId: data.transactionId }),
          },
        });

      this.callContributionEvents(
        userId,
        updatedContribution,
        data.goalId,
        'Contribution Updated',
      );
      return this.formatContribution(updatedContribution);
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
   * Permanently deletes a contribution from a goal.
   *
   * @async
   * @param {string} userId
   * @param {DeleteGoalContributionReq} data
   * @returns {Promise<Empty>}
   * @throws {RpcException} NOT_FOUND if contribution does not exist or belongs to another user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async deleteContribution(
    userId: string,
    data: DeleteGoalContributionReq,
  ): Promise<Empty> {
    try {
      const contribution = await this.findContributionOrThrow(
        userId,
        data.goalId,
        data.goalContributionId,
      );

      const deletedContribution =
        await this.prismaService.goalContribution.delete({
          where: { id: contribution.id },
        });

      this.callContributionEvents(
        userId,
        deletedContribution,
        data.goalId,
        'Goal Contribution Deleted',
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
   * Finds a contribution scoped to user+goal or throws NOT_FOUND.
   *
   * @private
   */
  private async findContributionOrThrow(
    userId: string,
    goalId: string,
    contributionId: string,
  ): Promise<{ id: string }> {
    const contribution = await this.prismaService.goalContribution.findFirst({
      where: { id: contributionId, goal: { id: goalId, userId } },
      select: { id: true },
    });

    if (!contribution) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Goal contribution not found',
      });
    }

    return contribution;
  }

  /**
   * Validates an INCOME transaction belongs to the user and returns its date
   * and amount. Throws NOT_FOUND if the transaction does not exist or is not
   * an INCOME type.
   *
   * @private
   */
  private async resolveTransaction(
    userId: string,
    transactionId: string,
  ): Promise<{ date: string; amount: number }> {
    const transaction = await this.prismaService.transaction.findFirst({
      where: { id: transactionId, userId, type: TransactionType.INCOME },
      select: { id: true, date: true, amount: true },
    });

    if (!transaction) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Transaction not found',
      });
    }

    return {
      date: transaction.date.toISOString(),
      amount: Number(transaction.amount),
    };
  }

  // ── getGoalsAggregate helpers ──────────────────────────────────────────────
  // Each helper owns exactly one concern and accepts only the data it needs.
  // This keeps getGoalsAggregate as a thin coordinator with no inline computation.

  /**
   * Converts the Q2 groupBy result into a lookup map for O(1) contribution
   * retrieval during on-track and projection passes.
   *
   * @private
   * @returns goalId → all-time contribution total98
   *
   */
  private buildAllTimeTotalMap(
    contribAggs: { goalId: string; _sum: { amount: number | null } }[],
  ): Map<string, number> {
    const map = new Map<string, number>();
    for (const agg of contribAggs) {
      map.set(agg.goalId, Number(agg._sum.amount ?? 0));
    }
    return map;
  }

  /**
   * Builds two maps from the Q3 recent-contributions rows in a single O(n) pass.
   *
   * monthBuckets     "YYYY-MM" → cross-goal total that month.
   *                  Feeds streak, heatmap, and avgMonthlyContribution.
   *
   * goalMonthBuckets goalId → ("YYYY-MM" → goal-specific total that month).
   *                  Feeds per-goal on-track rate comparison.
   *
   * @private
   */
  private buildMonthlyBuckets(
    recentContributions: {
      date: Date;
      amount: number;
      goalId: string;
    }[],
  ): {
    monthBuckets: Map<string, number>;
    goalMonthBuckets: Map<string, Map<string, number>>;
  } {
    const monthBuckets = new Map<string, number>();
    const goalMonthBuckets = new Map<string, Map<string, number>>();

    for (const c of recentContributions) {
      const month = format(c.date, 'YYYY-MM');
      const amt = Number(c.amount);

      monthBuckets.set(month, (monthBuckets.get(month) ?? 0) + amt);

      if (!goalMonthBuckets.has(c.goalId))
        goalMonthBuckets.set(c.goalId, new Map());
      const gMap = goalMonthBuckets.get(c.goalId)!;
      gMap.set(month, (gMap.get(month) ?? 0) + amt);
    }

    return { monthBuckets, goalMonthBuckets };
  }

  /**
   * Computes the user's average monthly contribution over all complete months
   * that appear in monthBuckets, excluding the current (partial) month.
   *
   * Divides by activePeriods — the count of months that actually had
   * contributions — rather than a fixed constant. This prevents dilution
   * when the user skipped a month or two within the 12-month window.
   *
   * Returns 0 when there are no qualifying months.
   *
   * @private
   */
  private computeAvgMonthlyContribution(
    monthBuckets: Map<string, number>,
    currentMonth: string,
  ): number {
    let sumContributed = 0;
    let activePeriods = 0;
    for (const [m, amount] of monthBuckets) {
      if (m < currentMonth) {
        sumContributed += amount;
        activePeriods++;
      }
    }
    return activePeriods > 0 ? sumContributed / activePeriods : 0;
  }

  /**
   * Counts consecutive complete calendar months (backwards from the most
   * recently completed month) in which the user made >= 1 contribution.
   *
   * Starts at i=1 (last full month), skipping the current month which may not
   * have ended yet. Upper bound is monthBuckets.size so we never probe further
   * back than the data window — no hardcoded cap.
   *
   * @private
   */
  private computeStreak(monthBuckets: Map<string, number>, now: Date): number {
    let streakMonths = 0;
    for (let i = 1; i <= monthBuckets.size; i++) {
      const m = format(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)),
        'YYYY-MM',
      );
      if (!monthBuckets.has(m)) break;
      streakMonths++;
    }
    return streakMonths;
  }

  /**
   * Returns a 12-element array (oldest → newest) of cross-goal monthly totals
   * suitable for a GitHub-style contribution heat grid. Months with no
   * contributions carry amount = 0.
   *
   * @private
   */
  private buildContributionHeatmap(
    monthBuckets: Map<string, number>,
    now: Date,
  ): MonthlyContributionSummary[] {
    const heatmap: MonthlyContributionSummary[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = format(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)),
        'YYYY-MM',
      );
      heatmap.push({ month: m, amount: monthBuckets.get(m) ?? 0 });
    }
    return heatmap;
  }

  /**
   * Evaluates each ACTIVE goal and returns on-track and overdue counts.
   *
   * A goal is on-track when the user's goal-specific average monthly
   * contribution (over complete months in the Q3 window) meets or exceeds
   * the required monthly pace: (remaining / monthsLeft).
   *
   * Special cases:
   *   monthsLeft < 0  → overdue (past due date, not on-track)
   *   monthsLeft === 0 → due this month; on-track if goalAvg >= remaining
   *                      (avoids a false negative on early days of the month)
   *
   * @private
   */
  private computeOnTrackAndOverdue(
    activeGoals: { id: string; targetAmount: number; targetDate: Date }[],
    allTimeTotalMap: Map<string, number>,
    goalMonthBuckets: Map<string, Map<string, number>>,
    currentMonth: string,
    now: Date,
  ): { onTrackCount: number; overdueCount: number } {
    let onTrackCount = 0;
    let overdueCount = 0;

    for (const goal of activeGoals) {
      const contributed = allTimeTotalMap.get(goal.id) ?? 0;
      const remaining = Math.max(0, goal.targetAmount - contributed);
      const monthsLeft = this.monthsBetween(now, goal.targetDate);

      if (monthsLeft < 0) {
        overdueCount++;
        continue;
      }

      const gMap = goalMonthBuckets.get(goal.id);
      let goalSum = 0;
      let goalActivePeriods = 0;
      if (gMap) {
        for (const [m, amount] of gMap) {
          if (m < currentMonth) {
            goalSum += amount;
            goalActivePeriods++;
          }
        }
      }
      const goalAvg = goalActivePeriods > 0 ? goalSum / goalActivePeriods : 0;

      if (monthsLeft === 0) {
        if (goalAvg >= remaining) onTrackCount++;
        continue;
      }

      if (goalAvg >= remaining / monthsLeft) onTrackCount++;
    }

    return { onTrackCount, overdueCount };
  }

  /**
   * Builds the 15-point projection time series used by the savings area chart.
   *
   * Past window (isProjected: false) — 3 months of actual data:
   *   If the current month has contributions, it is included as the most recent
   *   past point (months i=2..0). Otherwise the window shifts back one month
   *   (i=3..1) to avoid opening the chart with a known zero that would create
   *   a false dip at the projection boundary.
   *
   * Future window (isProjected: true) — 12 projected months:
   *   Each ACTIVE goal contributes a constant monthly pace:
   *     pace = (targetAmount - contributed) / monthsToTarget
   *   Goals at or past their target date are excluded. For each future month
   *   offset i, only goals whose funding window is still open (until >= i)
   *   contribute to that month's projected total.
   *
   * @private
   */
  private buildProjectionData(
    activeGoals: { id: string; targetAmount: number; targetDate: Date }[],
    allTimeTotalMap: Map<string, number>,
    monthBuckets: Map<string, number>,
    currentMonth: string,
    now: Date,
  ): ProjectionPoint[] {
    const projectionData: ProjectionPoint[] = [];
    const hasCurrentMonthData = monthBuckets.has(currentMonth);
    const pastStart = hasCurrentMonthData ? 2 : 3;
    const pastEnd = hasCurrentMonthData ? 0 : 1;

    for (let i = pastStart; i >= pastEnd; i--) {
      const m = format(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)),
        'YYYY-MM',
      );
      projectionData.push({
        month: m,
        amount: monthBuckets.get(m) ?? 0,
        isProjected: false,
      });
    }

    // Pre-compute pace + funding window for each active goal once.
    // Goals at or past their target date are excluded (null → filtered out).
    const goalPaces = activeGoals
      .map((goal): GoalPace | null => {
        const monthsToTarget = this.monthsBetween(now, goal.targetDate);
        if (monthsToTarget <= 0) return null;
        const contributed = allTimeTotalMap.get(goal.id) ?? 0;
        const remaining = Math.max(0, goal.targetAmount - contributed);
        return { pace: remaining / monthsToTarget, until: monthsToTarget };
      })
      .filter((p): p is GoalPace => p !== null);

    const futureStart = hasCurrentMonthData ? 1 : 0;
    const futureEnd = hasCurrentMonthData ? 12 : 11;

    for (let i = futureStart; i <= futureEnd; i++) {
      const m = format(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1)),
        'YYYY-MM',
      );
      const amount = goalPaces
        .filter((p) => p.until >= i)
        .reduce((sum, p) => sum + p.pace, 0);
      projectionData.push({ month: m, amount, isProjected: true });
    }

    return projectionData;
  }

  /**
   * Returns true if the given date is strictly in the future (UTC).
   *
   * @private
   */
  private isFutureDate(_targetDate: string | Date): boolean {
    return new Date(_targetDate).getTime() > Date.now();
  }

  /**
   * Returns the number of whole calendar months from `from` to `to`.
   * Positive when `to` is in the future relative to `from`.
   * Uses UTC month/year components for timezone consistency.
   *
   * @private
   */
  private monthsBetween(from: Date, to: Date): number {
    return (
      (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
      (to.getUTCMonth() - from.getUTCMonth())
    );
  }

  /**
   * Enqueues an activity-log notification job for a goal event.
   *
   * @private
   * @param {string} userId
   * @param {GoalWithOptionalJoins} goal
   * @param {string} event - Human-readable label e.g. 'Goal Created'
   */
  private callEvents(
    userId: string,
    goal: GoalWithOptionalJoins,
    event: string,
  ): void {
    const normalizedEvent = event.split(' ').join('_').toLowerCase();

    const activityData: ActivityLogs = {
      userId,
      id: goal.id,
      createdAt: goal.createdAt,
      event: normalizedEvent,
      entityId: goal.id,
      entityType: 'goal',
      data: {
        type: 'goal',
        goalId: goal.id,
        goalName: goal.name,
        goalTargetAmount: goal.targetAmount.toString(),
        goalStatus: goal.status,
      },
    };

    this.activityQueue.add(ACTIVITY_NOTIFICATION_JOB, activityData);
  }

  /**
   * Enqueues an activity-log notification job for a contribution event.
   *
   * @private
   * @param {string} userId
   * @param {GoalContributionWithTransaction} contribution
   * @param {string} goalId - The parent goal's ID
   * @param {string} event - Human-readable label e.g. 'Goal Contribution Created'
   */
  private callContributionEvents(
    userId: string,
    contribution: GoalContributionWithTransaction,
    goalId: string,
    event: string,
  ): void {
    const normalizedEvent = event.split(' ').join('_').toLowerCase();

    const activityData: ActivityLogs = {
      userId,
      id: contribution.id,
      createdAt: contribution.createdAt,
      event: normalizedEvent,
      entityId: contribution.id,
      entityType: 'goal_contribution',
      data: {
        type: 'goal_contribution',
        contributionId: contribution.id,
        goalId,
        contributionAmount: contribution.amount.toString(),
        contributionDate: contribution.date.toISOString(),
      },
    };

    this.activityQueue.add(ACTIVITY_NOTIFICATION_JOB, activityData);
  }

  /**
   * Maps a Prisma GoalContribution record to the proto Contribution shape.
   *
   * @private
   * @param {GoalContributionWithTransaction} contribution
   * @returns {ProtoContribution}
   */
  private formatContribution(
    contribution: GoalContributionWithTransaction,
  ): ProtoContribution {
    return {
      id: contribution.id,
      amount: contribution.amount,
      date: contribution.date.toISOString(),
      description: contribution.description ?? undefined,
      notes: contribution.notes ?? undefined,
      createdAt: contribution.createdAt.toISOString(),
      updatedAt: contribution.updatedAt.toISOString(),
      transaction: contribution.transaction
        ? this.transactionService.formatTransaction(contribution.transaction)
        : undefined,
    };
  }

  /**
   * Maps a Prisma Goal record to the proto Goal shape.
   * contributedAmount is included when pre-computed (list endpoints);
   * contributions array is populated only on single-goal fetches.
   *
   * @private
   * @param {GoalWithOptionalJoins} goal
   * @returns {ProtoGoal}
   */
  private formatGoal(
    goal: GoalWithOptionalJoins,
    monthlyContributions?: Map<string, number>,
  ): ProtoGoal {
    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate.toISOString(),
      priority: goal.priority ?? '',
      status: goal.status,
      description: goal.description ?? undefined,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      contributedAmount: goal.contributedAmount ?? undefined,
      contributions: (goal.contributions ?? []).map((c) =>
        this.formatContribution(c),
      ),
      monthlyContributions: monthlyContributions
        ? Array.from(monthlyContributions?.entries()).map(([month, total]) => ({
            amount: total,
            month,
          }))
        : [],
    };
  }
}
