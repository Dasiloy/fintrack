import type Redis from 'ioredis';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { UsageService } from '../usage/usage.service';

import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  Goal as ProtoGoal,
  GoalsAggregate,
  Contribution as ProtoContribution,
  GetGoalsRes,
} from '@fintrack/types/protos/finance/goal';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { User } from '@fintrack/database/types';
import {
  REDIS_CLIENT,
  GOAL_LIST_CACHE_PREFIX,
  GOAL_LIST_CACHE_TTL,
  GOAL_AGGREGATE_CACHE_PREFIX,
  GOAL_AGGREGATE_CACHE_TTL,
} from '@fintrack/types/constants/redis.costants';

import {
  CreateGoalDto,
  UpdateGoalDto,
  UpdateGoalStatusDto,
  GetGoalsQueryDto,
  CreateContributionDto,
  UpdateContributionDto,
} from './dto/goal.dto';

/**
 * API Gateway service for savings goals and contributions.
 * Proxies HTTP requests to the Finance microservice via gRPC.
 *
 * ## Cache strategy
 * Two Redis keys are maintained per user — both are 2-minute cache-aside entries:
 *
 *   goal_list:{userId}      — unfiltered goal list (the expensive raw-SQL path).
 *                             Bypassed when any filter query param is present.
 *
 *   goal_aggregate:{userId} — aggregate health snapshot (4 parallel DB queries
 *                             + streak/projection computation).
 *
 * Both keys are invalidated (fire-and-forget) on every mutation that can change
 * goal state: create, update, delete, updateStatus, and all contribution writes.
 *
 * ## Export cache invalidation
 * The same mutations call `invalidateExportCache(userId)` fire-and-forget, SCAN-deleting
 * all Redis keys matching `export:{userId}:*`. Primarily affects `goal-progress` exports.
 *
 * @class GoalService
 */
