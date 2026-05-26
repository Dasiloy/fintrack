import type Redis from 'ioredis';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { ClientGrpc } from '@nestjs/microservices';
import { UsageService } from '../usage/usage.service';

import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  Recurinrg as ProtoRecurring,
  RecurringAggregateRes,
  GetRecurringsRes,
} from '@fintrack/types/protos/finance/recurring';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { User } from '@fintrack/database/types';
import {
  RECURRING_AGGREGATE_CACHE_PREFIX,
  REDIS_CLIENT,
  USER_CACHE_TTL,
} from '@fintrack/types/constants/redis.costants';

import {
  CreateRecurringDto,
  GetRecurringsQueryDto,
  UpdateRecurringDto,
} from './dto/recurring.dto';

/**
 * API Gateway service for recurring items.
 *
 * ## Responsibilities
 * Proxies validated HTTP requests to the Finance microservice via gRPC and
 * handles all cache lifecycle for the aggregate stats endpoint.
 *
 * ## Cache strategy
 * `getRecurringsAggregate` uses a Redis cache-aside pattern:
 * - **Key**: `recurring_aggregate:{userId}`
 * - **TTL**: `USER_CACHE_TTL` (300 s / 5 min)
 * - **Invalidated by**: `createRecurring`, `updateRecurring`, `toggleRecurring`,
 *   `deleteRecurring` — each calls `invalidateAggregateCache` fire-and-forget
 *   after the gRPC call succeeds.
 *
 * ## Side effects
 * - `createRecurring` and `deleteRecurring` also invalidate the gated usage
 *   cache via `UsageService.invalidateGatedUsageCache`.
 *
 * ## Export cache invalidation
 * All mutations call `invalidateExportCache(userId)` fire-and-forget, SCAN-deleting
 * all Redis keys matching `export:{userId}:*`. Keeps spending-related exports fresh
 * when recurring items change (scheduler-created transactions affect summaries).
 *
 * @class RecurringService
 */
@Injectable()
export class RecurringService implements OnModuleInit {
  private readonly logger = new Logger(RecurringService.name);
  private financeService: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly client: ClientGrpc,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly usageService: UsageService,
  ) {}

  /**
   * @description Initialise the gRPC `FinanceServiceClient` stub on module startup.
   *
   * @public
   */
  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  /**
   * @description Forward a create request to the Finance microservice and
   * invalidate the gated-usage, aggregate, and analytics export caches fire-and-forget.
   *
   * @async
   * @public
   * @param {User} user Authenticated user from ApiGuard
   * @param {CreateRecurringDto} data Validated creation payload
   * @returns {Promise<ProtoRecurring>} The newly created recurring item
   */
  async createRecurring(
    user: User,
    data: CreateRecurringDto,
  ): Promise<ProtoRecurring> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.createRecurring(
        {
          name: data.name,
          amount: data.amount,
          frequency: data.frequency,
          type: data.type,
          startDate: data.startDate,
          categorySlug: data.categorySlug,
          endDate: data.endDate,
          description: data.description,
          merchant: data.merchant,
        },
        metadata,
      ),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    void this.invalidateAggregateCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * @description Forward a filtered list request to the Finance microservice.
   * Server-side filtering (`isActive`, `type`, `frequency`) and sorting
   * (`sortBy`) are passed directly; the Finance service owns the query logic.
   *
   * @async
   * @public
   * @param {User} user Authenticated user from ApiGuard
   * @param {GetRecurringsQueryDto} query Validated filter and sort params
   * @returns {Promise<GetRecurringsRes>} Filtered and sorted recurring items
   */
  async getRecurrings(
    user: User,
    query: GetRecurringsQueryDto,
  ): Promise<GetRecurringsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.getRecurrings(
        {
          isActive: query.isActive,
          sortBy: query.sortBy,
          type: query.type ?? [],
          frequency: query.frequency ?? [],
        },
        metadata,
      ),
    );
  }

  /**
   * @description Fetch a single recurring item by ID including its transaction history.
   *
   * @async
   * @public
   * @param {User} user Authenticated user from ApiGuard
   * @param {string} id Recurring item ID
   * @returns {Promise<ProtoRecurring>} The item with `transactions[]` populated
   */
  async getRecurring(user: User, id: string): Promise<ProtoRecurring> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getRecurring({ id }, metadata));
  }

  /**
   * @description Return aggregate stats for the bills page widgets using a
   * Redis cache-aside pattern. On a cache miss the Finance microservice
   * is queried and the result is stored for `USER_CACHE_TTL` seconds.
   * Cache errors are logged and never rethrown.
   *
   * @async
   * @public
   * @param {User} user Authenticated user from ApiGuard
   * @returns {Promise<RecurringAggregateRes>} activeCount, pausedCount, monthlyExpense, monthlyIncome
   */
  async getRecurringsAggregate(user: User): Promise<RecurringAggregateRes> {
    const cacheKey = `${RECURRING_AGGREGATE_CACHE_PREFIX}:${user.id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as RecurringAggregateRes;

    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const data = await lastValueFrom(
      this.financeService.getRecurringsAggregate({}, metadata),
    );

    await this.redis
      .setex(cacheKey, USER_CACHE_TTL, JSON.stringify(data))
      .catch((err) =>
        this.logger.warn(`Failed to cache recurring aggregate: ${err.message}`),
      );

    return data;
  }

  /**
   * @description Forward a partial update to the Finance microservice and
   * invalidate the aggregate and analytics export caches fire-and-forget.
   *
   * @async
   * @public
   * @param {User} user Authenticated user from ApiGuard
   * @param {string} id Recurring item ID
   * @param {UpdateRecurringDto} data Validated partial update payload
   * @returns {Promise<ProtoRecurring>} The updated recurring item
   */
  async updateRecurring(
    user: User,
    id: string,
    data: UpdateRecurringDto,
  ): Promise<ProtoRecurring> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.updateRecurring({ ...data, id }, metadata),
    );
    void this.invalidateAggregateCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * @description Toggle the `isActive` flag via gRPC and invalidate the
   * aggregate and analytics export caches fire-and-forget.
   *
   * @async
   * @public
   * @param {User} user Authenticated user from ApiGuard
   * @param {string} id Recurring item ID
   * @returns {Promise<ProtoRecurring>} The item with updated `isActive`
   */
  async toggleRecurring(user: User, id: string): Promise<ProtoRecurring> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.toggleRecurring({ id }, metadata),
    );
    void this.invalidateAggregateCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * @description Delete a recurring item via gRPC and invalidate the
   * gated-usage, aggregate, and analytics export caches fire-and-forget.
   *
   * @async
   * @public
   * @param {User} user Authenticated user from ApiGuard
   * @param {string} id Recurring item ID
   * @returns {Promise<Empty>} Empty response on success
   */
  async deleteRecurring(user: User, id: string): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.deleteRecurring({ id }, metadata),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    void this.invalidateAggregateCache(user.id);
    void this.invalidateExportCache(user.id);
    return result;
  }

  /**
   * @description Remove the cached aggregate entry for a user.
   * Called fire-and-forget after any mutation. Errors are logged, never rethrown.
   *
   * @async
   * @private
   * @param {string} userId
   */
  private async invalidateAggregateCache(userId: string): Promise<void> {
    const cacheKey = `${RECURRING_AGGREGATE_CACHE_PREFIX}:${userId}`;
    await this.redis
      .del(cacheKey)
      .catch((err) =>
        this.logger.warn(
          `Failed to invalidate recurring aggregate cache: ${err.message}`,
        ),
      );
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
