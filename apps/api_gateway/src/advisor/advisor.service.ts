import type Redis from 'ioredis';
import { randomUUID } from 'crypto';
import {
  Observable,
  catchError,
  concatWith,
  defer,
  finalize,
  from,
  ignoreElements,
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
  Prisma,
  UsageFeature,
} from '@fintrack/database/types';
import { PLAN_LIMITS, Usage } from '@fintrack/types/constants/plan.constants';
import {
  ADVISOR_FILES_MAX_TOTAL_SIZE,
  ADVISOR_FILE_MIME_TYPES,
} from '@fintrack/types/constants/file.constants';
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
  ADVISOR_ATTACHMENT_CLEANUP_JOB,
  ADVISOR_ATTACHMENT_CLEANUP_QUEUE,
  INSIGHTS_JOB,
  INSIGHTS_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { InsightsJobPayload } from '@fintrack/types/interfaces/insights';
import type {
  AdvisorAction,
  AdvisorAttachment,
  AdvisorAttachmentCleanupItem,
  AdvisorActionState,
  AdvisorMessageMetadata,
  AdvisorPendingPayload,
  ConsumedAdvisorPending,
  ConversationMessagePage,
  ConversationSummary,
} from '@fintrack/types/interfaces/ai';

import { UpdateAdvisorScopesDto } from './dto/advisor.dto';
import { UploadService } from '../upload/upload.service';

/**
 * Coordinates every API-gateway concern for the AI Advisor feature.
 *
 * The gateway owns HTTP/SSE ergonomics, user ownership checks, durable chat
 * history, advisor consent, insight caching, and manual insight queueing. The
 * actual agent graph still runs in `ai_service`; this service adapts that gRPC
 * stream into frontend-safe SSE events and stores the user-facing transcript.
 *
 * Cache ownership:
 * - `insights:{userId}` stores the latest insight for the dashboard hot path.
 * - `insights_unread:{userId}` stores the unread badge count.
 * - `advisor_scopes:{userId}` stores consent scopes used by the chat hot path.
 * - `advisor_conversations:{userId}` stores the sidebar conversation list.
 *
 * Human-in-the-loop cards are persisted as assistant chat-message metadata so a
 * page refresh can restore pending, approved, and rejected approval cards.
 */
@Injectable()
export class AdvisorService implements OnModuleInit {
  private aiServiceClient: AiServiceClient;
  private readonly logger = new Logger(AdvisorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(INSIGHTS_QUEUE) private readonly insightsQueue: Queue,
    @InjectQueue(ADVISOR_ATTACHMENT_CLEANUP_QUEUE)
    private readonly advisorAttachmentCleanupQueue: Queue,
    private readonly uploadService: UploadService,
    @Inject(AI_PACKAGE_NAME) private readonly aiClient: ClientGrpc,
  ) {}

  /**
   * Binds the generated gRPC AI service client after Nest has created the
   * underlying transport.
   */
  onModuleInit(): void {
    this.aiServiceClient =
      this.aiClient.getService<AiServiceClient>(AI_SERVICE_NAME);
  }

  // ── Advisor chat public API ─────────────────────────────────────────────────

  /**
   * Stores a chat message or HITL resume decision long enough for SSE to read it.
   *
   * Browser `EventSource` opens the stream with a GET request, so the client
   * first POSTs the payload here. The payload is stored under a random token and
   * consumed exactly once by {@link streamMessage}. The user id is embedded in
   * the staged value to prevent token replay across accounts.
   *
   * @param userId Authenticated user id.
   * @param body Message text or a resume decision for a pending approval card.
   * @returns A short-lived stream token for the SSE endpoint.
   * @throws BadRequestException when neither message nor resume data is present.
   */
  async stageMessage(
    userId: string,
    body: {
      conversationId: string;
      message?: string;
      resume?: { approved: boolean };
      attachments?: AdvisorAttachment[];
    },
  ): Promise<{ streamToken: string }> {
    const attachments = this.validateAdvisorAttachments(
      userId,
      body.attachments ?? [],
    );
    if (!body.resume && !body.message?.trim() && attachments.length === 0) {
      throw new BadRequestException('Message or resume payload is required');
    }

    const streamToken = randomUUID();
    await this.redis.setex(
      this.pendingKey(streamToken),
      ADVISOR_PENDING_TTL,
      JSON.stringify({
        userId,
        conversationId: body.conversationId,
        ...(body.resume
          ? { resume: body.resume }
          : {
              message: body.message?.trim() ?? '',
              ...(attachments.length > 0
                ? { attachments: attachments.map(this.toStoredAttachment) }
                : {}),
            }),
      }),
    );
    return { streamToken };
  }

