import { z } from 'zod';

import { BudgetPeriod } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { createTRPCRouter, protectedProcedure, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type {
  Budget,
  BudgetDetail,
  GetArchivedBudgetsRes,
  GetBudgetsRes,
  GetSpendingTrendRes,
} from '@fintrack/types/protos/finance/budget';

export const budgetRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns all budgets for the authenticated user in a given month, each
   * enriched with a live `spent` total (sum of EXPENSE transactions in the
   * period). Also returns `unbudgeted` — categories that have EXPENSE
   * transactions in the period but no budget set, so the UI can surface them.
   *
   * @param month - 0-indexed calendar month (0 = January … 11 = December)
   * @param year  - Full calendar year (e.g. 2026)
   * @throws UNAUTHORIZED if the session is invalid
   */
  getAll: protectedProcedure
    .input(
      z.object({
        month: z.number().int().min(0).max(11),
        year: z.number().int().min(2000),
      }),
    )
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams({
        month: String(input.month),
        year: String(input.year),
      });
      const response = await fetch(`${GATEWAY_URL}/api/budget?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });
      if (!response.ok) await throwGatewayError(response);
      const data: StandardResponse<GetBudgetsRes> = await response.json();
      return data;
    }),

  /**
   * Returns monthly EXPENSE spending aggregated over a lookback window.
   * Each month entry carries a `total` (all-category sum) and a `byCategory`
   * breakdown used by the per-category line chart mode.
   *
   * Results are cached on the gateway (15 min TTL) because this is the most
   * expensive query on the page and the data changes infrequently mid-session.
   *
   * @param months - Lookback window: 3, 6, or 12 months (default 6)
   * @throws UNAUTHORIZED if the session is invalid
   */
  getSpendingTrend: protectedProcedure
    .input(
      z.object({
        months: z.union([z.literal(3), z.literal(6), z.literal(12)]).default(6),
      }),
    )
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams({ months: String(input.months) });
      const response = await fetch(`${GATEWAY_URL}/api/budget/trend?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });
      if (!response.ok) await throwGatewayError(response);
      const data: StandardResponse<GetSpendingTrendRes> = await response.json();
      return data;
    }),

  /**
   * Returns a single budget with its full `BudgetHistory` timeline — an
   * ordered list of every limit change since the budget was created.
   * Used by the history drawer to render a timeline of past limit values.
   *
   * Ownership is enforced on the gateway: requesting another user's budget
   * returns NOT_FOUND rather than leaking its existence.
   *
   * @param id - Budget ID
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the budget does not exist or belongs to another user
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        month: z.number().int().min(0).max(11),
        year: z.number().int().min(2000),
      }),
    )
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams({
        month: String(input.month),
        year: String(input.year),
      });
      const response = await fetch(`${GATEWAY_URL}/api/budget/${input.id}?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });
      if (!response.ok) await throwGatewayError(response);
      const data: StandardResponse<BudgetDetail> = await response.json();
      return data;
    }),

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
        alertAtFrequency: z.number().int().min(1).max(7).optional(),
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
        month: z.number().int().min(0).max(11),
        year: z.number().int().min(2000),
        description: z.string().min(1).max(255).optional(),
        alertThreshold: z.number().min(0).max(1).optional(),
        alertAtFrequency: z.number().int().min(1).max(7).optional(),
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
   * Returns all soft-deleted (archived) budgets for the user.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getArchived: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/budget/archived`, {
      headers: gatewayHeaders(ctx.headers),
    });
    if (!response.ok) await throwGatewayError(response);
    const data: StandardResponse<GetArchivedBudgetsRes> = await response.json();
    return data;
  }),

  /**
   * Restores a soft-deleted budget by ID.
   *
   * @param id - Budget ID to restore
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the archived budget does not exist
   */
  restore: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/budget/${input.id}/restore`, {
        method: 'POST',
        headers: gatewayHeaders(ctx.headers),
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
    .input(z.object({ id: z.string().min(1), hardDelete: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const params = new URLSearchParams({ hardDelete: String(input.hardDelete) });
      const response = await fetch(`${GATEWAY_URL}/api/budget/${input.id}?${params.toString()}`, {
        method: 'DELETE',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),
});
