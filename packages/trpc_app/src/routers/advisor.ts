import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type { AiInsight } from '@fintrack/database/types';

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

      const response = await fetch(
        `${GATEWAY_URL}/api/advisor/insights?${params.toString()}`,
        { headers: gatewayHeaders(ctx.headers) },
      );

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
    const response = await fetch(
      `${GATEWAY_URL}/api/advisor/insights/unread-count`,
      { headers: gatewayHeaders(ctx.headers) },
    );

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<{ count: number }> = await response.json();
    return data;
  }),

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

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

    const data: StandardResponse<{ queued: boolean; cooldownSeconds: number | null; limitReached: boolean }> =
      await response.json();
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
      const response = await fetch(
        `${GATEWAY_URL}/api/advisor/insights/${input.id}/read`,
        {
          method: 'PATCH',
          headers: gatewayHeaders(ctx.headers),
        },
      );

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
});
