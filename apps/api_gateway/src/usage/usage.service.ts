import type Redis from 'ioredis';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@fintrack/database/service';
import {
  GATED_USAGE_CACHE_PREFIX,
  GATED_USAGE_TTL,
  REDIS_CLIENT,
} from '@fintrack/types/constants/redis.costants';
import { PLAN_LIMITS, Usage } from '@fintrack/types/constants/plan.constants';

import { GatedUsageResponse } from '@fintrack/database/usage.types';

/**
 * @description Provides gated usage data (plan limits, resource counts, usage trackers) with Redis cache-aside.
 *
 * ## Responsibilities
 * - Serving plan limit and resource count data needed for feature-gating checks
 * - Caching query results to avoid repeated heavy joins on every request
 * - Exposing a cache invalidation helper called after any mutation that changes resource counts
 *
 * ## Cache strategy
 * Cache key: `gated_usage:{userId}`, TTL: GATED_USAGE_TTL. On a cache miss the full usage snapshot
 * is assembled from DB and written back to Redis.
 *
 * @class UsageService
 */
@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * @description Returns gated usage data for a user, serving from Redis cache when available.
   * On a cache miss the full snapshot is assembled from DB and written back to Redis.
   *
   * @async
   * @public
   * @param {string} userId The user whose usage data to fetch
   * @returns {Promise<GatedUsageResponse>} Plan limits, resource counts, and usage tracker data
   */
  async getGatedUsage(userId: string): Promise<GatedUsageResponse> {
    const cacheKey = `${GATED_USAGE_CACHE_PREFIX}:${userId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as GatedUsageResponse;
    }

    const data = await this.queryFromDb(userId);
    await this.redis
      .setex(cacheKey, GATED_USAGE_TTL, JSON.stringify(data))
      .catch((err) =>
        this.logger.warn(`Failed to cache gated usage: ${err.message}`),
      );

    return data;
  }

  /**
   * @description Removes the cached gated usage entry for a user.
   * Called fire-and-forget after any mutation that changes resource counts; errors are logged but not re-thrown.
   *
   * @async
   * @public
   * @param {string} userId The user whose cache entry should be removed
   * @returns {Promise<void>}
   */
  async invalidateGatedUsageCache(userId: string): Promise<void> {
    const cacheKey = `${GATED_USAGE_CACHE_PREFIX}:${userId}`;
    await this.redis
      .del(cacheKey)
      .catch((err) =>
        this.logger.warn(
          `Failed to invalidate gated usage cache: ${err.message}`,
        ),
      );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * @description Queries the database for the full gated usage snapshot, assembling plan limits,
   * usage tracker data, and resource counts into a single structured response.
   *
   * @async
   * @private
   * @param {string} userId The user to query
   * @returns {Promise<GatedUsageResponse>} Full usage snapshot from DB
   */
  private async queryFromDb(userId: string): Promise<GatedUsageResponse> {
    const userCount = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        usageTrackers: {
          select: {
            feature: true,
            count: true,
            periodStart: true,
            periodEnd: true,
          },
        },
        subscription: {
          select: {
            plan: true,
            status: true,
            stripeCancelAtPeriodEnd: true,
            stripeCurrentPeriodEnd: true,
          },
        },
        _count: {
          select: {
            categories: { where: { isSystem: false } },
            budgets: true,
            recurringItems: true,
            goals: true,
            splits: true,
          },
        },
      },
    });

    const usageMap: GatedUsageResponse['usage'] = {};
    for (const tracker of userCount.usageTrackers) {
      usageMap[`${tracker.feature}_PER_MONTH` as Usage] = {
        count: tracker.count,
        periodStart: tracker.periodStart.toISOString(),
        periodEnd: tracker.periodEnd.toISOString(),
      };
    }

    const plan = userCount.subscription!.plan;

    return {
      plan,
      status: userCount.subscription!.status,
      cancelAtPeriodEnd: userCount.subscription!.stripeCancelAtPeriodEnd,
      stripeCurrentPeriodEnd:
        userCount.subscription!.stripeCurrentPeriodEnd?.toISOString() ?? null,
      usage: usageMap,
      limits: PLAN_LIMITS[plan] as Record<Usage, number | boolean | null>,
      resourceCounts: {
        categories: userCount._count.categories,
        budgets: userCount._count.budgets,
        recurringItems: userCount._count.recurringItems,
        goals: userCount._count.goals,
        splits: userCount._count.splits,
      },
    };
  }
}
