import { z } from 'zod';

import { BudgetPeriod } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { createTRPCRouter, protectedProcedure, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type { Budget } from '@fintrack/types/protos/finance/budget';

export const budgetRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  // we will rather be getting budget categfories and some analytics number

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Creates a new budget.
   * Gated by MAX_BUDGETS plan limit.
   *
   * @throws FORBIDDEN if the user has reached their budget limit
   * @throws BAD_REQUEST on validation failure
   */
  create: protectedProcedureWithPlanLimits
    .input(
      z.object({
        feature: z.literal(Usage.MAX_BUDGETS),
        name: z.string().min(1).max(255),
        amount: z.number().min(0),
        categorySlug: z.string().min(1),
        period: z.nativeEnum(BudgetPeriod),
        month: z.number().int().min(0).max(11),
        year: z.number().int().min(2000),
        description: z.string().min(1).max(255).optional(),
        alertThreshold: z.number().min(0).max(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { feature: _feature, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/budget`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Budget> = await response.json();
      return data;
    }),

  /**
   * Updates an existing budget by ID.
   *
   * @param id - Budget ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the budget does not exist
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(255).optional(),
        amount: z.number().min(0).optional(),
        description: z.string().min(1).max(255).optional(),
        alertThreshold: z.number().min(0).max(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/budget/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Budget> = await response.json();
      return data;
    }),

  /**
   * Deletes a budget by ID.
   *
   * @param id - Budget ID to delete
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the budget does not exist
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/budget/${input.id}`, {
        method: 'DELETE',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),
});
