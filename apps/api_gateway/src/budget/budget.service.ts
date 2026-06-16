import type Redis from 'ioredis';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { ClientGrpc } from '@nestjs/microservices';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';

import {
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  Empty,
  FINANCE_PACKAGE_NAME,
} from '@fintrack/types/protos/finance/transaction';
import { User } from '@fintrack/database/types';
import {
  Budget as ProtoBudget,
  BudgetDetail,
  GetArchivedBudgetsRes,
  GetBudgetsRes,
  GetSpendingTrendRes,
} from '@fintrack/types/protos/finance/budget';
import {
  BUDGET_TREND_CACHE_PREFIX,
  BUDGET_TREND_CACHE_TTL,
  REDIS_CLIENT,
} from '@fintrack/types/constants/redis.costants';

import {
  CreateBudgetDto,
  DeleteBudgetDto,
  GetBudgetQueryDto,
  GetBudgetsQueryDto,
  GetSpendingTrendQueryDto,
  UpdateBudgetDto,
} from './dto/budget.dto';

/**
 * Service responsible for managing user budgets.
 * Handles HTTP requests for CRUD operations on budgets and forwards them to the Finance microservice.
 *
 * ## Export cache invalidation
 * Budget mutations call `invalidateExportCache(userId)` fire-and-forget after a successful gRPC write.
 * SCAN-deletes all Redis keys matching `export:{userId}:*`. Primarily affects `budget-performance`
 * exports; also clears stale transaction-derived exports when spend totals change.
 *
 * @class BudgetService
 */
@Injectable()
export class BudgetService implements OnModuleInit {
  private readonly logger = new Logger(BudgetService.name);
  private financeService: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly usageService: UsageService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * @description Initialise the gRPC Finance stub on module startup.
   *
   * @public
   */
  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  // ================================================================
  //. Helpers
  // ===============================================================

  /**
   * @description Deletes all cached budget-list and spending-trend entries for a user.
   * Called fire-and-forget after any budget or transaction mutation; errors are logged but not re-thrown.
   *
   * @async
   * @public
   * @param {string} userId The user whose budget caches should be purged
   * @returns {Promise<void>}
   */
  async invalidateBudgetListAndTrend(userId: string): Promise<void> {
    const [listKeys] = await Promise.all([
      this.redis.keys(`${BUDGET_TREND_CACHE_PREFIX}:${userId}:*`),
    ]);
    const all = [...listKeys];
    if (all.length) {
      await this.redis
        .del(...all)
        .catch((err) =>
          this.logger.warn(`Budget cache invalidation failed: ${err.message}`),
        );
    }
  }

  /**
   * @description SCAN-delete all cached analytics exports for a user (`export:{userId}:*`).
   * Fire-and-forget after mutations; mirrors {@link ExportCacheService.invalidateUser}.
   *
   * @async
   * @public
   * @param {string} userId Authenticated user ID
   * @returns {Promise<void>}
   */
  async invalidateExportCache(userId: string): Promise<void> {
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
    if (keys.length > 0)
      await this.redis
        .del(...keys)
        .catch((err) =>
          this.logger.warn(`Budget cache invalidation failed: ${err.message}`),
        );
  }

  // ================================================================
  //. Read methods (cache-aside)
  // ================================================================

