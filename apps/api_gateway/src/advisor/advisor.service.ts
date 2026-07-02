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
import {
  ADVISOR_WORKFLOW_IDS,
  ADVISOR_WORKFLOW_STATUSES,
  AdvisorAction,
  AdvisorWorkflowActionBatchResult,
  AdvisorAttachment,
  AdvisorAttachmentCleanupItem,
  AdvisorActionState,
  AdvisorWorkflowEventPayload,
  AdvisorWorkflowEventType,
  AdvisorWorkflowExecutionDomain,
  AdvisorWorkflowExecutableCandidate,
  AdvisorWorkflowId,
  AdvisorMessageMetadata,
  AdvisorPendingPayload,
  AdvisorWorkflowCandidateApproval,
  AdvisorWorkflowResponse,
  AdvisorWorkflowRun,
  AdvisorWorkflowRequest,
  AdvisorWorkflowRunHistoryFilter,
  AdvisorWorkflowRunHistoryItem,
  AdvisorWorkflowStatus,
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
      resume?: { approved: boolean; actionMessageId: string };
      attachments?: AdvisorAttachment[];
      workflowRun?: AdvisorWorkflowRun;
      workflow?: AdvisorWorkflowRequest;
      workflowApproval?: AdvisorWorkflowCandidateApproval;
    },
  ): Promise<{ streamToken: string }> {
    const attachments = this.validateAdvisorAttachments(
      userId,
      body.attachments ?? [],
    );
    if (
      !body.resume &&
      !body.workflow &&
      !body.workflowApproval &&
      !body.message?.trim() &&
      attachments.length === 0
    ) {
      throw new BadRequestException('Message or resume payload is required');
    }
    if (
      !body.workflowApproval &&
      this.hasReservedWorkflowMarker(body.message)
    ) {
      throw new BadRequestException(
        'Reserved workflow markers cannot be sent as chat text',
      );
    }
    if (body.resume) {
      await this.assertPendingActionMessage(
        userId,
        body.conversationId,
        body.resume.actionMessageId,
      );
    }
    if (body.workflowApproval) {
      await this.assertWorkflowCandidateApproval(
        userId,
        body.conversationId,
        body.workflowApproval,
      );
    }

    const workflowPayload = body.workflow
      ? this.buildWorkflowPayload(body.workflow)
      : null;
    const streamToken = randomUUID();
    await this.redis.setex(
      this.pendingKey(streamToken),
      ADVISOR_PENDING_TTL,
      JSON.stringify({
        userId,
        conversationId: body.conversationId,
        ...(body.resume
          ? { resume: body.resume }
          : body.workflowApproval
            ? { workflowApproval: body.workflowApproval }
            : {
                message: workflowPayload?.message ?? body.message?.trim() ?? '',
                ...(attachments.length > 0
                  ? { attachments: attachments.map(this.toStoredAttachment) }
                  : {}),
                ...(workflowPayload?.workflowRun || body.workflowRun
                  ? {
                      workflowRun:
                        workflowPayload?.workflowRun ?? body.workflowRun,
                    }
                  : {}),
                ...(body.workflow ? { workflow: body.workflow } : {}),
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
    let workflowRun: AdvisorWorkflowRun | undefined;
    let workflowRunMessageId: string | undefined;
    let workflowApproval: AdvisorWorkflowCandidateApproval | null = null;
    let resumeApproved: boolean | null = null;
    let resumeActionMessageId: string | null = null;
    let streamFailed = false;
    let actionExecutionFailed = false;
    let workflowActionBatchResult: AdvisorWorkflowActionBatchResult | null =
      null;
    let finalStatePersisted = false;

    return from(this.consumePending(userId, streamToken)).pipe(
      switchMap((staged) => {
        conversationId = staged.conversationId;
        workflowRun =
          'resume' in staged || 'workflowApproval' in staged
            ? undefined
            : staged.workflowRun;
        workflowRunMessageId =
          'resume' in staged || 'workflowApproval' in staged
            ? undefined
            : staged.workflowRunMessageId;

        const metadata = new Metadata();
        metadata.set('x-user-id', userId);

        if ('resume' in staged) {
          resumeApproved = staged.resume.approved;
          resumeActionMessageId = staged.resume.actionMessageId;
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

        if ('workflowApproval' in staged) {
          workflowApproval = staged.workflowApproval;
          return this.aiServiceClient.sendAdvisorMessage(
            {
              conversationId: staged.conversationId,
              userId,
              message: staged.message,
              grantedScopes: staged.grantedScopes,
              attachments: [],
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
        if (chunk.type === 'action_result') {
          actionExecutionFailed =
            actionExecutionFailed || this.isFailedActionResult(chunk.data);
        }
        if (chunk.type === 'workflow_action_batch_result') {
          workflowActionBatchResult = this.parseWorkflowActionBatchResult(
            chunk.data,
          );
          actionExecutionFailed =
            actionExecutionFailed ||
            workflowActionBatchResult?.status === 'execution_failed';
        }
        if (chunk.type === 'token') assistantText += chunk.content;
        if (this.isWorkflowEventType(chunk.type)) {
          const payload = this.parseWorkflowEventPayload(chunk.data);
          if (workflowRun && payload) {
            workflowRun = this.applyWorkflowEventToRun(
              workflowRun,
              chunk.type,
              payload,
            );
          }
          void this.patchWorkflowRunStatusFromEvent(
            conversationId,
            workflowRunMessageId,
            chunk.type,
            chunk.data,
          );
        }
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
                resumeActionMessageId,
                streamFailed,
                actionExecutionFailed,
                workflowActionBatchResult,
                workflowRun,
                workflowRunMessageId,
                workflowApproval,
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
          resumeActionMessageId,
          streamFailed,
          actionExecutionFailed,
          workflowActionBatchResult,
          workflowRun,
          workflowRunMessageId,
          workflowApproval,
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
    resumeActionMessageId: string | null;
    streamFailed: boolean;
    actionExecutionFailed: boolean;
    workflowActionBatchResult?: AdvisorWorkflowActionBatchResult | null;
    workflowRun?: AdvisorWorkflowRun;
    workflowRunMessageId?: string;
    workflowApproval?: AdvisorWorkflowCandidateApproval | null;
  }): Promise<void> {
    if (!state.conversationId) return;

    if (state.workflowRun && state.workflowRunMessageId) {
      await this.updateWorkflowRunMessageMetadata(
        state.conversationId,
        state.workflowRunMessageId,
        state.workflowRun,
      );
    }

    if (state.resumeApproved !== null && state.resumeActionMessageId) {
      await this.markActionMessageState(
        state.conversationId,
        state.resumeActionMessageId,
        state.streamFailed || state.actionExecutionFailed
          ? 'failed'
          : state.resumeApproved
            ? 'approved'
            : 'rejected',
      );
    }

    if (state.workflowApproval) {
      if (state.workflowActionBatchResult?.candidateResults.length) {
        await this.markWorkflowCandidateResults(
          state.conversationId,
          state.workflowApproval.responseMessageId,
          state.workflowActionBatchResult.candidateResults,
        );
      } else {
        await this.markWorkflowCandidatesState(
          state.conversationId,
          state.workflowApproval.responseMessageId,
          state.workflowApproval.selectedCandidateIds,
          state.streamFailed || state.actionExecutionFailed
            ? 'failed'
            : 'approved',
        );
      }
    }

    const metadata =
      state.assistantMetadata ??
      (state.workflowRun && state.assistantText.trim() && !state.streamFailed
        ? {
            workflowResponse: this.buildWorkflowResponse(
              state.workflowRun,
              state.assistantText,
            ),
          }
        : null);

    if (state.assistantText.trim() || metadata) {
      await this.persistAssistantTurn(
        state.conversationId,
        state.assistantText,
        metadata,
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
   * Returns recent workflow user-card runs for the authenticated user.
   *
   * Workflow runs are stored as metadata on USER chat messages, so this endpoint
   * scans recent metadata rows, validates the workflow shape, and applies
   * workflow/status filters after parsing.
   *
   * @param userId Authenticated user id.
   * @param filter Optional workflow id/status/limit filter.
   * @returns Matching workflow runs newest first.
   */
  async getWorkflowRuns(
    userId: string,
    filter: AdvisorWorkflowRunHistoryFilter = {},
  ): Promise<AdvisorWorkflowRunHistoryItem[]> {
    const limit = Math.min(Math.max(filter.limit ?? 20, 1), 50);
    const rows = await this.prisma.advisorChatMessage.findMany({
      where: {
        role: AdvisorChatRole.USER,
        metadata: { not: Prisma.DbNull },
        conversation: { userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        conversationId: true,
        content: true,
        createdAt: true,
        metadata: true,
        conversation: { select: { title: true } },
      },
    });

    return rows
      .flatMap((row) => {
        const metadata = this.parseAdvisorMessageMetadata(row.metadata);
        if (!metadata?.workflowRun) return [];
        if (
          filter.workflowId &&
          metadata.workflowRun.workflowId !== filter.workflowId
        ) {
          return [];
        }
        if (filter.status && metadata.workflowRun.status !== filter.status) {
          return [];
        }

        return [
          {
            messageId: row.id,
            conversationId: row.conversationId,
            conversationTitle: row.conversation.title,
            content: row.content,
            createdAt: row.createdAt,
            workflowRun: metadata.workflowRun,
          },
        ];
      })
      .slice(0, limit);
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
   * Blocks user-authored text from reaching AI-service reserved workflow control
   * markers. The gateway may emit those markers only after validating a workflow
   * response card approval against persisted metadata.
   *
   * @param message Raw user message text.
   * @returns True when the text contains a reserved workflow control marker.
   */
  private hasReservedWorkflowMarker(message?: string): boolean {
    if (!message) return false;
    return message.includes('WORKFLOW_APPROVED_ACTIONS_JSON:');
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
    let workflowApprovalResponse: AdvisorWorkflowResponse | undefined;
    let workflowRunMessageId: string | undefined;

    if ('resume' in staged) {
      await this.assertConversationOwner(userId, staged.conversationId);
      await this.assertPendingActionMessage(
        userId,
        staged.conversationId,
        staged.resume.actionMessageId,
      );
      await this.markActionMessageState(
        staged.conversationId,
        staged.resume.actionMessageId,
        'processing',
      );
    } else if ('workflowApproval' in staged) {
      await this.assertConversationOwner(userId, staged.conversationId);
      workflowApprovalResponse = await this.assertWorkflowCandidateApproval(
        userId,
        staged.conversationId,
        staged.workflowApproval,
      );
      await this.markWorkflowCandidatesState(
        staged.conversationId,
        staged.workflowApproval.responseMessageId,
        staged.workflowApproval.selectedCandidateIds,
        'processing',
      );
    } else {
      // Persist the user turn + verify conversation ownership BEFORE the gRPC call,
      // so we never load another user's checkpointer thread.
      await this.assertConversationOwner(userId, staged.conversationId).catch(
        async (err) => {
          if ((err as Error).message !== 'Forbidden') throw err;
          const existing = await this.prisma.advisorConversation.findUnique({
            where: { id: staged.conversationId },
            select: { userId: true },
          });
          if (existing) throw err;
        },
      );
      await this.expirePendingActionMessages(staged.conversationId);
      workflowRunMessageId = await this.persistUserTurn(
        userId,
        staged.conversationId,
        staged.message,
        (staged.attachments ?? []).map(this.toStoredAttachment),
        staged.workflowRun,
      );
    }

    const grantedScopes = await this.resolveGrantedScopes(userId);
    if ('resume' in staged) {
      return {
        conversationId: staged.conversationId,
        resume: staged.resume,
        grantedScopes,
      };
    }

    if ('workflowApproval' in staged) {
      return {
        conversationId: staged.conversationId,
        message: this.buildWorkflowApprovalPrompt(
          workflowApprovalResponse!,
          staged.workflowApproval.selectedCandidateIds,
        ),
        workflowApproval: staged.workflowApproval,
        grantedScopes,
      };
    }

    return {
      conversationId: staged.conversationId,
      message: staged.message,
      workflowRun: staged.workflowRun,
      workflowRunMessageId,
      attachments: (
        await this.collectModelAttachments(
          userId,
          staged.conversationId,
          staged.attachments ?? [],
        )
      ).map((attachment) => this.toModelAttachment(userId, attachment)),
      grantedScopes,
    };
  }

  // ── Staged-message attachment helpers ──────────────────────────────────────

  /**
   * Validates advisor attachment ownership, type, and aggregate size before the
   * payload is staged for streaming.
   *
   * @param userId Authenticated owner expected in each attachment public id.
   * @param attachments Attachments supplied by the browser for the next turn.
   * @returns The same attachment list after validation succeeds.
   * @throws BadRequestException when an attachment is too large, unsupported, or
   * does not belong to the authenticated user.
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

  // ── Workflow prompt and card metadata builders ─────────────────────────────

  /**
   * Converts a structured workflow request into the hidden advisor prompt and
   * durable user-message metadata used to render the workflow launch card.
   *
   * The gateway owns this conversion so the frontend cannot become the source of
   * truth for workflow behavior or prompt guardrails.
   *
   * @param workflow Workflow id, run id, and options selected by the user.
   * @returns The model-facing message and persisted workflow card metadata.
   */
  private buildWorkflowPayload(workflow: AdvisorWorkflowRequest): {
    message: string;
    workflowRun: AdvisorWorkflowRun;
  } {
    return {
      message: this.buildWorkflowPrompt(workflow),
      workflowRun: {
        id: workflow.runId ?? randomUUID(),
        workflowId: workflow.workflowId,
        title: this.workflowTitle(workflow.workflowId),
        description: this.workflowDescription(workflow.workflowId),
        summaryItems: this.workflowSummaryItems(workflow),
        focusItems: this.workflowFocusItems(workflow),
        stages: this.workflowStages(workflow.workflowId),
        status: 'started',
        activeStageIndex: 0,
        statusLabel: 'Workflow queued',
        startedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Builds the authoritative model prompt for a workflow run.
   *
   * Workflow prompts include explicit guardrails that prevent normal advisor
   * HITL proposals from being emitted during workflow analysis.
   *
   * @param workflow Structured workflow request from the staged payload.
   * @returns Prompt sent to the AI service as the user message content.
   */
  private buildWorkflowPrompt(workflow: AdvisorWorkflowRequest): string {
    const options = workflow.options ?? {};
    const guardrail =
      'This is a workflow run. Do not directly propose actions or trigger approval_required. Return workflow analysis only; if changes may be useful, describe recommendations or candidates for later workflow approval.';

    if (workflow.workflowId === 'bill-subscription-auditor') {
      const sources = [
        options.includeRecurring ? 'recurring bills' : null,
        options.includeSpending ? 'recent transactions' : null,
      ];
      const checks = [
        options.focusDuplicates ? 'duplicates' : null,
        options.focusRisingCosts ? 'rising costs' : null,
        options.focusStaleBills ? 'stale bills' : null,
      ];
      return `${guardrail} Run a bill and subscription auditor. Inspect ${this.joinList(sources)} for ${this.joinList(checks)}, show concrete evidence, and return structured workflow output with: Snapshot, Findings, Evidence, Change candidates. Candidate rows may only describe recurring changes that map to suggest_recurring or flag_subscription; never include budget, transaction, goal, or split changes. If a candidate is executable, prefix it with machine evidence tags like [kind=suggest_recurring name="Internet" amount=18000 frequency=MONTHLY categorySlug=bills-utilities] or [kind=flag_subscription recurringId=recurring_123 operation=adjust name="Internet" currentAmount=15000 proposedAmount=18000].`;
    }

    if (workflow.workflowId === 'cash-flow-forecast') {
      const sources = [
        options.includeRecurring ? 'recurring bills' : null,
        options.includeBudgets ? 'budgets' : null,
        options.includeGoals ? 'goals' : null,
        options.includeSpending ? 'recent spending' : null,
      ];
      return `${guardrail} Run a cash flow forecast for the next ${options.horizonDays ?? 30} days using ${this.joinList(sources)}. Show expected pressure points, the biggest risk, and at most one recommendation. This is analysis-only: do not include Change candidates or executable candidate sections. Return structured workflow output with: Forecast snapshot, Pressure points, Risk window, Recommendation.`;
    }

    if (workflow.workflowId === 'budget-rebalancer') {
      const strictness = this.strictnessLabel(options.strictness ?? 50);
      return `${guardrail} Run a budget rebalancer for ${this.workflowMonthLabel(options)}. When reading budgets or spending, use month=${this.workflowToolMonth(options)} and year=${this.workflowToolYear(options)}. Use a ${strictness.toLowerCase()} change appetite${options.overspentOnly ? ' and focus only on overspent categories' : ''}. Compare spending against limits and return structured workflow output with: Budget snapshot, Categories to watch, Adjustment logic, Change candidates. Candidate rows may only describe budget changes that map to adjust_budget, create_budget, or delete_budget; never include recurring, transaction, goal, or split changes. If a candidate is executable, prefix it with machine evidence tags like [kind=adjust_budget budgetId=budget_123 categorySlug=food currentLimit=40000 proposedLimit=55000] or [kind=create_budget categorySlug=transport proposedLimit=25000].`;
    }

    const sections = [
      options.includeBudgets ? 'budgets' : null,
      options.includeRecurring ? 'bills' : null,
      options.includeGoals ? 'goals' : null,
      options.includeSplits ? 'splits' : null,
    ];
    return `${guardrail} Run my monthly money review in a ${options.reviewDepth ?? 'standard'} style. Cover ${this.joinList(sections)}, summarize wins and risks, then include at most one recommendation. This is analysis-only: do not include Change candidates or executable candidate sections. Return structured workflow output with: Monthly snapshot, Wins, Risks, Recommendation.`;
  }

  /**
   * Builds the compact key/value rows shown on the user workflow launch card.
   *
   * @param workflow Structured workflow request and options.
   * @returns Summary rows describing the selected workflow configuration.
   */
  private workflowSummaryItems(
    workflow: AdvisorWorkflowRequest,
  ): Array<{ label: string; value: string }> {
    const options = workflow.options ?? {};
    if (workflow.workflowId === 'bill-subscription-auditor') {
      return [
        {
          label: 'Inspect',
          value: this.joinList([
            options.includeRecurring ? 'recurring bills' : null,
            options.includeSpending ? 'recent transactions' : null,
          ]),
        },
        {
          label: 'Look for',
          value: this.joinList([
            options.focusDuplicates ? 'duplicates' : null,
            options.focusRisingCosts ? 'rising costs' : null,
            options.focusStaleBills ? 'stale bills' : null,
          ]),
        },
      ];
    }

    if (workflow.workflowId === 'cash-flow-forecast') {
      return [
        { label: 'Horizon', value: `${options.horizonDays ?? 30} days` },
        {
          label: 'Inputs',
          value: this.joinList([
            options.includeRecurring ? 'recurring bills' : null,
            options.includeBudgets ? 'budgets' : null,
            options.includeGoals ? 'goals' : null,
            options.includeSpending ? 'recent spending' : null,
          ]),
        },
      ];
    }

    if (workflow.workflowId === 'budget-rebalancer') {
      return [
        {
          label: 'Month',
          value: this.workflowMonthLabel(options),
        },
        {
          label: 'Appetite',
          value: this.strictnessLabel(options.strictness ?? 50),
        },
      ];
    }

    return [
      {
        label: 'Depth',
        value: this.capitalize(options.reviewDepth ?? 'standard'),
      },
      {
        label: 'Sections',
        value: this.joinList([
          options.includeBudgets ? 'budgets' : null,
          options.includeRecurring ? 'bills' : null,
          options.includeGoals ? 'goals' : null,
          options.includeSplits ? 'splits' : null,
        ]),
      },
    ];
  }

  /**
   * Builds short focus chips for the workflow launch card.
   *
   * @param workflow Structured workflow request and options.
   * @returns Human-readable focus labels for the selected workflow.
   */
  private workflowFocusItems(workflow: AdvisorWorkflowRequest): string[] {
    const options = workflow.options ?? {};
    if (workflow.workflowId === 'bill-subscription-auditor') {
      return [
        options.focusDuplicates ? 'Duplicate charges' : null,
        options.focusRisingCosts ? 'Rising costs' : null,
        options.focusStaleBills ? 'Stale bills' : null,
      ].filter(Boolean) as string[];
    }
    if (workflow.workflowId === 'cash-flow-forecast') {
      return ['Pressure points', 'Biggest risk', 'Next best action'];
    }
    if (workflow.workflowId === 'budget-rebalancer') {
      return [
        options.overspentOnly
          ? 'Overspent categories only'
          : 'All active budgets',
        `${this.strictnessLabel(options.strictness ?? 50)} changes`,
        'Selectable adjustments',
      ];
    }
    return ['Wins', 'Risks', 'Next best action'];
  }

  /**
   * Returns the progress stages rendered while a workflow is running.
   *
   * @param workflowId Workflow type selected by the user.
   * @returns Ordered stage labels for the workflow progress card.
   */
  private workflowStages(
    workflowId: AdvisorWorkflowRequest['workflowId'],
  ): string[] {
    if (workflowId === 'bill-subscription-auditor') {
      return [
        'Starting audit',
        'Loading recurring bills',
        'Checking recent transactions',
        'Comparing patterns',
        'Building findings',
        'Preparing response',
      ];
    }
    if (workflowId === 'cash-flow-forecast') {
      return [
        'Starting forecast',
        'Loading commitments',
        'Reading recent spending',
        'Projecting cash flow',
        'Checking risk windows',
        'Preparing response',
      ];
    }
    if (workflowId === 'budget-rebalancer') {
      return [
        'Starting rebalance',
        'Loading budgets',
        'Comparing spend',
        'Sizing adjustments',
        'Checking recommendation limits',
        'Preparing response',
      ];
    }
    return [
      'Starting review',
      'Loading monthly signals',
      'Reviewing bills and budgets',
      'Checking goals and splits',
      'Scoring wins and risks',
      'Preparing response',
    ];
  }

  /**
   * Maps a workflow id to the title displayed on the user workflow card.
   *
   * @param workflowId Workflow type selected by the user.
   * @returns Display title for the workflow.
   */
  private workflowTitle(
    workflowId: AdvisorWorkflowRequest['workflowId'],
  ): string {
    if (workflowId === 'bill-subscription-auditor')
      return 'Bill & subscription audit';
    if (workflowId === 'cash-flow-forecast') return 'Cash flow forecast';
    if (workflowId === 'budget-rebalancer') return 'Budget rebalancer';
    return 'Monthly money review';
  }

  /**
   * Maps a workflow id to the description displayed on the user workflow card.
   *
   * @param workflowId Workflow type selected by the user.
   * @returns Short workflow description.
   */
  private workflowDescription(
    workflowId: AdvisorWorkflowRequest['workflowId'],
  ): string {
    if (workflowId === 'bill-subscription-auditor') {
      return 'Find duplicate, stale, or rising recurring costs';
    }
    if (workflowId === 'cash-flow-forecast') {
      return 'Project near-term inflows, bills, and risks';
    }
    if (workflowId === 'budget-rebalancer') {
      return 'Suggest clean budget adjustments';
    }
    return 'Summarize wins, risks, and next best action';
  }

  /**
   * Converts the budget rebalance strictness slider into a display label.
   *
   * @param value Slider value from 0 to 100.
   * @returns Gentle, Balanced, or Firm.
   */
  private strictnessLabel(value: number): string {
    if (value < 34) return 'Gentle';
    if (value > 66) return 'Firm';
    return 'Balanced';
  }

  /**
   * Formats month-scoped workflow options from structured month/year fields.
   *
   * Legacy `monthLabel` remains supported for already-staged clients, but new
   * workflow submissions should send zero-based `month` plus four-digit `year`.
   *
   * @param options Workflow options from the staged request.
   * @returns Human-readable month label for prompts and launch cards.
   */
  private workflowMonthLabel(
    options: AdvisorWorkflowRequest['options'],
  ): string {
    const { month, year } = options;
    if (
      typeof month === 'number' &&
      typeof year === 'number' &&
      Number.isInteger(month) &&
      Number.isInteger(year) &&
      month >= 0 &&
      month <= 11 &&
      year >= 2000
    ) {
      return new Date(year, month, 1).toLocaleDateString('en-NG', {
        month: 'long',
        year: 'numeric',
      });
    }

    return options.monthLabel?.trim() || 'Current month';
  }

  /**
   * Converts zero-based workflow month options to the 1-12 tool contract.
   */
  private workflowToolMonth(
    options: AdvisorWorkflowRequest['options'],
  ): number {
    const { month } = options;
    if (
      typeof month === 'number' &&
      Number.isInteger(month) &&
      month >= 0 &&
      month <= 11
    ) {
      return month + 1;
    }
    return new Date().getMonth() + 1;
  }

  /**
   * Resolves the workflow year for month-scoped advisor tools.
   */
  private workflowToolYear(options: AdvisorWorkflowRequest['options']): number {
    const { year } = options;
    if (typeof year === 'number' && Number.isInteger(year) && year >= 2000) {
      return year;
    }
    return new Date().getFullYear();
  }

  /**
   * Capitalizes a simple option label for display in workflow metadata.
   *
   * @param value Lowercase option value.
   * @returns Value with the first character uppercased.
   */
  private capitalize(value: string): string {
    return `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`;
  }

  /**
   * Formats selected workflow option labels into a natural-language list.
   *
   * @param values Candidate labels, with falsey entries ignored.
   * @returns A readable list or a generic fallback when no option is selected.
   */
  private joinList(values: Array<string | null | undefined>): string {
    const items = values.filter(Boolean) as string[];
    if (items.length === 0) return 'the available data';
    if (items.length === 1) return items[0]!;
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  /**
   * Converts a completed workflow reply into durable card metadata.
   *
   * The original assistant text remains persisted as fallback/readable content;
   * this structured layer lets the web client render a richer workflow response
   * card after refresh without asking the model to run again.
   *
   * @param workflowRun User workflow card metadata for the completed run.
   * @param content Full assistant response text accumulated from tokens.
   * @returns Presentation-ready workflow response metadata.
   */
  private buildWorkflowResponse(
    workflowRun: AdvisorWorkflowRun,
    content: string,
  ): AdvisorWorkflowResponse {
    const sections = this.extractWorkflowSections(content);
    const recommendationSection = sections.find((section) =>
      /recommend/i.test(section.title),
    );
    const candidateSection = sections.find((section) =>
      /change candidates?|candidates?|adjustments?/i.test(section.title),
    );
    const executionDomain = this.workflowExecutionDomain(
      workflowRun.workflowId,
    );
    const candidates =
      candidateSection && executionDomain !== 'analysis'
        ? this.extractWorkflowCandidates(workflowRun, candidateSection.items)
        : [];

    return {
      workflowRunId: workflowRun.id,
      workflowId: workflowRun.workflowId,
      executionDomain,
      title: workflowRun.title,
      summary: this.firstWorkflowParagraph(content),
      metrics: this.extractWorkflowMetrics(workflowRun.workflowId, content),
      sections: sections.length
        ? sections
            .filter((section) => !/recommend/i.test(section.title))
            .filter(
              (section) =>
                !/change candidates?|candidates?|adjustments?/i.test(
                  section.title,
                ),
            )
        : [{ title: 'Summary', items: [this.firstWorkflowParagraph(content)] }],
      ...(candidates.length > 0
        ? {
            candidates,
          }
        : {}),
      ...(recommendationSection?.items[0]
        ? {
            recommendation: {
              title: recommendationSection.title,
              detail: recommendationSection.items[0],
            },
          }
        : {}),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Converts candidate bullets into selectable workflow review items.
   *
   * These are presentation metadata only in this slice; execution remains a
   * later explicit backend path so workflows cannot silently mutate data.
   */
  private extractWorkflowCandidates(
    workflowRun: AdvisorWorkflowRun,
    items: string[],
  ): NonNullable<AdvisorWorkflowResponse['candidates']> {
    return this.normalizeWorkflowCandidateItems(items)
      .slice(0, 8)
      .map(({ display, evidence }, index) => {
        const { title, detail } = this.splitWorkflowCandidate(display);
        const cleanTitle = this.stripWorkflowEvidenceTags(title);
        const cleanDetail = this.stripWorkflowEvidenceTags(detail);
        return {
          id: `${workflowRun.id}-candidate-${index + 1}`,
          title: cleanTitle,
          detail: cleanDetail,
          selected: true,
          ...(this.mapWorkflowCandidateAction(workflowRun, evidence) ?? {}),
        };
      });
  }

  /**
   * Pairs standalone hidden evidence tags with the preceding visible candidate.
   */
  private normalizeWorkflowCandidateItems(
    items: string[],
  ): Array<{ display: string; evidence: string }> {
    const candidates: Array<{
      display: string;
      evidence: string;
      hasEvidence: boolean;
    }> = [];

    for (const item of items) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      if (this.isStandaloneWorkflowEvidenceTag(trimmed)) {
        const previous = candidates[candidates.length - 1];
        if (previous) {
          previous.evidence = `${trimmed} ${previous.display}`;
          previous.hasEvidence = true;
        }
        continue;
      }

      candidates.push({
        display: trimmed,
        evidence: trimmed,
        hasEvidence: this.parseWorkflowEvidenceTags(trimmed).kind !== undefined,
      });
    }

    const hasStructuredCandidates = candidates.some(
      (candidate) => candidate.hasEvidence,
    );

    return (
      hasStructuredCandidates
        ? candidates.filter((candidate) => candidate.hasEvidence)
        : candidates
    ).map(({ display, evidence }) => ({ display, evidence }));
  }

  /**
   * Deterministically attaches an executable action to a workflow candidate.
   *
   * The mapper is intentionally strict. It only returns an action when the
   * gateway has enough structured evidence to fill the exact action payload.
   * Model-written candidate text alone is not enough, so low-confidence rows
   * remain review-only instead of becoming unsafe writes.
   */
  private mapWorkflowCandidateAction(
    workflowRun: AdvisorWorkflowRun,
    rawCandidate: string,
  ): Pick<
    NonNullable<AdvisorWorkflowResponse['candidates']>[number],
    'action'
  > | null {
    const tags = this.parseWorkflowEvidenceTags(rawCandidate);
    const kind = tags.kind;
    if (!kind) return null;
    const currentLimit = this.parseTaggedNumber(tags.currentLimit);
    const proposedLimit = this.parseTaggedNumber(tags.proposedLimit);
    const amount = this.parseTaggedNumber(tags.amount);
    const currentAmount = this.parseTaggedNumber(tags.currentAmount);
    const proposedAmount = this.parseTaggedNumber(tags.proposedAmount);

    if (workflowRun.workflowId === 'budget-rebalancer') {
      if (
        kind === 'adjust_budget' &&
        tags.budgetId &&
        tags.categorySlug &&
        currentLimit !== null &&
        proposedLimit !== null
      ) {
        return {
          action: {
            kind,
            budgetId: tags.budgetId,
            categorySlug: tags.categorySlug,
            categoryName: tags.categoryName,
            currentLimit,
            proposedLimit,
            reason: this.stripWorkflowEvidenceTags(rawCandidate),
          },
        };
      }

      if (
        kind === 'create_budget' &&
        tags.categorySlug &&
        proposedLimit !== null
      ) {
        return {
          action: {
            kind,
            categorySlug: tags.categorySlug,
            categoryName: tags.categoryName,
            proposedLimit,
            reason: this.stripWorkflowEvidenceTags(rawCandidate),
          },
        };
      }

      if (
        kind === 'delete_budget' &&
        tags.budgetId &&
        tags.categorySlug &&
        currentLimit !== null
      ) {
        return {
          action: {
            kind,
            budgetId: tags.budgetId,
            categorySlug: tags.categorySlug,
            categoryName: tags.categoryName,
            currentLimit,
            reason: this.stripWorkflowEvidenceTags(rawCandidate),
          },
        };
      }
    }

    if (workflowRun.workflowId === 'bill-subscription-auditor') {
      if (
        kind === 'suggest_recurring' &&
        tags.name &&
        amount !== null &&
        tags.frequency &&
        tags.categorySlug
      ) {
        return {
          action: {
            kind,
            name: tags.name,
            amount,
            frequency: tags.frequency,
            categorySlug: tags.categorySlug,
            categoryName: tags.categoryName,
            reason: this.stripWorkflowEvidenceTags(rawCandidate),
          },
        };
      }

      if (
        kind === 'flag_subscription' &&
        tags.recurringId &&
        tags.operation &&
        tags.name &&
        currentAmount !== null
      ) {
        if (tags.operation !== 'cancel' && tags.operation !== 'adjust') {
          return null;
        }
        if (tags.operation === 'adjust' && proposedAmount === null) {
          return null;
        }
        return {
          action: {
            kind,
            recurringId: tags.recurringId,
            operation: tags.operation,
            name: tags.name,
            currentAmount,
            proposedAmount: proposedAmount ?? undefined,
            reason: this.stripWorkflowEvidenceTags(rawCandidate),
          },
        };
      }
    }

    return null;
  }

  /**
   * Reads the first bracketed workflow evidence tag into key/value pairs.
   */
  private parseWorkflowEvidenceTags(candidate: string): Record<string, string> {
    const match = candidate.match(/\[([^\]]+)\]/);
    if (!match) return {};
    const tags: Record<string, string> = {};
    const tagPattern = /(\w+)=("[^"]+"|'[^']+'|[^\s\]]+)/g;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = tagPattern.exec(match[1]!))) {
      tags[tagMatch[1]!] = tagMatch[2]!.replace(/^['"]|['"]$/g, '');
    }
    return tags;
  }

  /**
   * Detects evidence-only bullets that should never be shown to users.
   */
  private isStandaloneWorkflowEvidenceTag(candidate: string): boolean {
    return /^\[[^\]]+\]$/.test(candidate.trim());
  }

  /**
   * Removes structured evidence tags before persisting user-facing card text.
   */
  private stripWorkflowEvidenceTags(value: string): string {
    return value.replace(/\[[^\]]+\]\s*/g, '').trim();
  }

  /**
   * Parses model evidence numbers and rejects malformed values.
   */
  private parseTaggedNumber(value?: string): number | null {
    if (!value) return null;
    const parsed = Number(value.replace(/[₦,\s]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * Splits a candidate bullet into a short title and supporting detail.
   */
  private splitWorkflowCandidate(item: string): {
    title: string;
    detail: string;
  } {
    const normalized = item.replace(/\s+/g, ' ').trim().replace(/\.$/, '');
    const split = normalized.match(
      /^(.+?(?:₦\s?[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%))(?:\s+(to|because|so|for)\s+(.+))$/i,
    );
    if (!split) return { title: normalized, detail: '' };

    return {
      title: split[1]!.trim(),
      detail: `${split[2]!.toLowerCase()} ${split[3]!.trim()}.`,
    };
  }

  /**
   * Extracts markdown-ish headed sections from workflow text.
   *
   * The advisor prompt asks for named sections; this parser accepts headings and
   * bullets, but gracefully falls back to paragraph text when the model is less
   * structured.
   */
  private extractWorkflowSections(
    content: string,
  ): AdvisorWorkflowResponse['sections'] {
    const sections: AdvisorWorkflowResponse['sections'] = [];
    let current: AdvisorWorkflowResponse['sections'][number] | null = null;

    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;

      const heading = line.match(/^#{1,6}\s+(.+)$/);
      if (heading) {
        current = { title: heading[1]!.trim(), items: [] };
        sections.push(current);
        continue;
      }

      if (!current) continue;
      const item = line.replace(/^[-*]\s+/, '').trim();
      if (item) current.items.push(item);
    }

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(Boolean).slice(0, 5),
      }))
      .filter((section) => section.items.length > 0)
      .slice(0, 4);
  }

  /**
   * Returns the first plain paragraph in a workflow response for card summary.
   */
  private firstWorkflowParagraph(content: string): string {
    const paragraph =
      content
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .find((part) => part && !part.startsWith('#')) ?? content.trim();

    return paragraph.replace(/\s+/g, ' ').slice(0, 220);
  }

  /**
   * Pulls a small set of numeric highlights from workflow text.
   *
   * This keeps stage 2 generic. Later workflow-specific structured outputs can
   * replace this with exact metric fields per workflow.
   */
  private extractWorkflowMetrics(
    workflowId: AdvisorWorkflowId,
    content: string,
  ): AdvisorWorkflowResponse['metrics'] {
    const matches =
      content.match(/(?:₦\s?[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%)/g) ?? [];
    const labels = this.workflowMetricLabels(workflowId);
    return Array.from(new Set(matches))
      .slice(0, 3)
      .map((value, index) => ({
        label: labels[index] ?? `Metric ${index + 1}`,
        value,
        tone: 'neutral' as const,
      }));
  }

  /**
   * Returns user-facing metric names tailored to each workflow type.
   */
  private workflowMetricLabels(workflowId: AdvisorWorkflowId): string[] {
    const labels: Record<AdvisorWorkflowId, string[]> = {
      'bill-subscription-auditor': [
        'Monthly bills',
        'Potential savings',
        'Cost change',
      ],
      'cash-flow-forecast': [
        'Cash buffer',
        'Forecast balance',
        'Pressure amount',
      ],
      'budget-rebalancer': ['Current budget', 'Suggested budget', 'Net change'],
      'monthly-money-review': ['Money in', 'Money out', 'Net position'],
    };

    return labels[workflowId];
  }

  private toStoredAttachment(attachment: AdvisorAttachment): AdvisorAttachment {
    const { url: _url, ...stored } = attachment;
    return stored;
  }

  private async collectModelAttachments(
    userId: string,
    conversationId: string,
    currentAttachments: AdvisorAttachment[],
  ): Promise<AdvisorAttachment[]> {
    const rows = await this.prisma.advisorChatMessage.findMany({
      where: {
        conversationId,
        metadata: { not: Prisma.DbNull },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { metadata: true },
    });

    const byPublicId = new Map<string, AdvisorAttachment>();
    for (const attachment of currentAttachments.map(this.toStoredAttachment)) {
      byPublicId.set(attachment.publicId, attachment);
    }

    for (const row of rows) {
      const metadata = this.parseAdvisorMessageMetadata(row.metadata);
      for (const attachment of metadata?.attachments ?? []) {
        if (!attachment.publicId.startsWith(`fintrack/advisor/${userId}/`)) {
          continue;
        }
        if (!byPublicId.has(attachment.publicId)) {
          byPublicId.set(
            attachment.publicId,
            this.toStoredAttachment(attachment),
          );
        }
      }
    }

    return [...byPublicId.values()];
  }

  private toModelAttachment(
    userId: string,
    attachment: AdvisorAttachment,
  ): AdvisorAttachment {
    if (attachment.kind === 'csv' || attachment.kind === 'excel') {
      return this.toStoredAttachment(attachment);
    }

    const url = this.uploadService.getAdvisorFileUrlForUser(
      userId,
      attachment.publicId,
      attachment.format,
      attachment.kind,
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
   * @returns Created chat message id, when Prisma returns it.
   * @throws Error when the conversation belongs to another user.
   */
  private async persistUserTurn(
    userId: string,
    conversationId: string,
    message: string,
    attachments: AdvisorAttachment[] = [],
    workflowRun?: AdvisorWorkflowRun,
  ): Promise<string | undefined> {
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
      const created = await this.prisma.advisorChatMessage.create({
        data: {
          conversationId,
          role: AdvisorChatRole.USER,
          content: message,
          ...(attachments.length > 0 || workflowRun
            ? {
                metadata: this.toJsonMetadata({
                  ...(attachments.length > 0 ? { attachments } : {}),
                  ...(workflowRun ? { workflowRun } : {}),
                }),
              }
            : {}),
        },
      });

      // New conversation or bumped recency → the sidebar list changed.
      this.bustConversationsCache(userId);
      return typeof created?.id === 'string' ? created.id : undefined;
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
   * Parses an AI action-result chunk and reports whether the approved write
   * failed after human approval.
   *
   * @param data JSON string emitted by `ai_service`.
   * @returns True when the action result status is `execution_failed`.
   */
  private isFailedActionResult(data: string): boolean {
    try {
      const parsed = JSON.parse(data) as { status?: unknown };
      return parsed?.status === 'execution_failed';
    } catch {
      return false;
    }
  }

  /**
   * Parses the atomic workflow execution result emitted by `ai_service`.
   *
   * @param data JSON string emitted by the workflow action batch executor.
   * @returns A validated batch result, or null when the payload is malformed.
   */
  private parseWorkflowActionBatchResult(
    data: string,
  ): AdvisorWorkflowActionBatchResult | null {
    try {
      const parsed = JSON.parse(
        data,
      ) as Partial<AdvisorWorkflowActionBatchResult>;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        (parsed.status !== 'executed' &&
          parsed.status !== 'execution_failed') ||
        parsed.atomic !== true ||
        typeof parsed.message !== 'string' ||
        !Array.isArray(parsed.candidateResults)
      ) {
        return null;
      }

      const candidateResults = parsed.candidateResults.filter(
        (
          result,
        ): result is AdvisorWorkflowActionBatchResult['candidateResults'][number] =>
          !!result &&
          typeof result === 'object' &&
          typeof result.candidateId === 'string' &&
          (result.status === 'approved' || result.status === 'failed') &&
          typeof result.message === 'string',
      );

      if (candidateResults.length !== parsed.candidateResults.length) {
        return null;
      }

      return {
        status: parsed.status,
        atomic: true,
        message: parsed.message,
        candidateResults,
      };
    } catch {
      return null;
    }
  }

  /**
   * Checks whether a streamed chunk is one of the structured workflow lifecycle
   * events emitted by `ai_service`.
   *
   * @param type Stream chunk type.
   * @returns True when the chunk can update workflow run status.
   */
  private isWorkflowEventType(type: string): type is AdvisorWorkflowEventType {
    return [
      'workflow_started',
      'workflow_progress',
      'workflow_response_started',
      'workflow_completed',
      'workflow_failed',
    ].includes(type);
  }

  /**
   * Persists a workflow lifecycle chunk onto the durable workflow user card.
   *
   * This is intentionally best-effort: a failed progress update should not break
   * the active SSE stream, while final assistant persistence remains separate.
   *
   * @param conversationId Conversation that owns the workflow user card.
   * @param messageId User message id containing `metadata.workflowRun`.
   * @param type Workflow stream event type.
   * @param data JSON payload emitted with the workflow event.
   */
  private async patchWorkflowRunStatusFromEvent(
    conversationId: string,
    messageId: string | undefined,
    type: AdvisorWorkflowEventType,
    data: string,
  ): Promise<void> {
    if (!conversationId || !messageId) return;

    const payload = this.parseWorkflowEventPayload(data);
    if (!payload) return;

    try {
      await this.updateWorkflowRunMessageMetadata(
        conversationId,
        messageId,
        this.applyWorkflowEventToRun(
          await this.getWorkflowRunFromMessage(
            conversationId,
            messageId,
            payload,
          ),
          type,
          payload,
        ),
      );
    } catch (err) {
      this.logger.warn(
        `[ADV-GW] workflow status patch skipped convo=${conversationId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Reads the current workflow run from a workflow user message.
   *
   * @param conversationId Conversation that owns the message.
   * @param messageId User message id containing the workflow run.
   * @param payload Optional lifecycle payload used to guard run id mismatch.
   * @returns Current workflow run metadata.
   * @throws Error when the workflow run cannot be found or does not match.
   */
  private async getWorkflowRunFromMessage(
    conversationId: string,
    messageId: string,
    payload?: AdvisorWorkflowEventPayload,
  ): Promise<AdvisorWorkflowRun> {
    const message = await this.prisma.advisorChatMessage.findFirst({
      where: {
        id: messageId,
        conversationId,
        role: AdvisorChatRole.USER,
        metadata: { not: Prisma.DbNull },
      },
      select: { metadata: true },
    });
    const metadata = this.parseAdvisorMessageMetadata(message?.metadata);
    if (!metadata?.workflowRun) {
      throw new Error('Workflow run metadata not found');
    }
    if (
      payload?.workflowRunId &&
      payload.workflowRunId !== metadata.workflowRun.id
    ) {
      throw new Error('Workflow run id mismatch');
    }
    return metadata.workflowRun;
  }

  /**
   * Writes workflow run metadata back to the durable user workflow card.
   *
   * Existing metadata keys are preserved so future workflow user cards can carry
   * attachments or other UI metadata without being clobbered by progress updates.
   *
   * @param conversationId Conversation that owns the message.
   * @param messageId User message id containing the workflow run.
   * @param workflowRun Updated workflow run metadata.
   */
  private async updateWorkflowRunMessageMetadata(
    conversationId: string,
    messageId: string,
    workflowRun: AdvisorWorkflowRun,
  ): Promise<void> {
    const message = await this.prisma.advisorChatMessage.findFirst({
      where: {
        id: messageId,
        conversationId,
        role: AdvisorChatRole.USER,
        metadata: { not: Prisma.DbNull },
      },
      select: { id: true, metadata: true },
    });
    const metadata = this.parseAdvisorMessageMetadata(message?.metadata);
    if (!message || !metadata?.workflowRun) return;

    await this.prisma.advisorChatMessage.update({
      where: { id: message.id },
      data: {
        metadata: this.toJsonMetadata({
          ...metadata,
          workflowRun,
        }),
      },
    });
  }

  /**
   * Parses workflow lifecycle JSON with a narrow allow-list of fields.
   *
   * @param data Streamed event JSON payload.
   * @returns Validated workflow event payload, or null for malformed data.
   */
  private parseWorkflowEventPayload(
    data: string,
  ): AdvisorWorkflowEventPayload | null {
    try {
      const parsed = JSON.parse(data) as unknown;
      if (!this.isRecord(parsed)) return null;

      return {
        ...(typeof parsed.workflowRunId === 'string'
          ? { workflowRunId: parsed.workflowRunId }
          : {}),
        ...(this.isAdvisorWorkflowStatus(parsed.status)
          ? { status: parsed.status }
          : {}),
        ...(typeof parsed.stageIndex === 'number' &&
        Number.isInteger(parsed.stageIndex)
          ? { stageIndex: parsed.stageIndex }
          : {}),
        ...(typeof parsed.stageLabel === 'string'
          ? { stageLabel: parsed.stageLabel }
          : {}),
        ...(typeof parsed.message === 'string'
          ? { message: parsed.message }
          : {}),
      };
    } catch {
      return null;
    }
  }

  /**
   * Applies a validated lifecycle event to a persisted workflow run.
   *
   * @param workflowRun Current workflow run metadata.
   * @param type Workflow stream event type.
   * @param payload Validated workflow event payload.
   * @returns Updated workflow run metadata.
   */
  private applyWorkflowEventToRun(
    workflowRun: AdvisorWorkflowRun,
    type: AdvisorWorkflowEventType,
    payload: AdvisorWorkflowEventPayload,
  ): AdvisorWorkflowRun {
    const status =
      payload.status ??
      (type === 'workflow_completed'
        ? 'completed'
        : type === 'workflow_failed'
          ? 'failed'
          : workflowRun.status);

    return {
      ...workflowRun,
      status,
      activeStageIndex:
        typeof payload.stageIndex === 'number'
          ? payload.stageIndex
          : workflowRun.activeStageIndex,
      statusLabel:
        payload.stageLabel ?? payload.message ?? workflowRun.statusLabel,
      ...(['workflow_completed', 'workflow_failed'].includes(type)
        ? { completedAt: new Date().toISOString() }
        : {}),
    };
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
    const sanitized: AdvisorMessageMetadata = {};
    const hasValidState =
      !metadata.actionState ||
      [
        'pending',
        'processing',
        'approved',
        'rejected',
        'failed',
        'expired',
      ].includes(metadata.actionState);
    const hasAction =
      !!metadata.proposedAction &&
      hasValidState &&
      this.isAdvisorAction(metadata.proposedAction);
    const hasAttachments =
      Array.isArray(metadata.attachments) && metadata.attachments.length > 0;
    const hasWorkflowRun = this.isAdvisorWorkflowRun(metadata.workflowRun);
    const hasWorkflowResponse = this.isAdvisorWorkflowResponse(
      metadata.workflowResponse,
    );

    if (hasAction) {
      sanitized.proposedAction = metadata.proposedAction;
      if (metadata.actionState) sanitized.actionState = metadata.actionState;
    }
    if (hasAttachments) sanitized.attachments = metadata.attachments;
    if (hasWorkflowRun) sanitized.workflowRun = metadata.workflowRun;
    if (hasWorkflowResponse)
      sanitized.workflowResponse = metadata.workflowResponse;

    return Object.keys(sanitized).length > 0 ? sanitized : null;
  }

  /**
   * Checks whether a raw value is a plain JSON object.
   *
   * @param value Raw value.
   * @returns True for non-null, non-array objects.
   */
  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Validates an advisor action enough for safe UI restoration.
   *
   * Full execution validation remains in `ai_service`; the gateway only needs
   * to reject malformed metadata before returning it to the browser.
   *
   * @param value Raw action metadata.
   * @returns True when the action has a known kind.
   */
  private isAdvisorAction(value: unknown): value is AdvisorAction {
    if (!this.isRecord(value)) return false;
    return [
      'create_transaction',
      'update_transaction',
      'delete_transaction',
      'adjust_budget',
      'create_budget',
      'delete_budget',
      'create_goal',
      'update_goal',
      'delete_goal',
      'adjust_goal_contribution',
      'goal_contributions_batch',
      'suggest_recurring',
      'create_split',
      'update_split',
      'delete_split',
      'split_participants_batch',
      'split_settlements_batch',
      'flag_subscription',
    ].includes(String(value.kind));
  }

  /**
   * Validates that a raw value is one of the shared workflow ids.
   *
   * @param value Raw value.
   * @returns True when the value is a supported workflow id.
   */
  private isAdvisorWorkflowId(value: unknown): value is AdvisorWorkflowId {
    return (
      typeof value === 'string' &&
      (ADVISOR_WORKFLOW_IDS as readonly string[]).includes(value)
    );
  }

  /**
   * Validates that a raw value is one of the shared workflow statuses.
   *
   * @param value Raw value.
   * @returns True when the value is a supported workflow status.
   */
  private isAdvisorWorkflowStatus(
    value: unknown,
  ): value is AdvisorWorkflowStatus {
    return (
      typeof value === 'string' &&
      (ADVISOR_WORKFLOW_STATUSES as readonly string[]).includes(value)
    );
  }

  /**
   * Validates persisted workflow run metadata before rendering user cards.
   *
   * @param value Raw workflow run metadata.
   * @returns True when the workflow run has the full card shape.
   */
  private isAdvisorWorkflowRun(value: unknown): value is AdvisorWorkflowRun {
    if (!this.isRecord(value)) return false;
    return (
      typeof value.id === 'string' &&
      this.isAdvisorWorkflowId(value.workflowId) &&
      typeof value.title === 'string' &&
      typeof value.description === 'string' &&
      Array.isArray(value.summaryItems) &&
      value.summaryItems.every(
        (item) =>
          this.isRecord(item) &&
          typeof item.label === 'string' &&
          typeof item.value === 'string',
      ) &&
      Array.isArray(value.focusItems) &&
      value.focusItems.every((item) => typeof item === 'string') &&
      Array.isArray(value.stages) &&
      value.stages.every((stage) => typeof stage === 'string') &&
      this.isAdvisorWorkflowStatus(value.status) &&
      typeof value.activeStageIndex === 'number' &&
      Number.isInteger(value.activeStageIndex) &&
      typeof value.statusLabel === 'string' &&
      (!('startedAt' in value) || typeof value.startedAt === 'string') &&
      (!('completedAt' in value) || typeof value.completedAt === 'string')
    );
  }

  /**
   * Validates model-produced workflow response metadata before rendering cards.
   *
   * @param value Raw workflow response metadata.
   * @returns True when the response has the complete structured card shape.
   */
  private isAdvisorWorkflowResponse(
    value: unknown,
  ): value is AdvisorWorkflowResponse {
    if (!this.isRecord(value)) return false;
    return (
      typeof value.workflowRunId === 'string' &&
      this.isAdvisorWorkflowId(value.workflowId) &&
      (!('executionDomain' in value) ||
        ['budget', 'recurring', 'analysis'].includes(
          String(value.executionDomain),
        )) &&
      typeof value.title === 'string' &&
      typeof value.summary === 'string' &&
      Array.isArray(value.metrics) &&
      value.metrics.every((metric) => this.isWorkflowResponseMetric(metric)) &&
      Array.isArray(value.sections) &&
      value.sections.every((section) =>
        this.isWorkflowResponseSection(section),
      ) &&
      (!('candidates' in value) ||
        (Array.isArray(value.candidates) &&
          value.candidates.every((candidate) =>
            this.isWorkflowChangeCandidate(candidate),
          ))) &&
      (!('recommendation' in value) ||
        (this.isRecord(value.recommendation) &&
          typeof value.recommendation.title === 'string' &&
          typeof value.recommendation.detail === 'string')) &&
      typeof value.generatedAt === 'string'
    );
  }

  /**
   * Validates one workflow response metric row.
   *
   * @param value Raw metric.
   * @returns True when the metric is renderable.
   */
  private isWorkflowResponseMetric(value: unknown): boolean {
    if (!this.isRecord(value)) return false;
    return (
      typeof value.label === 'string' &&
      typeof value.value === 'string' &&
      (!('tone' in value) ||
        ['neutral', 'positive', 'warning', 'danger'].includes(
          String(value.tone),
        ))
    );
  }

  /**
   * Validates one workflow response section.
   *
   * @param value Raw section.
   * @returns True when the section is renderable.
   */
  private isWorkflowResponseSection(value: unknown): boolean {
    if (!this.isRecord(value)) return false;
    return (
      typeof value.title === 'string' &&
      Array.isArray(value.items) &&
      value.items.every((item) => typeof item === 'string')
    );
  }

  /**
   * Validates one workflow change candidate row.
   *
   * @param value Raw candidate.
   * @returns True when the candidate has a stable UI/action shape.
   */
  private isWorkflowChangeCandidate(value: unknown): boolean {
    if (!this.isRecord(value)) return false;
    return (
      typeof value.id === 'string' &&
      typeof value.title === 'string' &&
      typeof value.detail === 'string' &&
      typeof value.selected === 'boolean' &&
      (!('state' in value) ||
        ['pending', 'processing', 'approved', 'failed'].includes(
          String(value.state),
        )) &&
      (!('action' in value) || this.isAdvisorAction(value.action))
    );
  }

  /**
   * Ensures the clicked approval card still belongs to this conversation and is
   * pending. Terminal cards are single-use and cannot be resumed again.
   *
   * @param userId Authenticated user id.
   * @param conversationId Conversation that owns the card.
   * @param actionMessageId Assistant message id containing the approval card.
   * @throws BadRequestException when the card is stale, terminal, or invalid.
   */
  private async assertPendingActionMessage(
    userId: string,
    conversationId: string,
    actionMessageId: string,
  ): Promise<void> {
    await this.assertConversationOwner(userId, conversationId);

    const message = await this.prisma.advisorChatMessage.findFirst({
      where: {
        id: actionMessageId,
        conversationId,
        role: AdvisorChatRole.ASSISTANT,
      },
      select: { id: true, metadata: true },
    });

    const metadata = this.parseAdvisorMessageMetadata(message?.metadata);
    if (!metadata?.proposedAction) {
      throw new BadRequestException('Action proposal not found.');
    }

    if (metadata.actionState !== 'pending') {
      throw new BadRequestException(
        'This action proposal is no longer pending.',
      );
    }
  }

  /**
   * Validates that a workflow candidate approval targets selectable candidates
   * on a workflow response card owned by the current user.
   */
  private async assertWorkflowCandidateApproval(
    userId: string,
    conversationId: string,
    approval: AdvisorWorkflowCandidateApproval,
  ): Promise<AdvisorWorkflowResponse> {
    await this.assertConversationOwner(userId, conversationId);

    if (approval.selectedCandidateIds.length === 0) {
      throw new BadRequestException('Select at least one workflow candidate.');
    }

    const message = await this.prisma.advisorChatMessage.findFirst({
      where: {
        id: approval.responseMessageId,
        conversationId,
        role: AdvisorChatRole.ASSISTANT,
      },
      select: { id: true, metadata: true },
    });

    const metadata = this.parseAdvisorMessageMetadata(message?.metadata);
    const workflowResponse = metadata?.workflowResponse;
    if (!workflowResponse?.candidates?.length) {
      throw new BadRequestException('Workflow candidates not found.');
    }

    const byId = new Map(
      workflowResponse.candidates.map((candidate) => [candidate.id, candidate]),
    );
    for (const candidateId of approval.selectedCandidateIds) {
      const candidate = byId.get(candidateId);
      if (!candidate) {
        throw new BadRequestException('Workflow candidate not found.');
      }
      if (candidate.state && candidate.state !== 'pending') {
        throw new BadRequestException(
          'This workflow candidate is no longer pending.',
        );
      }
    }
    this.assertWorkflowCandidateActionsMatchDomain(
      workflowResponse,
      approval.selectedCandidateIds,
    );

    return workflowResponse;
  }

  /**
   * Ensures executable workflow candidates stay within the workflow's domain.
   *
   * Analysis-only workflows should never execute writes, and executable
   * workflows must only carry same-domain actions so the AI service can treat
   * selected candidates as one atomic batch.
   */
  private assertWorkflowCandidateActionsMatchDomain(
    workflowResponse: AdvisorWorkflowResponse,
    selectedCandidateIds: string[],
  ): void {
    const expectedDomain = this.workflowExecutionDomain(
      workflowResponse.workflowId,
    );
    const selected = workflowResponse.candidates?.filter((candidate) =>
      selectedCandidateIds.includes(candidate.id),
    );

    for (const candidate of selected ?? []) {
      if (!candidate.action) continue;
      const actionDomain = this.workflowActionExecutionDomain(candidate.action);
      if (expectedDomain === 'analysis' || actionDomain !== expectedDomain) {
        throw new BadRequestException(
          'Workflow candidate action does not match workflow domain.',
        );
      }
    }
  }

  /**
   * Maps workflow ids to the only execution domain they are allowed to produce.
   */
  private workflowExecutionDomain(
    workflowId: AdvisorWorkflowId,
  ): AdvisorWorkflowExecutionDomain {
    if (workflowId === 'bill-subscription-auditor') return 'recurring';
    if (workflowId === 'budget-rebalancer') return 'budget';
    return 'analysis';
  }

  /**
   * Maps advisor actions to the workflow execution domain that owns the write.
   */
  private workflowActionExecutionDomain(
    action: AdvisorAction,
  ): AdvisorWorkflowExecutionDomain | null {
    if (
      ['adjust_budget', 'create_budget', 'delete_budget'].includes(action.kind)
    ) {
      return 'budget';
    }
    if (['suggest_recurring', 'flag_subscription'].includes(action.kind)) {
      return 'recurring';
    }
    return null;
  }

  /**
   * Builds the advisor follow-up message for approved workflow candidates.
   *
   * The prompt is deliberately explicit that the workflow card approval is not a
   * normal HITL proposal. Until a later executor maps candidates to concrete
   * write actions, the advisor should confirm the selection and explain the next
   * safe step rather than inventing writes.
   */
  private buildWorkflowApprovalPrompt(
    workflowResponse: AdvisorWorkflowResponse,
    selectedCandidateIds: string[],
  ): string {
    const selected = workflowResponse.candidates?.filter((candidate) =>
      selectedCandidateIds.includes(candidate.id),
    );
    const executableCandidates: AdvisorWorkflowExecutableCandidate[] = (
      selected ?? []
    ).flatMap((candidate) =>
      candidate.action
        ? [{ candidateId: candidate.id, action: candidate.action }]
        : [],
    );
    const candidateLines = (selected ?? [])
      .map((candidate, index) => {
        const detail = candidate.detail ? ` — ${candidate.detail}` : '';
        return `${index + 1}. ${candidate.title}${detail}`;
      })
      .join('\n');

    return (
      `The user approved selected workflow candidates from "${workflowResponse.title}". ` +
      'Do not emit approval_required. Do not claim financial records were changed unless a concrete executor reports success. ' +
      'Acknowledge the selected candidates and explain the next safe step.\n\n' +
      `Selected candidates:\n${candidateLines}` +
      (executableCandidates.length > 0
        ? `\n\nWORKFLOW_APPROVED_ACTIONS_JSON:${JSON.stringify(
            executableCandidates,
          )}`
        : '')
    );
  }

  /**
   * Updates the selected candidate rows on a persisted workflow response card.
   */
  private async markWorkflowCandidatesState(
    conversationId: string,
    responseMessageId: string,
    selectedCandidateIds: string[],
    state: NonNullable<
      NonNullable<AdvisorWorkflowResponse['candidates']>[number]['state']
    >,
  ): Promise<void> {
    try {
      const message = await this.prisma.advisorChatMessage.findFirst({
        where: {
          id: responseMessageId,
          conversationId,
          role: AdvisorChatRole.ASSISTANT,
        },
        select: { id: true, metadata: true },
      });

      const metadata = this.parseAdvisorMessageMetadata(message?.metadata);
      const workflowResponse = metadata?.workflowResponse;
      if (!message || !workflowResponse?.candidates?.length) return;

      const selected = new Set(selectedCandidateIds);
      await this.prisma.advisorChatMessage.update({
        where: { id: message.id },
        data: {
          metadata: this.toJsonMetadata({
            ...metadata,
            workflowResponse: {
              ...workflowResponse,
              candidates: workflowResponse.candidates.map((candidate) =>
                selected.has(candidate.id)
                  ? { ...candidate, state }
                  : candidate,
              ),
            },
          }),
        },
      });
    } catch (err) {
      this.logger.warn(
        `[ADV-GW] workflow candidate update skipped convo=${conversationId} message=${responseMessageId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Applies per-candidate workflow execution results to a persisted response card.
   */
  private async markWorkflowCandidateResults(
    conversationId: string,
    responseMessageId: string,
    candidateResults: AdvisorWorkflowActionBatchResult['candidateResults'],
  ): Promise<void> {
    try {
      const message = await this.prisma.advisorChatMessage.findFirst({
        where: {
          id: responseMessageId,
          conversationId,
          role: AdvisorChatRole.ASSISTANT,
        },
        select: { id: true, metadata: true },
      });

      const metadata = this.parseAdvisorMessageMetadata(message?.metadata);
      const workflowResponse = metadata?.workflowResponse;
      if (!message || !workflowResponse?.candidates?.length) return;

      const resultById = new Map(
        candidateResults.map((result) => [result.candidateId, result]),
      );
      await this.prisma.advisorChatMessage.update({
        where: { id: message.id },
        data: {
          metadata: this.toJsonMetadata({
            ...metadata,
            workflowResponse: {
              ...workflowResponse,
              candidates: workflowResponse.candidates.map((candidate) => {
                const result = resultById.get(candidate.id);
                if (!result) return candidate;
                return {
                  ...candidate,
                  state: result.status === 'approved' ? 'approved' : 'failed',
                };
              }),
            },
          }),
        },
      });
    } catch (err) {
      this.logger.warn(
        `[ADV-GW] workflow candidate result update skipped convo=${conversationId} message=${responseMessageId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Updates one approval-card message to a new state without falling back to
   * older cards. This prevents failed/expired cards from being reused.
   *
   * @param conversationId Conversation that owns the card.
   * @param actionMessageId Assistant message id containing the approval card.
   * @param actionState State to persist on the card metadata.
   */
  private async markActionMessageState(
    conversationId: string,
    actionMessageId: string,
    actionState: AdvisorActionState,
  ): Promise<void> {
    try {
      const message = await this.prisma.advisorChatMessage.findFirst({
        where: {
          id: actionMessageId,
          conversationId,
          role: AdvisorChatRole.ASSISTANT,
        },
        select: { id: true, metadata: true },
      });

      const metadata = this.parseAdvisorMessageMetadata(message?.metadata);
      if (!message || !metadata?.proposedAction) return;

      await this.prisma.advisorChatMessage.update({
        where: { id: message.id },
        data: {
          metadata: this.toJsonMetadata({
            ...metadata,
            actionState,
          }),
        },
      });
    } catch (err) {
      this.logger.warn(
        `[ADV-GW] action message update skipped convo=${conversationId} message=${actionMessageId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Marks any currently pending proposals in a conversation as expired when the
   * user continues chatting. A later approval must come from a fresh proposal.
   *
   * @param conversationId Conversation whose pending cards should be expired.
   */
  private async expirePendingActionMessages(
    conversationId: string,
  ): Promise<void> {
    try {
      const candidates = await this.prisma.advisorChatMessage.findMany({
        where: {
          conversationId,
          role: AdvisorChatRole.ASSISTANT,
          metadata: { not: Prisma.DbNull },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, metadata: true },
      });

      await Promise.all(
        candidates.flatMap((row) => {
          const metadata = this.parseAdvisorMessageMetadata(row.metadata);
          if (!metadata?.proposedAction || metadata.actionState !== 'pending') {
            return [];
          }

          return this.prisma.advisorChatMessage.update({
            where: { id: row.id },
            data: {
              metadata: this.toJsonMetadata({
                ...metadata,
                actionState: 'expired',
              }),
            },
          });
        }),
      );
    } catch (err) {
      this.logger.warn(
        `[ADV-GW] pending action expiry skipped convo=${conversationId}: ${(err as Error).message}`,
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
