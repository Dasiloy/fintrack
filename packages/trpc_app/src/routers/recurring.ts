import { z } from 'zod';

import { RecurringItemFrequency, TransactionType } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { createTRPCRouter, protectedProcedure, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type { Recurinrg } from '@fintrack/types/protos/finance/recurring';

export const recurringRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns all recurring items for the authenticated user.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams();

      if (input?.isActive !== undefined) {
        params.set('isActive', String(input.isActive));
      }
      const response = await fetch(`${GATEWAY_URL}/api/recurring?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Recurinrg[]> = await response.json();
      return data;
    }),

  /**
   * Returns a single recurring item by ID.
   *
   * @param id - Recurring item ID
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the recurring item does not exist
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/recurring/${input.id}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Recurinrg> = await response.json();
      return data;
    }),

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Creates a new recurring item.
   * Gated by MAX_RECURRING_ITEMS plan limit.
   *
   * @throws FORBIDDEN if the user has reached their recurring items limit
   * @throws BAD_REQUEST on validation failure
   */
  create: protectedProcedureWithPlanLimits
    .input(
      z.object({
        feature: z.literal(Usage.MAX_RECURRING_ITEMS),
        name: z.string().min(1).max(255),
        amount: z.number().min(0),
        type: z.nativeEnum(TransactionType),
        frequency: z.nativeEnum(RecurringItemFrequency),
        categorySlug: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().optional(),
        description: z.string().min(1).max(255).optional(),
        merchant: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { feature: _feature, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/recurring`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Recurinrg> = await response.json();
      return data;
    }),

  /**
   * Updates an existing recurring item by ID.
   *
   * @param id - Recurring item ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the recurring item does not exist
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(255).optional(),
        amount: z.number().min(0).optional(),
        type: z.nativeEnum(TransactionType).optional(),
        frequency: z.nativeEnum(RecurringItemFrequency).optional(),
        categorySlug: z.string().min(1).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().min(1).max(255).optional(),
        merchant: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/recurring/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Recurinrg> = await response.json();
      return data;
    }),

  /**
   * Toggle active state of a recurring item by ID.
   *
   * @param id - Recurring item ID to toggle
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the recurring item does not exist
   */
  toggle: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/recurring/${input.id}/toggle`, {
        method: 'PATCH',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Recurinrg> = await response.json();
      return data;
    }),

  /**
   * Deletes a recurring item by ID.
   *
   * @param id - Recurring item ID to delete
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the recurring item does not exist
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/recurring/${input.id}`, {
        method: 'DELETE',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),
});
