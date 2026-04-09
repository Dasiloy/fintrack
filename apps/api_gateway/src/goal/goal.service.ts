import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  Goal as ProtoGoal,
  Contribution as ProtoContribution,
  GetGoalsRes,
} from '@fintrack/types/protos/finance/goal';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { User } from '@fintrack/database/types';

import {
  CreateGoalDto,
  UpdateGoalDto,
  GetGoalsQueryDto,
  CreateContributionDto,
  UpdateContributionDto,
} from './dto/goal.dto';

/**
 * API Gateway service for savings goals and contributions.
 * Proxies HTTP requests to the Finance microservice via gRPC.
 *
 * @class GoalService
 */
@Injectable()
export class GoalService implements OnModuleInit {
  private financeService: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  /**
   * Creates a new savings goal for the authenticated user.
   *
   * @param {User} user - Authenticated user
   * @param {CreateGoalDto} data - Goal creation payload
   * @returns {Promise<ProtoGoal>} The newly created goal
   */
  async createGoal(user: User, data: CreateGoalDto): Promise<ProtoGoal> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.createGoal(
        {
          name: data.name,
          targetDate: data.targetDate,
          targetAmount: data.targetAmount,
          priority: data.priority,
          description: data.description,
        },
        metadata,
      ),
    );
  }

  /**
   * Retrieves all goals for the authenticated user with optional filters.
   *
   * @param {User} user - Authenticated user
   * @param {GetGoalsQueryDto} query - Optional filters
   * @returns {Promise<GetGoalsRes>} List of goals with contributed amounts
   */
  async getGoals(user: User, query: GetGoalsQueryDto): Promise<GetGoalsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.getGoals(
        {
          status: query.status ?? [],
          priority: query.priority ?? [],
          amount: query.amount !== undefined ? String(query.amount) : undefined,
          operator: query.operator,
        },
        metadata,
      ),
    );
  }

  /**
   * Retrieves a single goal by ID with full contribution details.
   *
   * @param {User} user - Authenticated user
   * @param {string} id - Goal ID
   * @returns {Promise<ProtoGoal>} The goal with contributions
   */
  async getGoal(user: User, id: string): Promise<ProtoGoal> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getGoal({ id }, metadata));
  }

  /**
   * Updates an existing goal's metadata.
   *
   * @param {User} user - Authenticated user
   * @param {string} id - Goal ID
   * @param {UpdateGoalDto} data - Fields to update
   * @returns {Promise<ProtoGoal>} The updated goal
   */
  async updateGoal(
    user: User,
    id: string,
    data: UpdateGoalDto,
  ): Promise<ProtoGoal> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.updateGoal({ ...data, id }, metadata),
    );
  }

  /**
   * Deletes a goal and all its contributions.
   *
   * @param {User} user - Authenticated user
   * @param {string} id - Goal ID
   * @returns {Promise<Empty>} Empty response on success
   */
  async deleteGoal(user: User, id: string): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.deleteGoal({ id }, metadata));
  }

  /**
   * Adds a contribution to a goal.
   *
   * @param {User} user - Authenticated user
   * @param {string} goalId - Goal ID to contribute to
   * @param {CreateContributionDto} data - Contribution payload
   * @returns {Promise<ProtoContribution>} The newly created contribution
   */
  async contributeToGoal(
    user: User,
    goalId: string,
    data: CreateContributionDto,
  ): Promise<ProtoContribution> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.contributeToGoal(
        {
          goalId,
          amount: data.amount,
          date: data.date,
          description: data.description,
          transactionId: data.transactionId,
        },
        metadata,
      ),
    );
  }

  /**
   * Updates an existing goal contribution.
   *
   * @param {User} user - Authenticated user
   * @param {string} goalId - Goal ID
   * @param {string} contributionId - Contribution ID to update
   * @param {UpdateContributionDto} data - Fields to update
   * @returns {Promise<ProtoContribution>} The updated contribution
   */
  async updateContribution(
    user: User,
    goalId: string,
    contributionId: string,
    data: UpdateContributionDto,
  ): Promise<ProtoContribution> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.updateGoalContribution(
        {
          goalId,
          goalContributionId: contributionId,
          amount: data.amount,
          date: data.date,
          description: data.description,
          transactionId: data.transactionId,
        },
        metadata,
      ),
    );
  }

  /**
   * Deletes a contribution from a goal.
   *
   * @param {User} user - Authenticated user
   * @param {string} goalId - Goal ID
   * @param {string} contributionId - Contribution ID to delete
   * @returns {Promise<Empty>} Empty response on success
   */
  async deleteContribution(
    user: User,
    goalId: string,
    contributionId: string,
  ): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.deleteContribution(
        { goalId, goalContributionId: contributionId },
        metadata,
      ),
    );
  }
}
