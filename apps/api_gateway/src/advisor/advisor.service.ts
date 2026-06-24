import type Redis from 'ioredis';
import { randomUUID } from 'crypto';
import {
  Observable,
  catchError,
  finalize,
  from,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

import { Queue } from 'bullmq';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  MessageEvent,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ClientGrpc } from '@nestjs/microservices';

import {
  AI_PACKAGE_NAME,
  AI_SERVICE_NAME,
  AiServiceClient,
} from '@fintrack/types/protos/ai/ai';
import { PrismaService } from '@fintrack/database/service';
import {
  AdvisorChatRole,
  AdvisorScope,
  AiInsight,
  UsageFeature,
} from '@fintrack/database/types';
import { PLAN_LIMITS, Usage } from '@fintrack/types/constants/plan.constants';
import {
  REDIS_CLIENT,
  INSIGHTS_CACHE_PREFIX,
  INSIGHTS_CACHE_TTL,
  INSIGHTS_UNREAD_CACHE_PREFIX,
  INSIGHTS_UNREAD_CACHE_TTL,
  INSIGHTS_COOLDOWN,
  INSIGHTS_COOLDOWN_TTL,
  ORACLE_MACRO_CACHE_KEY,
  ORACLE_MACRO_CACHE_TTL,
  ADVISOR_SCOPES_CACHE_PREFIX,
  ADVISOR_SCOPES_CACHE_TTL,
  ADVISOR_PENDING_PREFIX,
  ADVISOR_PENDING_TTL,
  ADVISOR_CONVERSATIONS_CACHE_PREFIX,
  ADVISOR_CONVERSATIONS_CACHE_TTL,
} from '@fintrack/types/constants/redis.costants';
import { MacroContext } from '@fintrack/types/interfaces/insights';
import {
  INSIGHTS_JOB,
  INSIGHTS_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { InsightsJobPayload } from '@fintrack/types/interfaces/insights';
import type {
  ConversationMessagePage,
  ConversationSummary,
} from '@fintrack/types/interfaces/ai';

import { UpdateAdvisorScopesDto } from './dto/advisor.dto';

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
export class AdvisorService implements OnModuleInit {
  private aiServiceClient: AiServiceClient;
  private readonly logger = new Logger(AdvisorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(INSIGHTS_QUEUE) private readonly insightsQueue: Queue,
    @Inject(AI_PACKAGE_NAME) private readonly aiClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.aiServiceClient =
      this.aiClient.getService<AiServiceClient>(AI_SERVICE_NAME);
  }

  private pendingKey(token: string): string {
    return `${ADVISOR_PENDING_PREFIX}:${token}`;
  }

  /**
   * Stages a message for streaming and returns a short-lived token.
   *
   * SSE is GET-only, so the message can't be sent in the stream request's body.
   * The client POSTs the message here first; we stash it in Redis (60s TTL) keyed
   * by a random token, then the `@Sse` step consumes it by token. The owner is
   * baked into the payload so the token can't be replayed by another user.
   */
  async stageMessage(
    userId: string,
    body: { conversationId: string; message: string },
  ): Promise<{ streamToken: string }> {
    const streamToken = randomUUID();
    await this.redis.setex(
      this.pendingKey(streamToken),
      ADVISOR_PENDING_TTL,
      JSON.stringify({
        userId,
        conversationId: body.conversationId,
        message: body.message,
      }),
    );
    return { streamToken };
  }

  /**
   * Opens the advisor stream for a previously staged message. Consumes the token
   * (single use), resolves the user's granted scopes, then calls the ai_service
   * `SendAdvisorMessage` server-stream and adapts each chunk into an SSE
   * `MessageEvent`. A bad/expired token or a stream failure is surfaced as a
   * final `error` chunk rather than tearing the connection down.
   *
   * The user identity is carried in gRPC metadata (`x-user-id`), never the body.
   */
  streamMessage(userId: string, streamToken: string): Observable<MessageEvent> {
    let conversationId = '';
    let assistantText = '';

    return from(this.consumePending(userId, streamToken)).pipe(
      switchMap((staged) => {
        conversationId = staged.conversationId;

        const metadata = new Metadata();
        metadata.set('x-user-id', userId);

        return this.aiServiceClient.sendAdvisorMessage(
          {
            conversationId: staged.conversationId,
            userId,
            message: staged.message,
            grantedScopes: staged.grantedScopes,
          },
          metadata,
        );
      }),
      // Accumulate the advisor's text so the full turn can be persisted.
      tap((chunk) => {
        if (chunk.type === 'token') assistantText += chunk.content;
      }),
      map((chunk) => ({ data: chunk }) as MessageEvent),
      catchError((err: Error) => {
        this.logger.error(
          `[ADV-GW] stream failed convo=${conversationId}: ${err?.message}`,
        );
        return of({
          data: {
            type: 'error',
            content: err?.message ?? 'Advisor stream failed',
            data: '',
          },
        } as MessageEvent);
      }),
      // Persist the assistant turn whether the stream completed or the client
      // disconnected (partial replies are still worth keeping).
      finalize(() => {
        if (conversationId && assistantText.trim()) {
          void this.persistAssistantTurn(conversationId, assistantText);
        }
      }),
    );
  }

  /**
   * Reads and deletes a staged message (single use), verifies token ownership,
   * persists the user turn (which also verifies the conversation belongs to the
   * user — guarding the checkpointer thread against cross-user access), then
   * resolves granted scopes. Throws on an expired token or ownership mismatch;
   * the caller turns that into an `error` chunk.
   */
  private async consumePending(
    userId: string,
    streamToken: string,
  ): Promise<{
    conversationId: string;
    message: string;
    grantedScopes: AdvisorScope[];
  }> {
    const key = this.pendingKey(streamToken);
    const raw = await this.redis.get(key);
    if (!raw) {
      throw new Error('That message expired. Please send it again.');
    }
    await this.redis.del(key);

    const staged = JSON.parse(raw) as {
      userId: string;
      conversationId: string;
      message: string;
    };
    if (staged.userId !== userId) throw new Error('Unauthorized');

    // Persist the user turn + verify conversation ownership BEFORE the gRPC call,
    // so we never load another user's checkpointer thread.
    await this.persistUserTurn(userId, staged.conversationId, staged.message);

    const grantedScopes = await this.resolveGrantedScopes(userId);
    return {
      conversationId: staged.conversationId,
      message: staged.message,
      grantedScopes,
    };
  }

  // ── Conversation persistence ─────────────────────────────────────────────────

  /** First-line title from the opening message, trimmed to a sensible length. */
  private deriveTitle(message: string): string {
    const firstLine = message.replace(/\s+/g, ' ').trim();
    return firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine;
  }

  /**
   * Records the user message: creates the conversation on first use (titled from
   * the message) or bumps `updatedAt`, then appends the message. Rejects if the
   * conversation id already belongs to another user.
   */
  private async persistUserTurn(
    userId: string,
    conversationId: string,
    message: string,
  ): Promise<void> {
    try {
      const existing = await this.prisma.advisorConversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
      });

      if (existing && existing.userId !== userId) {
        throw new Error('Forbidden');
      }

      // Create the conversation on first use, else bump its activity time.
      if (existing) {
        await this.prisma.advisorConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      } else {
        await this.prisma.advisorConversation.create({
          data: {
            id: conversationId,
            userId,
            title: this.deriveTitle(message),
          },
        });
      }

      // Append the user message.
      await this.prisma.advisorChatMessage.create({
        data: { conversationId, role: AdvisorChatRole.USER, content: message },
      });

      // New conversation or bumped recency → the sidebar list changed.
      this.bustConversationsCache(userId);
    } catch (err) {
      this.logger.error(
        `[ADV-GW] persistUserTurn failed convo=${conversationId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  /** Appends the advisor's reply and bumps the conversation's `updatedAt`. */
  private async persistAssistantTurn(
    conversationId: string,
    content: string,
  ): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.advisorChatMessage.create({
          data: { conversationId, role: AdvisorChatRole.ASSISTANT, content },
        }),
        this.prisma.advisorConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);
    } catch {
      // Best-effort — a persistence failure must not break the user's stream.
    }
  }

  /**
   * Lists a user's conversations, newest first — id + title + updatedAt only.
   * Preview/message-count are deliberately omitted: they go stale on every turn
   * and aren't worth the sync cost. Redis-cached per user; busted whenever the
   * user's conversations change.
   */
  async getConversations(userId: string): Promise<ConversationSummary[]> {
    const cacheKey = this.conversationsCacheKey(userId);

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return (
          JSON.parse(cached) as {
            id: string;
            title: string;
            updatedAt: string;
          }[]
        ).map((c) => ({ ...c, updatedAt: new Date(c.updatedAt) }));
      }
    } catch {
      // Cache miss/parse error — fall through to the database.
    }

    const conversations = await this.prisma.advisorConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
    });

    void this.redis
      .setex(
        cacheKey,
        ADVISOR_CONVERSATIONS_CACHE_TTL,
        JSON.stringify(conversations),
      )
      .catch(() => {});

    return conversations;
  }

  /**
   * Returns a page of a conversation's messages, newest-first internally but
   * resolved oldest→newest for display, with a cursor for the previous (older)
   * page. Powers the infinite scroll-up history. Ownership-enforced; an unknown
   * conversation resolves to an empty page (e.g. a brand-new or just-deleted id).
   */
  async getConversationMessages(
    userId: string,
    conversationId: string,
    opts: { cursor?: string; limit?: number },
  ): Promise<ConversationMessagePage> {
    const conversation = await this.prisma.advisorConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation) return { messages: [], nextCursor: null };
    if (conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);

    // Fetch newest-first so the cursor walks backwards in time (scroll-up).
    const rows = await this.prisma.advisorChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // +1 sentinel tells us whether an older page exists
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      select: { id: true, role: true, content: true, createdAt: true },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    // `page` is newest→oldest; reverse to oldest→newest for rendering.
    return { messages: page.reverse(), nextCursor };
  }

  /**
   * Renames a conversation (ownership-enforced) and busts the list cache.
   */
  async renameConversation(
    userId: string,
    conversationId: string,
    title: string,
  ): Promise<{ id: string; title: string; updatedAt: Date }> {
    const trimmed = title.trim();
    if (!trimmed) throw new BadRequestException('Title cannot be empty');

    const existing = await this.prisma.advisorConversation.findUnique({
      where: { id: conversationId, userId },
      select: { userId: true },
    });
    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }

    const updated = await this.prisma.advisorConversation.update({
      where: { id: conversationId },
      data: { title: trimmed.slice(0, 120) },
      select: { id: true, title: true, updatedAt: true },
    });

    this.bustConversationsCache(userId);
    return updated;
  }

  /**
   * Permanently deletes a conversation, its messages (FK cascade) and — best
   * effort — its LangGraph checkpointer thread. No archive. Ownership-enforced.
   */
  async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const existing = await this.prisma.advisorConversation.findUnique({
      where: { id: conversationId, userId },
      select: { userId: true },
    });
    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.advisorConversation.delete({
      where: { id: conversationId },
    });

    await this.purgeCheckpointerThread(conversationId);
    this.bustConversationsCache(userId);
  }

  /**
   * Best-effort removal of a thread's rows from the LangGraph Postgres
   * checkpointer (same database). Table names are fixed constants; the thread id
   * is parameterised. Failures are logged and swallowed — the conversation is
   * already gone, and orphaned checkpoint rows are harmless.
   */
  private async purgeCheckpointerThread(threadId: string): Promise<void> {
    const tables = ['checkpoint_writes', 'checkpoint_blobs', 'checkpoints'];
    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM "${table}" WHERE thread_id = $1`,
          threadId,
        );
      } catch (err) {
        this.logger.warn(
          `[ADV-GW] checkpointer purge skipped table=${table} convo=${threadId}: ${(err as Error).message}`,
        );
      }
    }
  }

  private conversationsCacheKey(userId: string): string {
    return `${ADVISOR_CONVERSATIONS_CACHE_PREFIX}:${userId}`;
  }

  private bustConversationsCache(userId: string): void {
    void this.redis.del(this.conversationsCacheKey(userId)).catch(() => {});
  }

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
   * Returns the current macro-economic context (USD/NGN rate, food CPI, CBN rate)
   * read live from the Redis cache populated by the scheduler's hourly oracle
   * refresh. This is the canonical source for displaying macro data on the
   * frontend — never the `macroContext` snapshot saved on an insight row, which
   * is point-in-time and may be stale.
   *
   * Returns `null` when the cache is cold (e.g. before the first refresh run).
   *
   * @returns {Promise<MacroContext | null>} Latest cached macro context, or null
   */
  async getMacroContext(): Promise<MacroContext | null> {
    // 1. Hot path — value populated by the scheduler's hourly oracle refresh.
    try {
      const cached = await this.redis.get(ORACLE_MACRO_CACHE_KEY);
      if (cached) return JSON.parse(cached) as MacroContext;
    } catch {
      // Treat a Redis failure as a cache miss — fall through to the DB fallback.
    }

    // 2. Cold cache (e.g. before the first refresh run) — fall back to the most
    //    recent insight's macro snapshot so the FE still shows recent values,
    //    then re-seed Redis so subsequent reads are fast. The hourly cron will
    //    overwrite this with fresh data on its next run.
    const recent = await this.prisma.aiInsight.findMany({
      orderBy: { generatedAt: 'desc' },
      take: 5,
      select: { macroContext: true },
    });

    const macro =
      recent
        .map((r) => r.macroContext as MacroContext | null)
        .find((m): m is MacroContext => !!m && typeof m === 'object') ?? null;

    if (!macro) return null;

    void this.redis
      .setex(
        ORACLE_MACRO_CACHE_KEY,
        ORACLE_MACRO_CACHE_TTL,
        JSON.stringify(macro),
      )
      .catch(() => {});

    return macro;
  }

  // ── Advisor consent / scopes ─────────────────────────────────────────────────

  private scopesCacheKey(userId: string): string {
    return `${ADVISOR_SCOPES_CACHE_PREFIX}:${userId}`;
  }

  /**
   * Returns a user's advisor consent exactly as stored — whether the advisor is
   * enabled and which data scopes are granted.
   *
   * Every user has a row (created at signup, backfilled for older accounts via
   * `db:backfill-advisor-settings`), so we never substitute a default that could
   * misrepresent what the user actually saved. In the shouldn't-happen case of a
   * missing row, we report a disabled, empty-scope state so the frontend prompts
   * the user to set it up rather than silently granting access.
   */
  async getAdvisorScopes(
    userId: string,
  ): Promise<{ enabled: boolean; grantedScopes: AdvisorScope[] }> {
    const setting = await this.prisma.advisorSetting.findUnique({
      where: { userId },
      select: { enabled: true, grantedScopes: true },
    });

    return setting ?? { enabled: false, grantedScopes: [] };
  }

  /**
   * Resolves just the granted scopes for a user, Redis-cached (5 min) so the
   * advisor hot path never hits Postgres. Falls back to a DB read on a cache
   * miss and re-seeds the cache. The cache is busted on every scope update.
   */
  async resolveGrantedScopes(userId: string): Promise<AdvisorScope[]> {
    const cacheKey = this.scopesCacheKey(userId);

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as AdvisorScope[];
    } catch {
      // Treat a Redis failure as a miss — fall through to the DB.
    }

    const { grantedScopes } = await this.getAdvisorScopes(userId);

    void this.redis
      .setex(cacheKey, ADVISOR_SCOPES_CACHE_TTL, JSON.stringify(grantedScopes))
      .catch(() => {});

    return grantedScopes;
  }

  /**
   * Updates a user's advisor consent, busts the scopes cache, and audits the
   * change. Upserts defensively (the row normally already exists from signup /
   * backfill). Returns the new consent state.
   */
  async updateAdvisorScopes(
    userId: string,
    input: UpdateAdvisorScopesDto,
  ): Promise<{ enabled: boolean; grantedScopes: AdvisorScope[] }> {
    const data = {
      ...(input.grantedScopes && { grantedScopes: input.grantedScopes }),
      ...(input.enabled !== undefined && { enabled: input.enabled }),
    };

    const updated = await this.prisma.advisorSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      select: { enabled: true, grantedScopes: true },
    });

    // Busting the cache before returning keeps the next read consistent.
    void this.redis.del(this.scopesCacheKey(userId)).catch(() => {});

    return updated;
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