  /**
   * Converts one staged advisor request into an SSE stream.
   *
   * Normal messages call `SendAdvisorMessage`; approval or rejection decisions
   * call `ResumeAdvisor`. Every gRPC chunk is forwarded as an SSE `MessageEvent`.
   * Text chunks are accumulated for durable assistant history, and
   * `approval_required` chunks are converted into persisted HITL card metadata.
   *
   * Stream errors are returned to the browser as an `error` chunk so the SSE
   * connection can finish gracefully.
   *
   * @param userId Authenticated user id.
   * @param streamToken Token returned by {@link stageMessage}.
   * @returns Observable of SSE message events.
   */
  streamMessage(userId: string, streamToken: string): Observable<MessageEvent> {
    let conversationId = '';
    let assistantText = '';
    let assistantMetadata: AdvisorMessageMetadata | null = null;
    let resumeApproved: boolean | null = null;
    let streamFailed = false;
    let finalStatePersisted = false;

    return from(this.consumePending(userId, streamToken)).pipe(
      switchMap((staged) => {
        conversationId = staged.conversationId;

        const metadata = new Metadata();
        metadata.set('x-user-id', userId);

        if ('resume' in staged) {
          resumeApproved = staged.resume.approved;
          return this.aiServiceClient.resumeAdvisor(
            {
              conversationId: staged.conversationId,
              userId,
              approved: staged.resume.approved,
              grantedScopes: staged.grantedScopes,
            },
            metadata,
          );
        }

        return this.aiServiceClient.sendAdvisorMessage(
          {
            conversationId: staged.conversationId,
            userId,
            message: staged.message,
            grantedScopes: staged.grantedScopes,
            attachments: staged.attachments.map((attachment) => ({
              ...attachment,
              url: attachment.url ?? '',
              extractedText: attachment.extractedText ?? '',
            })),
          },
          metadata,
        );
      }),
      // Accumulate the advisor's text so the full turn can be persisted.
      tap((chunk) => {
        if (chunk.type === 'error') streamFailed = true;
        if (chunk.type === 'token') assistantText += chunk.content;
        if (chunk.type === 'approval_required') {
          const proposedAction = this.parseAdvisorAction(chunk.data);
          if (proposedAction) {
            assistantMetadata = {
              proposedAction,
              actionState: 'pending',
            };
          }
        }
      }),
      map((chunk) => ({ data: chunk }) as MessageEvent),
      catchError((err: Error) => {
        streamFailed = true;
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
      concatWith(
        defer(() =>
          from(
            (async () => {
              await this.persistStreamFinalState({
                conversationId,
                assistantText,
                assistantMetadata,
                resumeApproved,
                streamFailed,
              });
              finalStatePersisted = true;
            })(),
          ).pipe(ignoreElements()),
        ),
      ),
      // Persist the assistant turn whether the stream completed or the client
      // disconnected (partial replies are still worth keeping).
      finalize(() => {
        if (finalStatePersisted) return;
        finalStatePersisted = true;
        void this.persistStreamFinalState({
          conversationId,
          assistantText,
          assistantMetadata,
          resumeApproved,
          streamFailed,
        });
      }),
    );
  }

  /**
   * Persists all state accumulated while streaming a single advisor turn.
   *
   * Normal completion awaits this method before the SSE Observable completes so
   * the frontend can immediately refetch durable history without racing the DB
   * write. Unsubscribes still call it best-effort from `finalize`.
   *
   * @param state Accumulated stream state for the just-finished turn.
   */
  private async persistStreamFinalState(state: {
    conversationId: string;
    assistantText: string;
    assistantMetadata: AdvisorMessageMetadata | null;
    resumeApproved: boolean | null;
    streamFailed: boolean;
  }): Promise<void> {
    if (!state.conversationId) return;

    if (state.resumeApproved !== null) {
      await this.markLatestPendingActionMessage(
        state.conversationId,
        state.streamFailed
          ? 'failed'
          : state.resumeApproved
            ? 'approved'
            : 'rejected',
      );
    }

    if (state.assistantText.trim() || state.assistantMetadata) {
      await this.persistAssistantTurn(
        state.conversationId,
        state.assistantText,
        state.assistantMetadata,
      );
    }
  }

  // ── Conversation public API ─────────────────────────────────────────────────

  /**
   * Lists the user's advisor conversations for the sidebar.
   *
   * The list is intentionally lightweight: id, title, and `updatedAt` only.
   * Preview text and counts are omitted because they go stale on every turn.
   * Results are Redis-cached per user and invalidated by conversation writes.
   *
   * @param userId Authenticated user id.
   * @returns Conversations newest first.
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
   * Returns a cursor page of durable chat messages for one conversation.
   *
   * Rows are fetched newest first so the cursor walks backward in time, then
   * returned oldest to newest for rendering. Assistant metadata is parsed and
   * exposed only when it matches the expected HITL-card shape.
   *
   * @param userId Authenticated user id.
   * @param conversationId Conversation to read.
   * @param opts Pagination options.
   * @returns Message page plus cursor for the next older page.
   * @throws NotFoundException when the conversation is missing or not owned by the user.
   */
  async getConversationMessages(
    userId: string,
    conversationId: string,
    opts: { cursor?: string; limit?: number },
  ): Promise<ConversationMessagePage> {
    const conversation = await this.prisma.advisorConversation.findUnique({
      where: { id: conversationId, userId },
      select: { userId: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);

    // Fetch newest-first so the cursor walks backwards in time (scroll-up).
    const rows = await this.prisma.advisorChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // +1 sentinel tells us whether an older page exists
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        metadata: true,
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    // `page` is newest→oldest; reverse to oldest→newest for rendering.
    const messages = page.reverse().map((row) => {
      const metadata = this.parseAdvisorMessageMetadata(row.metadata);
      return metadata
        ? { ...row, metadata }
        : {
            id: row.id,
            role: row.role,
            content: row.content,
            createdAt: row.createdAt,
          };
    });

    return { messages, nextCursor };
  }

  /**
   * Renames an advisor conversation owned by the user.
   *
   * @param userId Authenticated user id.
   * @param conversationId Conversation to rename.
   * @param title New title; trimmed and capped at 120 characters.
   * @returns Updated conversation summary.
   * @throws BadRequestException when the title is blank.
   * @throws NotFoundException when the conversation is missing or not owned by the user.
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
   * Permanently deletes a conversation and its related advisor state.
   *
   * Chat messages are removed by foreign-key cascade. LangGraph checkpointer
   * rows are purged best-effort so stale graph memory does not accumulate. Any
   * Cloudinary attachments referenced by chat-message metadata are captured
   * before the cascade delete and queued for non-blocking cleanup afterward.
   *
   * @param userId Authenticated user id.
   * @param conversationId Conversation to delete.
   * @throws NotFoundException when the conversation is missing or not owned by the user.
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

    const attachments =
      await this.getConversationAttachmentCleanupItems(conversationId);

    await this.prisma.advisorConversation.delete({
      where: { id: conversationId },
    });

    await this.purgeCheckpointerThread(conversationId);
    await this.queueAdvisorAttachmentCleanup(
      userId,
      conversationId,
      attachments,
    );
    this.bustConversationsCache(userId);
  }

  // ── Insights public API ─────────────────────────────────────────────────────

  /**
   * Returns recent AI insights for the dashboard.
   *
   * The single-row case is cached because it powers the common dashboard hot
   * path. Multi-row reads bypass the cache because variable-size insight lists
   * become stale too quickly to be worth caching.
   *
   * @param userId Authenticated user id.
   * @param limit Number of insights to return.
   * @returns Insights ordered newest first.
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
   * Returns the latest macro-economic context used by advisor UI surfaces.
   *
   * The Redis value populated by the scheduler is canonical. When the cache is
   * cold, the method falls back to the latest stored insight snapshot and seeds
   * Redis so the UI still has recent macro data.
   *
   * @returns Latest macro context, or null when neither cache nor fallback exists.
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

  /**
   * Returns the unread insight count for the notification badge.
   *
   * @param userId Authenticated user id.
   * @returns Number of insights where `readAt` is null.
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
   * Marks one insight as read.
   *
   * Already-read insights are returned without writing. Successful writes
   * invalidate both the latest-insight cache and unread badge cache.
   *
   * @param userId Authenticated user id.
   * @param insightId Insight id to mark as read.
   * @returns Existing or updated insight.
   * @throws NotFoundException when the insight is missing or not owned by the user.
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
   * Marks all unread insights for a user as read.
   *
   * The bulk update is a no-op when everything is already read. Cache
   * invalidation still keeps the unread badge honest.
   *
   * @param userId Authenticated user id.
   * @returns Number of rows updated.
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

  /**
   * Enqueues a manual insight generation job.
   *
   * Free users are checked against monthly insight quota before queueing. A
   * Redis cooldown prevents repeated manual triggers from spamming the worker.
   *
   * @param userId Authenticated user id.
   * @returns Queue status, cooldown seconds, or quota-limit state.
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

  // ── Advisor consent public API ──────────────────────────────────────────────

  /**
   * Returns the user's saved advisor consent state.
   *
   * Missing rows should be rare because settings are created at signup and
   * backfilled for older accounts. If one is missing, the safe response is
   * disabled with no granted scopes.
   *
   * @param userId Authenticated user id.
   * @returns Advisor enablement and granted data scopes.
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
   * Resolves granted data scopes for the advisor graph hot path.
   *
   * Scopes are cached briefly in Redis because every chat stream needs them
   * before calling `ai_service`.
   *
   * @param userId Authenticated user id.
   * @returns Granted advisor scopes.
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
   * Updates advisor consent and invalidates cached scopes.
   *
   * Uses an upsert defensively even though the setting row normally exists from
   * signup/backfill.
   *
   * @param userId Authenticated user id.
   * @param input Partial consent update.
   * @returns Saved consent state.
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

  // ── Chat staging helpers ────────────────────────────────────────────────────

  /**
   * Builds the Redis key used for one-time staged chat payloads.
   */
  private pendingKey(token: string): string {
    return `${ADVISOR_PENDING_PREFIX}:${token}`;
  }

  /**
   * Consumes a staged Redis payload and prepares it for the AI service.
   *
   * For normal user messages this persists the user turn before the graph runs,
   * ensuring conversation ownership is checked before `ai_service` can load a
   * checkpointer thread. For resume payloads it verifies ownership and marks the
   * latest pending approval card as approved or rejected.
   *
   * @param userId Authenticated user id.
   * @param streamToken One-time Redis token.
   * @returns The normalized payload plus currently granted advisor scopes.
   * @throws Error when the token is expired, owned by another user, or forbidden.
   */
  private async consumePending(
    userId: string,
    streamToken: string,
  ): Promise<ConsumedAdvisorPending> {
    const key = this.pendingKey(streamToken);
    const raw = await this.redis.get(key);
    if (!raw) {
      throw new Error('That message expired. Please send it again.');
    }
    await this.redis.del(key);

    const staged = JSON.parse(raw) as AdvisorPendingPayload;
    if (staged.userId !== userId) throw new Error('Unauthorized');

    if ('resume' in staged) {
      await this.assertConversationOwner(userId, staged.conversationId);
      await this.markLatestPendingActionMessage(
        staged.conversationId,
        'processing',
      );
    } else {
      // Persist the user turn + verify conversation ownership BEFORE the gRPC call,
      // so we never load another user's checkpointer thread.
      await this.persistUserTurn(
        userId,
        staged.conversationId,
        staged.message,
        (staged.attachments ?? []).map(this.toStoredAttachment),
      );
    }

    const grantedScopes = await this.resolveGrantedScopes(userId);
    return 'resume' in staged
      ? {
          conversationId: staged.conversationId,
          resume: staged.resume,
          grantedScopes,
        }
      : {
          conversationId: staged.conversationId,
          message: staged.message,
          attachments: (staged.attachments ?? []).map((attachment) =>
            this.toModelAttachment(userId, attachment),
          ),
          grantedScopes,
        };
  }

  /**
   * Validate Advisor Attactchmenets file configurations
   *
   * @param userId The userId of the request
   * @param attachments List of attachmenets to validate
   * @returns passed list of attachmemnets
   */
  private validateAdvisorAttachments(
    userId: string,
    attachments: AdvisorAttachment[],
  ): AdvisorAttachment[] {
    if (!attachments.length) return [];

    const total = attachments.reduce(
      (sum, attachment) => sum + attachment.sizeBytes,
      0,
    );
    if (total > ADVISOR_FILES_MAX_TOTAL_SIZE) {
      throw new BadRequestException(
        'Advisor attachments cannot exceed 10 MB total',
      );
    }

    for (const attachment of attachments) {
      if (!ADVISOR_FILE_MIME_TYPES.includes(attachment.mimeType as never)) {
        throw new BadRequestException('Unsupported advisor attachment type');
      }
      if (!attachment.publicId.startsWith(`fintrack/advisor/${userId}/`)) {
        throw new BadRequestException(
          'Advisor attachment does not belong to user',
        );
      }
    }

    return attachments;
  }

  private toStoredAttachment(attachment: AdvisorAttachment): AdvisorAttachment {
    const { url: _url, ...stored } = attachment;
    return stored;
  }

  private toModelAttachment(
    userId: string,
    attachment: AdvisorAttachment,
  ): AdvisorAttachment {
    const url = this.uploadService.getAdvisorFileUrlForUser(
      userId,
      attachment.publicId,
      attachment.format,
      'model',
    );
    if (!url) {
      throw new BadRequestException(
        'Advisor attachment does not belong to user',
      );
    }
    return { ...attachment, url };
  }

  // ── Conversation persistence helpers ────────────────────────────────────────

  /**
   * Derives the sidebar title for a new conversation from text or attachments.
   *
   * Text remains the preferred title source. Attachment-only starts use filenames
   * so several document-only conversations do not all collapse into an empty or
   * identical sidebar label.
   *
   * @param message First user message in the conversation.
   * @param attachments Files sent with the opening user turn.
   * @returns A single-line title capped to the sidebar-friendly length.
   */
  private deriveTitle(
    message: string,
    attachments: AdvisorAttachment[] = [],
  ): string {
    const firstLine = message.replace(/\s+/g, ' ').trim();
    if (firstLine) return this.capConversationTitle(firstLine);

    const firstAttachmentName = attachments[0]?.name
      ?.replace(/\s+/g, ' ')
      .trim();
    if (!firstAttachmentName) return 'Document review';

    const suffix =
      attachments.length > 1 ? ` +${attachments.length - 1} more` : '';
    return this.capConversationTitle(
      `Documents: ${firstAttachmentName}${suffix}`,
    );
  }

  /**
   * Caps a generated conversation title to the sidebar-friendly length.
   *
   * @param title Raw title candidate.
   * @returns Title no longer than 25 characters.
   */
  private capConversationTitle(title: string): string {
    return title.length > 25 ? `${title.slice(0, 25)}…` : title;
  }

  /**
   * Persists an inbound user chat turn.
   *
   * Creates the conversation on the first turn, otherwise bumps recency, then
   * appends the user message. This method also enforces ownership before the AI
   * graph receives the conversation id.
   *
   * @param userId Authenticated user id.
   * @param conversationId Client-generated conversation id / LangGraph thread id.
   * @param message Trimmed user message text.
   * @throws Error when the conversation belongs to another user.
   */
  private async persistUserTurn(
    userId: string,
    conversationId: string,
    message: string,
    attachments: AdvisorAttachment[] = [],
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
            title: this.deriveTitle(message, attachments),
          },
        });
      }

      // Append the user message.
      await this.prisma.advisorChatMessage.create({
        data: {
          conversationId,
          role: AdvisorChatRole.USER,
          content: message,
          ...(attachments.length > 0
            ? {
                metadata: this.toJsonMetadata({
                  attachments,
                }),
              }
            : {}),
        },
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

  /**
   * Ensures a conversation exists and belongs to the authenticated user.
   *
   * @param userId Authenticated user id.
   * @param conversationId Conversation id to validate.
   * @throws Error when the conversation does not exist or belongs to another user.
   */
  private async assertConversationOwner(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const existing = await this.prisma.advisorConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error('Forbidden');
    }
  }

  /**
   * Persists an assistant turn and bumps conversation recency.
   *
   * `metadata` is used for non-text UI artifacts, currently HITL approval cards.
   * This is best-effort because a persistence failure should not break an active
   * SSE response after chunks have already reached the browser.
   *
   * @param conversationId Conversation receiving the assistant turn.
   * @param content Full assistant text accumulated from streamed tokens.
   * @param metadata Optional structured metadata for approval-card rendering.
   */
  private async persistAssistantTurn(
    conversationId: string,
    content: string,
    metadata?: AdvisorMessageMetadata | null,
  ): Promise<void> {
    try {
      await Promise.all([
        this.prisma.advisorChatMessage.create({
          data: {
            conversationId,
            role: AdvisorChatRole.ASSISTANT,
            content,
            ...(metadata ? { metadata: this.toJsonMetadata(metadata) } : {}),
          },
        }),
        this.prisma.advisorConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }, // best-fit, no -op // no update here does not really affet since user messager was updated
        }),
      ]);
    } catch (err) {
      this.logger.error(
        `[ADV-GW] persistAssistantTurn failed convo=${conversationId}: ${(err as Error).message}`,
      );
      // Best-effort — a persistence failure must not break the user's stream.
    }
  }

  // ── Message metadata and HITL helpers ───────────────────────────────────────

  /**
   * Parses a streamed `approval_required` payload into an advisor action.
   *
   * @param data JSON string emitted by `ai_service`.
   * @returns Parsed action, or null when the payload is malformed.
   */
  private parseAdvisorAction(data: string): AdvisorAction | null {
    try {
      const parsed = JSON.parse(data) as AdvisorAction;
      return parsed && typeof parsed === 'object' && 'kind' in parsed
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  /**
   * Validates persisted chat-message metadata before returning it to clients.
   *
   * @param value Raw Prisma JSON value.
   * @returns HITL metadata when it has a proposed action and valid state.
   */
  private parseAdvisorMessageMetadata(
    value: unknown,
  ): AdvisorMessageMetadata | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const metadata = value as AdvisorMessageMetadata;
    const hasValidState =
      !metadata.actionState ||
      ['pending', 'processing', 'approved', 'rejected', 'failed'].includes(
        metadata.actionState,
      );
    const hasAction =
      !!metadata.proposedAction &&
      typeof metadata.proposedAction === 'object' &&
      'kind' in metadata.proposedAction;
    const hasAttachments =
      Array.isArray(metadata.attachments) && metadata.attachments.length > 0;

    if (!hasValidState || (!hasAction && !hasAttachments)) return null;
    return metadata;
  }

  /**
   * Updates the latest pending approval card after the user approves or rejects.
   *
   * The frontend sends only the resume decision to the stream endpoint. To keep
   * refresh behavior durable, the gateway finds the most recent pending card in
   * the conversation and stores the terminal state before the resume stream runs.
   *
   * @param conversationId Conversation that owns the pending action card.
   * @param actionState Terminal state selected by the user.
   */
  private async markLatestPendingActionMessage(
    conversationId: string,
    actionState: AdvisorActionState,
  ): Promise<void> {
    try {
      const candidates = await this.prisma.advisorChatMessage.findMany({
        where: { conversationId, role: AdvisorChatRole.ASSISTANT },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, metadata: true },
      });

      const pending = candidates
        .map((row) => ({
          id: row.id,
          metadata: this.parseAdvisorMessageMetadata(row.metadata),
        }))
        .find((row) =>
          actionState === 'processing'
            ? row.metadata?.actionState === 'pending' ||
              row.metadata?.actionState === 'failed'
            : row.metadata?.actionState === 'processing',
        );

      if (!pending?.metadata) return;

      await this.prisma.advisorChatMessage.update({
        where: { id: pending.id },
        data: {
          metadata: this.toJsonMetadata({
            ...pending.metadata,
            actionState,
          }),
        },
      });
    } catch (err) {
      this.logger.warn(
        `[ADV-GW] pending action update skipped convo=${conversationId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Converts typed metadata into Prisma's JSON input shape.
   *
   * Prisma JSON inputs require indexable JSON values rather than plain typed
   * interfaces, so serialization gives us a clean JSON object with the same data.
   *
   * @param metadata Typed advisor message metadata.
   * @returns Prisma-compatible JSON value.
   */
  private toJsonMetadata(
    metadata: AdvisorMessageMetadata,
  ): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue;
  }

  // ── Conversation deletion helpers ───────────────────────────────────────────

  /**
   * Reads advisor message metadata before conversation deletion removes rows.
   *
   * @param conversationId Conversation whose message metadata should be scanned.
   * @returns Deduped Cloudinary attachment cleanup items.
   */
  private async getConversationAttachmentCleanupItems(
    conversationId: string,
  ): Promise<AdvisorAttachmentCleanupItem[]> {
    try {
      const rows = await this.prisma.advisorChatMessage.findMany({
        where: { conversationId },
        select: { metadata: true },
      });

      return this.dedupeAttachmentCleanupItems(
        rows.flatMap((row) => {
          const metadata = this.parseAdvisorMessageMetadata(row.metadata);
          return metadata?.attachments ?? [];
        }),
      );
    } catch (err) {
      this.logger.warn(
        `[ADV-GW] advisor attachment scan skipped convo=${conversationId}: ${(err as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Enqueues best-effort Cloudinary cleanup for deleted conversation files.
   *
   * Queue failures are logged and swallowed because the conversation deletion
   * has already succeeded and orphaned Cloudinary files are not user-facing.
   *
   * @param userId Conversation owner id.
   * @param conversationId Deleted conversation id.
   * @param attachments Attachment public ids captured before cascade deletion.
   */
  private async queueAdvisorAttachmentCleanup(
    userId: string,
    conversationId: string,
    attachments: AdvisorAttachmentCleanupItem[],
  ): Promise<void> {
    if (attachments.length === 0) return;

    try {
      await this.advisorAttachmentCleanupQueue.add(
        ADVISOR_ATTACHMENT_CLEANUP_JOB,
        { userId, conversationId, attachments },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: 50,
        },
      );
    } catch (err) {
      this.logger.warn(
        `[ADV-GW] advisor attachment cleanup enqueue skipped convo=${conversationId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Converts full attachment metadata into minimal unique cleanup items.
   *
   * @param attachments Full metadata attachments stored on chat messages.
   * @returns Unique Cloudinary cleanup candidates.
   */
  private dedupeAttachmentCleanupItems(
    attachments: AdvisorAttachment[],
  ): AdvisorAttachmentCleanupItem[] {
    return Array.from(
      new Map(
        attachments
          .filter((attachment) => attachment.publicId && attachment.kind)
          .map((attachment) => [
            attachment.publicId,
            {
              publicId: attachment.publicId,
              kind: attachment.kind,
              name: attachment.name,
            },
          ]),
      ).values(),
    );
  }

  /**
   * Removes LangGraph checkpointer rows for a deleted conversation.
   *
   * The checkpointer uses fixed table names in the same database. Failures are
   * logged and swallowed because the user-facing conversation has already been
   * deleted and orphaned checkpoint rows are harmless.
   *
   * @param threadId LangGraph thread id, equal to the advisor conversation id.
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

  // ── Cache helpers ───────────────────────────────────────────────────────────

  /**
   * Builds the Redis key for the cached conversation sidebar list.
   */
  private conversationsCacheKey(userId: string): string {
    return `${ADVISOR_CONVERSATIONS_CACHE_PREFIX}:${userId}`;
  }

  /**
   * Invalidates the cached conversation sidebar list for one user.
   */
  private bustConversationsCache(userId: string): void {
    void this.redis.del(this.conversationsCacheKey(userId)).catch(() => {});
  }

  /**
   * Invalidates both insight caches for a user.
   *
   * This is fire-and-forget: Redis failures must not break the mutation that
   * caused the invalidation, and future reads can recover from the database.
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
   * Invalidates only the unread-count cache for a user.
   *
   * Used when a read operation changes badge state but leaves the cached latest
   * insight row untouched.
   */
  private invalidateUnreadCache(userId: string): void {
    void this.redis
      .del(`${INSIGHTS_UNREAD_CACHE_PREFIX}:${userId}`)
      .catch(() => {});
  }

  /**
   * Builds the Redis key for cached advisor data-scope consent.
   */
  private scopesCacheKey(userId: string): string {
    return `${ADVISOR_SCOPES_CACHE_PREFIX}:${userId}`;
  }
}
