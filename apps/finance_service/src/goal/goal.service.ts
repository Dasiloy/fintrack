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
} from '@fintrack/types/protos/finance/goal';
import {
  ACTIVITY_NOTIFICATION_JOB,
  ACTIVITY_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import {
  Goal,
  GoalContribution,
  GoalPriority,
  Goalstatus,
  Prisma,
  TransactionType,
} from '@fintrack/database/types';
import { ActivityLogs } from '@fintrack/database/types';
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
   * Returns all goals for a user with optional filters and the contributed
   * amount per goal.
   *
   * Filters:
   * - status   → array of Goalstatus values (ACTIVE | COMPLETED | ON_HOLD | CANCELLED)
   * - priority → array of GoalPriority values (LOW | MEDIUM | HIGH)
   * - amount + operator → filter on targetAmount using a whitelisted comparator
   *   (gt | gte | lt | lte | eq | ne). Invalid operators are silently ignored.
   *
   * The contributedAmount is fetched in a second query scoped to the returned
   * goal IDs — avoids loading contribution rows and is skipped entirely if the
   * list is empty.
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
      const contributionSums = goalIds.length
        ? await this.prismaService.goalContribution.groupBy({
            by: ['goalId'],
            where: { goalId: { in: goalIds } },
            _sum: { amount: true },
          })
        : [];

      const sumByGoalId = new Map(
        contributionSums.map((s) => [s.goalId, s._sum.amount ?? 0]),
      );

      return {
        goals: goals.map((goal) =>
          this.formatGoal({
            ...goal,
            contributedAmount: sumByGoalId.get(goal.id) ?? 0,
          }),
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
        'Contribution Created',
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
        'Contribution Deleted',
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

  /**
   * Returns true if the given date is strictly in the future (UTC).
   *
   * @private
   */
  private isFutureDate(_targetDate: string | Date): boolean {
    return new Date(_targetDate).getTime() > Date.now();
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
   * @param {string} event - Human-readable label e.g. 'Contribution Created'
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
  private formatGoal(goal: GoalWithOptionalJoins): ProtoGoal {
    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate.toISOString(),
      priority: goal.priority ?? '',
      statsu: goal.status,
      description: goal.description ?? undefined,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      contributedAmount: goal.contributedAmount ?? undefined,
      contributions: (goal.contributions ?? []).map((c) =>
        this.formatContribution(c),
      ),
    };
  }
}
