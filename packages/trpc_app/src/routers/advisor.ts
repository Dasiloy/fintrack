import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type { AiInsight } from '@fintrack/database/types';
import type { MacroContext } from '@fintrack/types/interfaces/insights';
import type {
  AdvisorAttachmentKind,
  AdvisorAttachmentUploadResult,
  AdvisorConsent,
  ConversationSummary,
  ConversationMessagePage,
} from '@fintrack/types/interfaces/ai';

export const advisorRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns the most recent AI insight(s) for the authenticated user.
   * The default `limit=1` response is served from Redis cache at the gateway
   * layer (1 h TTL), invalidated automatically after each graph run.
   *
   * @param limit  Number of insights to return (1–20, default 1)
   * @throws UNAUTHORIZED if the session is invalid
   */
  getInsights: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams();
      if (input?.limit !== undefined) params.set('limit', String(input.limit));

      const response = await fetch(`${GATEWAY_URL}/api/advisor/insights?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<AiInsight[]> = await response.json();
      return data;
    }),

  /**
   * Returns the count of unread insights for the authenticated user.
   * Cached at the gateway layer for 5 minutes — drives the notification badge.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/advisor/insights/unread-count`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<{ count: number }> = await response.json();
    return data;
  }),

  /**
   * Returns the current macro-economic context (USD/NGN rate, food CPI, CBN rate)
   * read live from the gateway's Redis cache. This is the canonical source for
   * displaying macro data — never the snapshot saved on an insight row — so the
   * displayed value is never stale. May be null when the cache is cold.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getMacroContext: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/advisor/macro-context`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<MacroContext | null> = await response.json();
    return data;
  }),

  /**
   * Returns the user's advisor consent — whether the advisor is enabled and
   * which data scopes are granted. Drives the advisor permissions panel.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getScopes: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/advisor/scopes`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<AdvisorConsent> = await response.json();
    return data;
  }),

  /**
   * Lists the user's advisor conversations, newest first, for the chat history
   * sidebar. Each carries a title, a preview of the latest message, and a count.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/advisor/conversations`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<ConversationSummary[]> = await response.json();
    return data;
  }),

  /**
   * Returns a cursor-paginated page of a conversation's messages (oldest→newest)
   * with `nextCursor` for the previous (older) page — drives infinite scroll-up.
   * Designed for tRPC `useInfiniteQuery` (the `cursor` input is the page param).
   * Ownership-enforced at the gateway.
   *
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the conversation belongs to another user
   */
  getConversationMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams();
      if (input.cursor) params.set('cursor', input.cursor);
      if (input.limit) params.set('limit', String(input.limit));
      const qs = params.toString();

      const response = await fetch(
        `${GATEWAY_URL}/api/advisor/conversations/${encodeURIComponent(
          input.conversationId,
        )}/messages${qs ? `?${qs}` : ''}`,
        { headers: gatewayHeaders(ctx.headers) },
      );

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<ConversationMessagePage> = await response.json();
      return data;
    }),

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Uploads one picked batch of advisor attachments through the gateway upload
   * service. The web client sends base64 file data; this tRPC server
   * reconstructs one multipart request so the gateway can validate and stream
   * the whole selection to Cloudinary without one HTTP round-trip per file.
   */
  uploadFiles: protectedProcedure
    .input(
      z.object({
        files: z
          .array(
            z.object({
              file: z.string().min(1),
              filename: z.string().min(1),
              mimeType: z.string().min(1),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const formData = new FormData();
      for (const file of input.files) {
        const base64 = file.file.replace(/^data:[^;]+;base64,/, '');
        const bytes = Buffer.from(base64, 'base64');
        const blob = new Blob([bytes], { type: file.mimeType });
        formData.append('files', blob, file.filename);
      }

      const response = await fetch(`${GATEWAY_URL}/api/upload/advisor-file`, {
        method: 'POST',
        body: formData,
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<AdvisorAttachmentUploadResult> = await response.json();
      return data.data!;
    }),

  /**
   * Best-effort cleanup for an advisor attachment removed from the local draft
   * before the message is sent. The caller does not need to await this.
   */
  deleteUploadedFile: protectedProcedure
    .input(
      z.object({
        publicId: z.string().min(1),
        kind: z.enum(['image', 'pdf', 'csv', 'excel']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/upload/advisor-file`, {
        method: 'DELETE',
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
        body: JSON.stringify({
          publicId: input.publicId,
          kind: input.kind satisfies AdvisorAttachmentKind,
        }),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<{ deleted: boolean }> = await response.json();
      return data.data!;
    }),

  getAttachmentUrl: protectedProcedure
    .input(
      z.object({
        publicId: z.string().min(1),
        format: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/upload/advisor-file/url`, {
        method: 'POST',
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
        body: JSON.stringify(input),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<{ url: string }> = await response.json();
      return data.data!;
    }),

  /**
   * Renames a conversation. Ownership-enforced; busts the list cache server-side.
   *
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the conversation belongs to another user
   */
  renameConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
        title: z.string().trim().min(1).max(120),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(
        `${GATEWAY_URL}/api/advisor/conversations/${encodeURIComponent(input.conversationId)}`,
        {
          method: 'PATCH',
          headers: gatewayHeaders(ctx.headers, ContentType.JSON),
          body: JSON.stringify({ title: input.title }),
        },
      );

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<ConversationSummary> = await response.json();
      return data;
    }),

  /**
   * Permanently deletes a conversation, its messages and its checkpointer thread.
   * No archive. Ownership-enforced.
   *
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the conversation belongs to another user
   */
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(
        `${GATEWAY_URL}/api/advisor/conversations/${encodeURIComponent(input.conversationId)}`,
        { method: 'DELETE', headers: gatewayHeaders(ctx.headers) },
      );

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),

  /**
   * Enqueues a manual AI insights graph run and returns immediately.
   * The AI service processes the job in the background — fresh insights
   * appear in `getInsights` once the graph completes (typically within seconds).
   *
   * A 10-minute cooldown is enforced per user. When the cooldown is active the
   * mutation still succeeds (HTTP 202) but `queued` will be `false` and
   * `cooldownSeconds` will indicate how long to wait before retrying.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  triggerInsights: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/advisor/insights/trigger`, {
      method: 'POST',
      headers: gatewayHeaders(ctx.headers, ContentType.JSON),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<{
      queued: boolean;
      cooldownSeconds: number | null;
      limitReached: boolean;
    }> = await response.json();
    return data;
  }),

  /**
   * Marks a single insight as read (sets `readAt` to now).
   * Ownership-enforced — 404 if the insight belongs to another user.
   * Invalidates the gateway's unread-count and insight-list caches.
   *
   * @param id  AiInsight ID
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the insight does not exist or belongs to another user
   */
  markRead: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/advisor/insights/${input.id}/read`, {
        method: 'PATCH',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<AiInsight> = await response.json();
      return data;
    }),

  /**
   * Marks all unread insights as read in a single bulk update.
   * Returns the number of records that were updated.
   * Invalidates both insight-list and unread-count caches at the gateway.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/advisor/insights/read-all`, {
      method: 'PATCH',
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<{ updated: number }> = await response.json();
    return data;
  }),

  /**
   * Updates the user's advisor consent (granted scopes and/or enabled flag).
   * Returns the new consent state; the gateway busts its scopes cache and writes
   * an audit entry.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  updateScopes: protectedProcedure
    .input(
      z.object({
        grantedScopes: z
          .array(z.enum(['TRANSACTIONS', 'BUDGETS', 'GOALS', 'RECURRING', 'SPLITS', 'ANALYTICS']))
          .optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/advisor/scopes`, {
        method: 'PATCH',
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
        body: JSON.stringify(input),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<AdvisorConsent> = await response.json();
      return data;
    }),
});
