import { z } from 'zod';

import { Usage } from '@fintrack/types/constants/plan.constants';
import { createTRPCRouter, protectedProcedure, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { Category } from '@fintrack/database/types';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';

export const categoryRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns all categories available to the user — both system defaults and
   * user-created ones.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/category`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<Category[]> = await response.json();
    return data;
  }),

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Creates a new custom category.
   * Gated by MAX_CUSTOM_CATEGORIES plan limit — system categories are not
   * counted against this limit.
   *
   * @throws FORBIDDEN if the user has reached their custom category limit
   * @throws CONFLICT if a category with the same name already exists for the user
   * @throws BAD_REQUEST on validation failure
   */
  create: protectedProcedureWithPlanLimits
    .input(
      z.object({
        feature: z.literal(Usage.MAX_CUSTOM_CATEGORIES),
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(255).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { feature: _feature, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/category`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Category> = await response.json();
      return data;
    }),

  /**
   * Updates a user-created category by ID.
   * System categories cannot be updated.
   *
   * @param id - Category ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the category does not exist
   * @throws FORBIDDEN if attempting to update a system category
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100).optional(),
        description: z.string().min(1).max(255).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/category/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<unknown> = await response.json();
      return data;
    }),

  /**
   * Deletes a user-created category by ID.
   * System categories cannot be deleted.
   *
   * @param id - Category ID to delete
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the category does not exist
   * @throws FORBIDDEN if attempting to delete a system category
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/category/${input.id}`, {
        method: 'DELETE',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),
});
