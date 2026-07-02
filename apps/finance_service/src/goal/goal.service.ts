import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';

import { Injectable, Logger } from '@nestjs/common';
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
import { GoalMonthlyGrouping } from '@fintrack/types/interfaces/goal';
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
  paceRequired?: number;
  paceActual?: number;
  paceStatus?: 'ON_TRACK' | 'BEHIND' | 'OVERDUE' | 'COMPLETED';
  monthsLeft?: number;
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
  private readonly logger = new Logger(GoalService.name);

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
          priority: data.priority as GoalPriority,
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
        (sum, goalTotal) => sum + goalTotal,
        0,
      );

      // activeSaved is scoped to ACTIVE goals only to prevent ON_HOLD savings
      // from inflating activePercent against an active-only denominator
      const activeSaved = activeGoals.reduce(
        (sum, goal) => sum + (allTimeTotalMap.get(goal.id) ?? 0),
        0,
      );
      const activePercent =
        activeTarget > 0
          ? Math.min(100, (activeSaved / activeTarget) * 100) // scoped to max of 100 in case, the user accidentally has oversaved
          : 0;

      // ── Monthly bucket maps ─────────────────────────────────────────────────
      const { monthBuckets, goalMonthBuckets } =
        this.buildMonthlyBuckets(recentContributions);

      // ── Aggregate metrics — each helper owns exactly one concern ────────────
      const avgMonthlyContribution =
        this.computeAvgMonthlyContribution(monthBuckets);
      const streakMonths = this.computeStreak(monthBuckets, now);
      const contributionHeatmap = this.buildContributionHeatmap(
        monthBuckets,
        now,
      );
      const { onTrackCount, overdueCount } = this.computeOnTrackAndOverdue(
        activeGoals,
        allTimeTotalMap,
        goalMonthBuckets,
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

      const contributedAmount = goal.contributions.reduce(
        (sum, c) => sum + Number(c.amount),
        0,
      );

      // Pace calculations — used by the drawer's progress detail section
      const now = new Date();
      const monthsLeft = this.monthsBetween(now, goal.targetDate);
      const remaining = Math.max(0, goal.targetAmount - contributedAmount);
      const paceRequired = monthsLeft > 0 ? remaining / monthsLeft : 0;

      // paceActual = all-time avg over distinct calendar months with contributions
      const activeMonths = new Set(
        goal.contributions.map((c) => format(c.date, 'YYYY-MM')),
      ).size;
      const paceActual =
        activeMonths > 0 ? contributedAmount / activeMonths : 0;

      let paceStatus: 'ON_TRACK' | 'BEHIND' | 'OVERDUE' | 'COMPLETED';
      if (goal.status === Goalstatus.COMPLETED) {
        paceStatus = 'COMPLETED';
      } else if (monthsLeft < 0) {
        paceStatus = 'OVERDUE';
      } else if (remaining === 0 || paceActual >= paceRequired) {
        paceStatus = 'ON_TRACK';
      } else {
        paceStatus = 'BEHIND';
      }

      return this.formatGoal({
        ...goal,
        contributedAmount,
        paceRequired,
        paceActual,
        paceStatus,
        monthsLeft,
      } as GoalWithOptionalJoins);
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

  //? ── getGoalsAggregate helpers ──────────────────────────────────────────────//

  /**
   * Converts the Q2 groupBy result array  into a lookup map for O(1) contribution
   * retrieval during on-track and projection passes.
   *
   * @private
   * @returns  goalId → all-time contribution total
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
    const monthBuckets = new Map<string, number>(); // {month:amount}
    const goalMonthBuckets = new Map<string, Map<string, number>>(); // {goalId: {month:amount}}

    for (const c of recentContributions) {
      const month = format(c.date, 'YYYY-MM');
      const amt = Number(c.amount);

      monthBuckets.set(month, (monthBuckets.get(month) ?? 0) + amt); // auto increment rolling monthly summary

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
  ): number {
    let sumContributed = 0;
    let activePeriods = 0;

    for (const [m, amount] of monthBuckets) {
      sumContributed += amount;
      activePeriods++;
    }

    return activePeriods > 0 ? sumContributed / activePeriods : 0;
  }

  /**
   * Counts consecutive complete calendar months (backwards from the most
   * recently completed month) in which the user made >= 1 contribution.
   * Starts at i=1 (last full month), skipping the current month only when it does not have contribution Upper bound is monthBuckets.size so we never probe further
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

    // if current month has a contribution add to streak
    if (monthBuckets.has(format(new Date(now), 'YYYY-MM'))) {
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
      const activePeriods = gMap?.size ?? 0;
      const goalAvg = activePeriods > 0 ? contributed / activePeriods : 0;

      if (monthsLeft === 0) {
        if (goalAvg >= remaining) onTrackCount++;
        continue;
      }

      if (goalAvg >= remaining / monthsLeft) onTrackCount++;
    }

    return { onTrackCount, overdueCount };
  }

  /**
   * Builds the 15-point projection time series rendered by the savings area chart.
   * Returns an array of { month, amount, isProjected } ordered oldest → newest.
   *
   * ── Overview ───────────────────────────────────────────────────────────────
   *
   * The array has two contiguous segments:
   *
   *   [past 3 months — isProjected: false]  [future 12 months — isProjected: true]
   *   ◄─────────────────────────────────────►◄──────────────────────────────────►
   *        actual totals from monthBuckets        computed via difference-array
   *
   * ── Part 1 — Past window (actual data) ─────────────────────────────────────
   *
   * We always emit exactly 3 past months, but the exact offsets depend on
   * whether the current month has any contributions:
   *
   *   Current month HAS contributions → include it as the most recent past point.
   *     pastStart = 2, pastEnd = 0  → months at offsets -2, -1, 0  (current month)
   *
   *   Current month has NO contributions yet → shift the window back by one.
   *     pastStart = 3, pastEnd = 1  → months at offsets -3, -2, -1 (last full month)
   *
   * The shift prevents the chart from opening with a visible zero on the right
   * side of the "actual" segment (which would look like a dip at the boundary).
   *
   * ── Part 2 — Future window (projected data) ─────────────────────────────────
   *
   * Each active goal needs a constant monthly savings pace:
   *
   *   pace = (targetAmount − contributed) / monthsToTarget
   *   We use a difference-array (expiry-deduction) technique that
   *   makes this to O(goals + months):
   *
   *   STEP A — Initialise
   *     expiryDeductions  numeric array of length (futureEnd + 2), all zeros.
   *                       Index k holds the total pace that drops out at month k.
   *     totalPace         running sum of all active goal paces (starts at 0).
   *
   *   STEP B — One pass over goals (O(goals))
   *     For each goal:
   *       1. Skip it if its target date has already passed (monthsToTarget ≤ 0).
   *       2. Compute pace = remaining / monthsToTarget and add to totalPace.
   *       3. Record the deduction: expiryDeductions[monthsToTarget + 1] += pace.
   *          The "+1" means "the month AFTER this goal's last active month".
   *          If that index falls beyond futureEnd + 1 the deduction is never
   *          read (goal outlives the chart window) — skip it to stay in bounds.
   *
   *     After this loop, totalPace = sum of all active goal paces, and
   *     expiryDeductions encodes exactly when each goal stops contributing.
   *
   *     Example with 3 goals (futureStart = 1, futureEnd = 12):
   *
   *       Goal A: pace 500, until month 8  → expiryDeductions[9]  += 500
   *       Goal B: pace 300, until month 12 → expiryDeductions[13] += 300  (skipped — out of range)
   *       Goal C: pace 200, until month 3  → expiryDeductions[4]  += 200
   *
   *       totalPace = 1000
   *       expiryDeductions = [0, 0, 0, 0, 200, 0, 0, 0, 0, 500, 0, 0, 0, 300]
   *                 index:    0  1  2  3   4   5  6  7  8   9  10 11 12  13
   *
   *   STEP C — One pass over months (O(months))
   *     runningSum starts at totalPace (all goals active simultaneously).
   *     At each month offset i:
   *       1. runningSum -= expiryDeductions[i]   ← subtract goals that expired
   *       2. Emit { month, amount: runningSum, isProjected: true }
   *
   *     Tracing the example:
   *       i=1:  1000 − 0   = 1000  (A + B + C all active)
   *       i=2:  1000 − 0   = 1000
   *       i=3:  1000 − 0   = 1000
   *       i=4:  1000 − 200 =  800  (C expired)
   *       i=5..8: 800
   *       i=9:   800 − 500 =  300  (A expired)
   *       i=10..12: 300            (only B remains)
   *
   * @private
   * @param activeGoals       ACTIVE goals with id, targetAmount, and targetDate
   * @param allTimeTotalMap   goalId → all-time contribution total
   * @param monthBuckets      "YYYY-MM" → cross-goal total for that month
   * @param currentMonth      "YYYY-MM" label for the current calendar month
   * @param now               reference Date (UTC) for all offset arithmetic
   */
  private buildProjectionData(
    activeGoals: { id: string; targetAmount: number; targetDate: Date }[],
    allTimeTotalMap: Map<string, number>,
    monthBuckets: Map<string, number>,
    currentMonth: string,
    now: Date,
  ): ProjectionPoint[] {
    const projectionData: ProjectionPoint[] = [];

    // ── Part 1: Past window ──────────────────────────────────────────────────
    const hasCurrentMonthData = monthBuckets.has(currentMonth);

    // Include the current month in the past window only when it already has
    // contributions. Without this guard the rightmost actual bar would be zero
    // and create a false dip at the boundary with the projected segment.
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

    // ── Part 2: Future window (difference-array technique) ───────────────────

    // futureStart / futureEnd mirror the past window shift: when the current
    // month is included as a past point, the first future offset is 1 (next
    // month). When it is excluded, offset 0 IS the current month projection.
    const futureStart = hasCurrentMonthData ? 1 : 0;
    const futureEnd = hasCurrentMonthData ? 12 : 11;

    // STEP A — expiryDeductions[k] will hold the total pace that drops out at
    // month offset k. Size is futureEnd + 2 so index futureEnd + 1 is reachable
    // without an out-of-bounds write.
    const expiryDeductions = new Float64Array(futureEnd + 2);
    let totalPace = 0;

    // STEP B — one O(goals) pass: accumulate total pace and register each
    // goal's expiry offset in the deduction array.
    for (const goal of activeGoals) {
      const monthsToTarget = this.monthsBetween(now, goal.targetDate);
      if (monthsToTarget <= 0) continue; // already past due — exclude from projection

      const contributed = allTimeTotalMap.get(goal.id) ?? 0;
      const remaining = Math.max(0, goal.targetAmount - contributed);
      const pace = remaining / monthsToTarget;

      totalPace += pace;

      // The goal is active through month offset `monthsToTarget`, so it stops
      // contributing at offset `monthsToTarget + 1`. Goals whose window extends
      // past futureEnd are never subtracted within the render range — skip them.
      const deductAt = monthsToTarget + 1;
      if (deductAt <= futureEnd + 1) {
        expiryDeductions[deductAt] += pace;
      }
    }

    // STEP C — one O(months) pass: walk the render range, subtracting expiries
    // before emitting each month's projected total.
    let runningSum = totalPace; // starts at sum of ALL active goal paces
    for (let i = futureStart; i <= futureEnd; i++) {
      runningSum -= expiryDeductions[i]; // drop goals whose window closed here
      const m = format(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1)),
        'YYYY-MM',
      );
      projectionData.push({ month: m, amount: runningSum, isProjected: true });
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
      paceRequired: goal.paceRequired ?? undefined,
      paceActual: goal.paceActual ?? undefined,
      paceStatus: goal.paceStatus ?? undefined,
      monthsLeft: goal.monthsLeft ?? undefined,
    };
  }
}
