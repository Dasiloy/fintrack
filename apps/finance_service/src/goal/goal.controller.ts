import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';

import { FINANCE_SERVICE_NAME } from '@fintrack/types/protos/finance/finance';
import {
  Goal as ProtoGoal,
  Contribution as ProtoContribution,
  CreateGoalReq,
  GetGoalsReq,
  GetGoalsRes,
  GoalReq,
  UpdateGoalReq,
  CreateGoalContributionReq,
  UpdateGoalContributionReq,
  DeleteGoalContributionReq,
} from '@fintrack/types/protos/finance/goal';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { User } from '@fintrack/database/types';

import { GoalService } from './goal.service';

/**
 * gRPC controller for all goal and goal-contribution operations.
 * Auth is enforced at the module level via RpcAuthGuard.
 *
 * @class GoalController
 */
@Controller()
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  /**
   * Creates a new savings goal for the authenticated user.
   *
   * @param {CreateGoalReq} request - Goal creation payload (name, targetAmount, targetDate, priority, description)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoGoal>} The newly created goal
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'createGoal')
  createGoal(
    @Payload() request: CreateGoalReq,
    @RpcUser() user: User,
  ): Promise<ProtoGoal> {
    return this.goalService.createGoal(user.id, request);
  }

  /**
   * Retrieves all goals for the authenticated user with optional filters.
   *
   * @param {GetGoalsReq} request - Optional filters (status[], priority[], amount, operator)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<GetGoalsRes>} Paginated list of goals with contributed amounts
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getGoals')
  getGoals(
    @Payload() request: GetGoalsReq,
    @RpcUser() user: User,
  ): Promise<GetGoalsRes> {
    return this.goalService.getGoals(user.id, request);
  }

  /**
   * Retrieves a single goal by ID, including all contributions with their linked transactions.
   *
   * @param {GoalReq} request - Contains the goal ID
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoGoal>} The goal with full contribution details
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getGoal')
  getGoal(
    @Payload() request: GoalReq,
    @RpcUser() user: User,
  ): Promise<ProtoGoal> {
    return this.goalService.getGoal(user.id, request);
  }

  /**
   * Updates an existing goal's metadata (name, targetDate, targetAmount, priority, description).
   * Automatically re-evaluates goal status when targetAmount changes.
   *
   * @param {UpdateGoalReq} request - Fields to update (all optional except id)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoGoal>} The updated goal
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'updateGoal')
  updateGoal(
    @Payload() request: UpdateGoalReq,
    @RpcUser() user: User,
  ): Promise<ProtoGoal> {
    return this.goalService.updateGoal(user.id, request);
  }

  /**
   * Deletes a goal and all its contributions (cascade via Prisma schema).
   *
   * @param {GoalReq} request - Contains the goal ID to delete
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<Empty>} Empty response on success
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'deleteGoal')
  deleteGoal(
    @Payload() request: GoalReq,
    @RpcUser() user: User,
  ): Promise<Empty> {
    return this.goalService.deleteGoal(user.id, request);
  }

  /**
   * Adds a contribution to a goal.
   * Validates that the new contribution does not exceed the goal's target amount.
   * Optionally links to an existing transaction — when linked, the transaction date is used.
   *
   * @param {CreateGoalContributionReq} request - Contribution payload (goalId, amount, date, description, transactionId)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoContribution>} The newly created contribution
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'contributeToGoal')
  contributeToGoal(
    @Payload() request: CreateGoalContributionReq,
    @RpcUser() user: User,
  ): Promise<ProtoContribution> {
    return this.goalService.createContribution(user.id, request);
  }

  /**
   * Updates an existing goal contribution.
   * Re-validates the overflow rule excluding the current contribution's existing value.
   *
   * @param {UpdateGoalContributionReq} request - Fields to update (goalId, goalContributionId, amount, date, description, transactionId)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoContribution>} The updated contribution
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'updateGoalContribution')
  updateGoalContribution(
    @Payload() request: UpdateGoalContributionReq,
    @RpcUser() user: User,
  ): Promise<ProtoContribution> {
    return this.goalService.updateContribution(user.id, request);
  }

  /**
   * Deletes a contribution from a goal.
   *
   * @param {DeleteGoalContributionReq} request - Contains goalId and goalContributionId
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<Empty>} Empty response on success
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'deleteContribution')
  deleteContribution(
    @Payload() request: DeleteGoalContributionReq,
    @RpcUser() user: User,
  ): Promise<Empty> {
    return this.goalService.deleteContribution(user.id, request);
  }
}
