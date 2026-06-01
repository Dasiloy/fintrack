import type Redis from 'ioredis';

import { Queue } from 'bullmq';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import { AiInsight, UsageFeature } from '@fintrack/database/types';
import { PLAN_LIMITS, Usage } from '@fintrack/types/constants/plan.constants';
import {
  REDIS_CLIENT,
  INSIGHTS_CACHE_PREFIX,
  INSIGHTS_CACHE_TTL,
  INSIGHTS_UNREAD_CACHE_PREFIX,
  INSIGHTS_UNREAD_CACHE_TTL,
  INSIGHTS_COOLDOWN,
  INSIGHTS_COOLDOWN_TTL,
} from '@fintrack/types/constants/redis.costants';
import {
  INSIGHTS_JOB,
  INSIGHTS_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { InsightsJobPayload } from '@fintrack/types/interfaces/insights';

/**
 * API Gateway service for AI Advisor insights.
 * Reads directly from Prisma (DatabaseModule is global) and maintains a
 * Redis cache so the hot path never hits Postgres.
 *
 * ## Cache keys
 *
 *   insights:{userId}          — latest single AiInsight row (TTL 1 h).
 *                                 Populated on the first `getInsights(limit=1)` call after a cache miss.
 *                                 Deleted by `ai_service` InsightService.runGraph() after every
 *                                 successful graph run, forcing a fresh read on the next request.
 *
 *   insights_unread:{userId}   — count of insights with `readAt IS NULL` (TTL 5 min).
 *                                 Used to drive the notification badge on the frontend.
 *                                 Deleted after `markInsightRead` and `markAllRead`.
 *
 * ## Cache bypass
 * `getInsights` with `limit > 1` bypasses the cache (variable-size lists are not
 * worth caching at multiple granularities; the single-latest case is the 99th percentile).
 *
 * ## Manual trigger
 * `triggerInsights` enqueues an INSIGHTS_JOB with `trigger: 'manual'` and returns
 * immediately — the graph runs asynchronously in the AI service. A Redis cooldown key
 * (`insights_trigger_cooldown:{userId}`, TTL 10 min) prevents the user from spamming
 * the queue. BullMQ also deduplicates via `jobId` so concurrent requests that race past
 * the cooldown still only produce one queued job.
 *
 * @class AdvisorService
 */
@Injectable()
export class AdvisorService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(INSIGHTS_QUEUE) private readonly insightsQueue: Queue,
  ) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Fire-and-forget invalidation of both insight cache keys for a user.
   * A Redis failure must never surface to the caller — reads will recover via DB.
   */
  private invalidateInsightCache(userId: string): void {
    void this.redis
      .del(
        `${INSIGHTS_CACHE_PREFIX}:${userId}`,
        `${INSIGHTS_UNREAD_CACHE_PREFIX}:${userId}`,
      )
      .catch(() => {});
  }

  /**
   * Fire-and-forget invalidation of only the unread-count cache.
   * Used when a read operation changes `readAt` but leaves the insight list itself intact.
   */
  private invalidateUnreadCache(userId: string): void {
    void this.redis
      .del(`${INSIGHTS_UNREAD_CACHE_PREFIX}:${userId}`)
      .catch(() => {});
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns the most recent AI insight(s) for a user, newest first.
   *
   * When `limit === 1` (the default and most common case), the result is served
   * from `insights:{userId}` for up to 1 hour. Multi-row requests bypass the cache.
   *
   * @param {string} userId  - Authenticated user ID
   * @param {number} limit   - Number of insights to return (1–20, default 1)
   * @returns {Promise<AiInsight[]>} Ordered by generatedAt desc
   */
  async getInsights(userId: string, limit: number = 1): Promise<AiInsight[]> {
    const cacheKey = `${INSIGHTS_CACHE_PREFIX}:${userId}`;

    if (limit === 1) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as AiInsight[];
    }

    const insights = await this.prisma.aiInsight.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });

    if (limit === 1) {
      void this.redis
        .setex(cacheKey, INSIGHTS_CACHE_TTL, JSON.stringify(insights))
        .catch(() => {});
    }

    return insights;
  }

  /**
   * Returns the count of unread insights (`readAt IS NULL`) for a user.
   * Cached in `insights_unread:{userId}` for 5 minutes — this value powers
   * the notification badge and is read on every page load.
   *
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<number>} Number of insights the user has not yet read
   */
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `${INSIGHTS_UNREAD_CACHE_PREFIX}:${userId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached !== null) return Number(cached);

    const count = await this.prisma.aiInsight.count({
      where: { userId, readAt: null },
    });

    void this.redis
      .setex(cacheKey, INSIGHTS_UNREAD_CACHE_TTL, String(count))
      .catch(() => {});

    return count;
  }

  /**
   * Marks a single insight as read by setting `readAt` to the current timestamp.
   * No-ops gracefully if the insight is already read.
   * Ownership is enforced — throws `NotFoundException` if the record doesn't belong to the user.
   *
   * Invalidates `insights_unread:{userId}` so the badge count refreshes immediately.
   * Also invalidates `insights:{userId}` because the cached row now has a stale `readAt`.
   *
   * @param {string} userId    - Authenticated user ID (ownership check)
   * @param {string} insightId - AiInsight ID to mark as read
   * @returns {Promise<AiInsight>} The updated insight
   * @throws {NotFoundException} If the insight does not exist or belongs to another user
   */
  async markInsightRead(userId: string, insightId: string): Promise<AiInsight> {
    const existing = await this.prisma.aiInsight.findFirst({
      where: { id: insightId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Insight not found');
    }

    if (existing.readAt !== null) {
      // Already read — return as-is without a write
      return existing;
    }

    const updated = await this.prisma.aiInsight.update({
      where: { id: insightId },
      data: { readAt: new Date() },
    });

    this.invalidateInsightCache(userId);
    return updated;
  }

  /**
   * Marks all unread insights for a user as read in a single bulk update.
   * A no-op if all insights are already read.
   *
   * Invalidates both `insights:{userId}` and `insights_unread:{userId}` so
   * all downstream reads see the updated state immediately.
   *
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<number>} Number of insights updated (0 if all were already read)
   */
  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.aiInsight.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    if (result.count > 0) {
      this.invalidateInsightCache(userId);
    } else {
      // No rows changed but unread cache may still be stale from a prior partial read
      this.invalidateUnreadCache(userId);
    }

    return result.count;
  }

  // ── Trigger ────────────────────────────────────────────────────────────────

  /**
   * Enqueues a manual insights graph run for the user and returns immediately.
   *
   * Enforces a 10-minute Redis cooldown so the user cannot spam the queue.
   * BullMQ `jobId` deduplication (`manual_insights:{userId}:{date}`) is a second
   * guard that prevents duplicate jobs from racing through the cooldown window.
   *
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<{ queued: boolean; cooldownSeconds?: number ,limitReached?: boolean}>}
   *   `queued: true` when the job was enqueued, or
   *   `queued: false` + `cooldownSeconds` remaining when the cooldown is active.
   */
  async triggerInsights(userId: string): Promise<{
    queued: boolean;
    cooldownSeconds?: number;
    limitReached?: boolean;
  }> {
    // Resolve plan + usage tracker together.
    const sub = await this.prisma.subscription.findFirst({
      where: { userId },
      select: { plan: true },
    });

    // No subscription row → cannot proceed.
    if (!sub) return { queued: false, limitReached: true };

    if (sub.plan !== 'PRO') {
      const limit = PLAN_LIMITS['FREE'][
        Usage.AI_INSIGHTS_QUERIES_PER_MONTH
      ] as number;
      const tracker = await this.prisma.usageTracker.findFirst({
        where: { userId, feature: UsageFeature.AI_INSIGHTS_QUERIES },
        select: { count: true },
      });
      // No tracker row or quota exhausted → block.
      if (!tracker || tracker.count >= limit) {
        return { queued: false, limitReached: true };
      }
    }

    const cooldownKey = `${INSIGHTS_COOLDOWN}:${userId}`;
    const ttl = await this.redis.ttl(cooldownKey);

    if (ttl > 0) {
      return { queued: false, cooldownSeconds: ttl };
    }

    await this.insightsQueue.add(INSIGHTS_JOB, {
      userId,
      trigger: 'manual',
    } satisfies InsightsJobPayload);

    // Set cooldown — fire-and-forget; a Redis failure just means no cooldown enforcement
    void this.redis
      .setex(cooldownKey, INSIGHTS_COOLDOWN_TTL, '1')
      .catch(() => {});

    return { queued: true };
  }
}