  /**
   * @description Returns all budgets for the given month/year, serving from Redis cache when available.
   * On a cache miss the result is fetched from the Finance microservice and written back to Redis.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {GetBudgetsQueryDto} query Year and month filter
   * @returns {Promise<GetBudgetsRes>} Budget list for the requested period
   */
  async getBudgets(
    user: User,
    query: GetBudgetsQueryDto,
  ): Promise<GetBudgetsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.getBudgets(
        { month: query.month, year: query.year },
        metadata,
      ),
    );

    return result;
  }

  /**
   * @description Returns a single budget with full detail, serving from Redis cache when available.
   * On a cache miss the result is fetched from the Finance microservice and written back to Redis.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {GetBudgetQueryDto} query Month and year for the period
   * @param {string} budgetId Budget ID
   * @returns {Promise<BudgetDetail>} Full budget detail including category and spending breakdown
   */
  async getBudget(
    user: User,
    query: GetBudgetQueryDto,
    budgetId: string,
  ): Promise<BudgetDetail> {
    const { month, year } = query;

    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.getBudget(
        {
          id: budgetId,
          month,
          year,
        },
        metadata,
      ),
    );

    return result;
  }

  /**
   * @description Returns the spending trend across the requested number of months, serving from Redis cache when available.
   * Defaults to 6 months when the query does not specify a value.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {GetSpendingTrendQueryDto} query Optional months count (defaults to 6)
   * @returns {Promise<GetSpendingTrendRes>} Monthly spending aggregates for the requested window
   */
  async getSpendingTrend(
    user: User,
    query: GetSpendingTrendQueryDto,
  ): Promise<GetSpendingTrendRes> {
    const months = query.months ?? 6;
    const cacheKey = `${BUDGET_TREND_CACHE_PREFIX}:${user.id}:${months}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as GetSpendingTrendRes;

    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.getSpendingTrend({ months }, metadata),
    );

    this.redis
      .setex(cacheKey, BUDGET_TREND_CACHE_TTL, JSON.stringify(result))
      .catch((err) =>
        this.logger.warn(`Failed to cache spending trend: ${err.message}`),
      );
    return result;
  }

  // ================================================================
  //. Mutation methods (invalidate on success)
  // ================================================================

  /**
   * @description Creates a new budget (or re-activates a deactivated one for the same
   * category+period) via the Finance microservice.
   * Invalidates the budget list, trend, gated usage, and analytics export caches as fire-and-forget side effects.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {CreateBudgetDto} data Budget creation payload; `month`/`year` are optional
   *   and used to backdate the budget period
   * @returns {Promise<ProtoBudget>} The created or re-activated budget
   */
  async createBudget(user: User, data: CreateBudgetDto): Promise<ProtoBudget> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.createBudget(data, metadata),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    void this.invalidateBudgetListAndTrend(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * @description Updates an existing budget via the Finance microservice and invalidates the budget list,
   * trend, single-budget, and analytics export caches as fire-and-forget side effects.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {UpdateBudgetDto} data Fields to update
   * @param {string} budgetId ID of the budget to update
   * @returns {Promise<ProtoBudget>} The updated budget
   */
  async updateBudget(
    user: User,
    data: UpdateBudgetDto,
    budgetId: string,
  ): Promise<ProtoBudget> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.updateBudget({ ...data, id: budgetId }, metadata),
    );
    void this.invalidateBudgetListAndTrend(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * @description Soft-deactivates or permanently deletes a budget via the Finance microservice.
   *
   * When `hardDelete` is false (default) the budget is soft-deactivated from
   * the current server month — history is preserved and the budget can be
   * restored. When `hardDelete` is true the Budget row and all its history are
   * permanently removed.
   *
   * Cache effects (fire-and-forget): always invalidates budget list, trend, and analytics exports.
   * Also invalidates the gated usage cache and all period-scoped single-budget
   * cache entries when `hardDelete` is true; period-scoped caches only when
   * soft-deactivating.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {DeleteBudgetDto} data Delete options; `hardDelete` defaults to false
   * @param {string} budgetId ID of the budget to deactivate or delete
   * @returns {Promise<Empty>} Empty response on success
   */
  async deleteBudget(
    user: User,
    data: DeleteBudgetDto,
    budgetId: string,
  ): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.deleteBudget(
        {
          id: budgetId,
          hardDelete: data.hardDelete ?? false,
        },
        metadata,
      ),
    );
    // Only invalidate usage gate on hard delete (soft-deactivate keeps the record)
    if (data.hardDelete)
      void this.usageService.invalidateGatedUsageCache(user.id);

    void this.invalidateBudgetListAndTrend(user.id);
    void this.invalidateExportCache(user.id);
    // Wildcard-clear all period-scoped detail caches for this budget

    return result;
  }

  /**
   * @description Returns all soft-deleted budgets for the user.
   * No caching — this is an infrequent management operation.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @returns {Promise<GetArchivedBudgetsRes>} List of archived budgets
   */
  async getArchivedBudgets(user: User): Promise<GetArchivedBudgetsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getArchivedBudgets({}, metadata));
  }

  /**
   * @description Restores a soft-deleted budget via the Finance microservice.
   * Invalidates the budget list, trend, usage gate, and analytics export caches on success.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} budgetId ID of the archived budget to restore
   * @returns {Promise<ProtoBudget>} The restored budget
   */
  async restoreBudget(user: User, budgetId: string): Promise<ProtoBudget> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.restoreBudget({ id: budgetId }, metadata),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    void this.invalidateBudgetListAndTrend(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }
}