@Injectable()
export class GoalService implements OnModuleInit {
  private financeService: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly client: ClientGrpc,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly usageService: UsageService,
  ) {}

  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  /**
   * Invalidates both user-scoped goal cache keys (fire-and-forget).
   * Called after every mutation that can affect the goal list or aggregate.
   *
   * @private
   */
  private invalidateGoalCache(userId: string): void {
    void this.redis
      .del(
        `${GOAL_LIST_CACHE_PREFIX}:${userId}`,
        `${GOAL_AGGREGATE_CACHE_PREFIX}:${userId}`,
      )
      .catch(() => {
        // non-blocking — a Redis failure must never break the mutation response
      });
  }

  /**
   * Retrieves all goals for the authenticated user with optional filters.
   *
   * Cache-aside: the unfiltered list is served from `goal_list:{userId}` for
   * up to 2 minutes. Requests that include any filter param bypass the cache
   * and hit gRPC directly (filtered views are smaller and less expensive).
   *
   * @param {User} user - Authenticated user
   * @param {GetGoalsQueryDto} query - Optional filters
   * @returns {Promise<GetGoalsRes>} List of goals with contributed amounts and monthly breakdowns
   */
  async getGoals(user: User, query: GetGoalsQueryDto): Promise<GetGoalsRes> {
    const isFiltered =
      (query.status?.length ?? 0) > 0 ||
      (query.priority?.length ?? 0) > 0 ||
      query.amount !== undefined ||
      query.operator !== undefined;

    const cacheKey = `${GOAL_LIST_CACHE_PREFIX}:${user.id}`;

    if (!isFiltered) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as GetGoalsRes;
    }

    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    const result = await lastValueFrom(
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

    if (!isFiltered) {
      void this.redis
        .setex(cacheKey, GOAL_LIST_CACHE_TTL, JSON.stringify(result))
        .catch(() => {});
    }

    return result;
  }

  /**
   * Retrieves a single goal by ID with full contribution details.
   * Not cached — single-row fetch is fast and detail views are always fresh.
   *
   * @param {User} user - Authenticated user
   * @param {string} id - Goal ID
   * @returns {Promise<ProtoGoal>} The goal with contributions and linked transactions
   */
  async getGoal(user: User, id: string): Promise<ProtoGoal> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getGoal({ id }, metadata));
  }

  /**
   * Returns the aggregate health snapshot for all of the user's goals.
   *
   * Cache-aside: served from `goal_aggregate:{userId}` for up to 2 minutes.
   * The aggregate runs 4 parallel DB queries + in-memory streak/projection
   * computation, so caching is worthwhile even at this short TTL.
   *
   * @param {User} user - Authenticated user
   * @returns {Promise<GoalsAggregate>} Computed metrics: counts, savings totals, streak, heatmap, projection
   */
  async getGoalsAggregate(user: User): Promise<GoalsAggregate> {
    const cacheKey = `${GOAL_AGGREGATE_CACHE_PREFIX}:${user.id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as GoalsAggregate;

    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    const result = await lastValueFrom(
      this.financeService.getGoalsAggregate({}, metadata),
    );

    void this.redis
      .setex(cacheKey, GOAL_AGGREGATE_CACHE_TTL, JSON.stringify(result))
      .catch(() => {});

    return result;
  }

  /**
   * Creates a new savings goal for the authenticated user.
   * Invalidates the goal list cache, gated usage cache, and analytics export cache.
   *
   * @param {User} user - Authenticated user
   * @param {CreateGoalDto} data - Goal creation payload
   * @returns {Promise<ProtoGoal>} The newly created goal
   */
  async createGoal(user: User, data: CreateGoalDto): Promise<ProtoGoal> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
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
    void this.usageService.invalidateGatedUsageCache(user.id);
    this.invalidateGoalCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * Updates an existing goal's metadata.
   * Invalidates goal list, aggregate, and analytics export caches.
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
    const result = await lastValueFrom(
      this.financeService.updateGoal({ ...data, id }, metadata),
    );
    this.invalidateGoalCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * Transitions a goal between ACTIVE and ON_HOLD.
   * COMPLETED is system-managed and rejected by the finance service.
   * Invalidates goal list, aggregate, and analytics export caches.
   *
   * @param {User} user - Authenticated user
   * @param {string} id - Goal ID
   * @param {UpdateGoalStatusDto} data - Target status (ACTIVE | ON_HOLD)
   * @returns {Promise<ProtoGoal>} The updated goal
   */
  async updateGoalStatus(
    user: User,
    id: string,
    data: UpdateGoalStatusDto,
  ): Promise<ProtoGoal> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.updateGoalStatus(
        { id, status: data.status },
        metadata,
      ),
    );
    this.invalidateGoalCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * Deletes a goal and all its contributions.
   * Invalidates goal list, aggregate, gated usage, and analytics export caches.
   *
   * @param {User} user - Authenticated user
   * @param {string} id - Goal ID
   * @returns {Promise<Empty>} Empty response on success
   */
  async deleteGoal(user: User, id: string): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.deleteGoal({ id }, metadata),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    this.invalidateGoalCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * Adds a contribution to a goal.
   * Invalidates goal list, aggregate, and analytics export caches (contribution affects totals and streak).
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
    const result = await lastValueFrom(
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
    this.invalidateGoalCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * Updates an existing goal contribution.
   * Invalidates goal list, aggregate, and analytics export caches.
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
    const result = await lastValueFrom(
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
    this.invalidateGoalCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * Deletes a contribution from a goal.
   * Invalidates goal list, aggregate, and analytics export caches.
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
    const result = await lastValueFrom(
      this.financeService.deleteContribution(
        { goalId, goalContributionId: contributionId },
        metadata,
      ),
    );
    this.invalidateGoalCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * @description SCAN-delete all cached analytics exports for a user (`export:{userId}:*`).
   * Fire-and-forget after mutations; mirrors {@link ExportCacheService.invalidateUser}.
   *
   * @async
   * @private
   * @param {string} userId Authenticated user ID
   * @returns {Promise<void>}
   */
  private async invalidateExportCache(userId: string): Promise<void> {
    const pattern = `export:${userId}:*`;
    let cursor = '0';
    const keys: string[] = [];
    do {
      const [next, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = next;
      keys.push(...(batch as string[]));
    } while (cursor !== '0');
    if (keys.length > 0) await this.redis.del(...keys);
  }
}
