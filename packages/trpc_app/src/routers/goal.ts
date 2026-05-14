import { z } from 'zod';

import { Goalstatus, GoalPriority } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { createTRPCRouter, protectedProcedure, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type {
  GetGoalsRes,
  Goal,
  GoalsAggregate,
  Contribution,
} from '@fintrack/types/protos/finance/goal';

export const goalRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns all goals for the authenticated user with optional filters.
   * The unfiltered response is cached at the API gateway layer (2 min Redis TTL).
   * Filtered requests bypass the cache and always hit gRPC directly.
   *
   * Each goal includes `monthlyContributions` (all-time, DB-level groupBy) and
   * `contributedAmount` for the card's progress bar and mini chart.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.array(z.nativeEnum(Goalstatus)).optional(),
          priority: z.array(z.nativeEnum(GoalPriority)).optional(),
          amount: z.number().min(0).optional(),
          operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'ne']).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams();

      if (input?.status?.length) params.set('status', input.status.join(','));
      if (input?.priority?.length) params.set('priority', input.priority.join(','));
      if (input?.amount !== undefined) params.set('amount', String(input.amount));
      if (input?.operator) params.set('operator', input.operator);

      const response = await fetch(`${GATEWAY_URL}/api/goal?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<GetGoalsRes['goals']> = await response.json();
      return data;
    }),

  /**
   * Returns a single goal by ID including all contributions and their linked
   * transactions. Not cached — detail views are always served fresh.
   *
   * @param id - Goal ID
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist or belongs to another user
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/goal/${input.id}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Goal> = await response.json();
      return data;
    }),

  /**
   * Returns the aggregate health snapshot for the authenticated user's goals.
   * Cached at the API gateway layer for 2 minutes (Redis cache-aside).
   *
   * Includes: status counts, savings totals, activePercent, avgMonthlyContribution,
   * streakMonths, contributionHeatmap (12 months), and projectionData (15 points).
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getAggregate: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/goal/aggregate`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<GoalsAggregate> = await response.json();
    return data;
  }),

  // ---------------------------------------------------------------------------
  // Mutations — Goals
  // ---------------------------------------------------------------------------

  /**
   * Creates a new savings goal.
   * Gated by MAX_GOALS plan limit — free plan users are capped at 3 active goals.
   *
   * @throws FORBIDDEN if the user has reached their plan's goal limit
   * @throws BAD_REQUEST if targetDate is in the past or validation fails
   */
  create: protectedProcedureWithPlanLimits
    .input(
      z.object({
        feature: z.literal(Usage.MAX_GOALS),
        name: z.string().min(1).max(255),
        targetAmount: z.number().positive(),
        targetDate: z.string(),
        priority: z.nativeEnum(GoalPriority).optional(),
        description: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { feature: _feature, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/goal/`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Goal> = await response.json();
      return data;
    }),

  /**
   * Updates an existing goal's metadata (name, targetAmount, targetDate,
   * priority, description). Passing undefined for any field leaves it unchanged.
   *
   * @param id - Goal ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist or belongs to another user
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(255).optional(),
        targetAmount: z.number().positive().optional(),
        targetDate: z.string().optional(),
        priority: z.nativeEnum(GoalPriority).optional(),
        description: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/goal/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Goal> = await response.json();
      return data;
    }),

  /**
   * Transitions a goal between ACTIVE and ON_HOLD.
   * COMPLETED is system-managed (auto-set when contributions fill the target)
   * and cannot be set via this mutation.
   *
   * @param id - Goal ID
   * @param status - Target status: 'ACTIVE' | 'ON_HOLD'
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist or belongs to another user
   * @throws BAD_REQUEST if status is not ACTIVE or ON_HOLD
   * @throws PRECONDITION_FAILED if the goal is already COMPLETED
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        status: z.enum(['ACTIVE', 'ON_HOLD']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;

      const response = await fetch(`${GATEWAY_URL}/api/goal/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Goal> = await response.json();
      return data;
    }),

  /**
   * Permanently deletes a goal and all its contributions (cascade).
   *
   * @param id - Goal ID to delete
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist or belongs to another user
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/goal/${input.id}`, {
        method: 'DELETE',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),

  // ---------------------------------------------------------------------------
  // Mutations — Contributions
  // ---------------------------------------------------------------------------

  /**
   * Adds a contribution to a goal.
   * The contribution sum is validated server-side — it cannot exceed the goal's
   * targetAmount. Optionally links to an existing INCOME transaction; when linked,
   * the transaction date is used instead of the provided date field.
   *
   * @param goalId - Goal to contribute to
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist
   * @throws BAD_REQUEST if the amount would exceed the remaining goal balance
   */
  createContribution: protectedProcedure
    .input(
      z.object({
        goalId: z.string().min(1),
        amount: z.number().positive(),
        date: z.string(),
        description: z.string().min(1).max(255).optional(),
        transactionId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { goalId, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/goal/${goalId}/contribution`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Contribution> = await response.json();
      return data;
    }),

  /**
   * Updates an existing contribution's amount, date, description, or transaction link.
   * The overflow rule is re-evaluated excluding the current contribution's value.
   *
   * @param goalId - Parent goal ID
   * @param contributionId - Contribution ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the contribution does not exist
   * @throws BAD_REQUEST if the updated amount would exceed the remaining goal balance
   */
  updateContribution: protectedProcedure
    .input(
      z.object({
        goalId: z.string().min(1),
        contributionId: z.string().min(1),
        amount: z.number().positive().optional(),
        date: z.string().optional(),
        description: z.string().min(1).max(255).optional(),
        transactionId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { goalId, contributionId, ...body } = input;

      const response = await fetch(
        `${GATEWAY_URL}/api/goal/${goalId}/contribution/${contributionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(body),
          headers: gatewayHeaders(ctx.headers, ContentType.JSON),
        },
      );

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Contribution> = await response.json();
      return data;
    }),

  /**
   * Permanently deletes a contribution from a goal.
   *
   * @param goalId - Parent goal ID
   * @param contributionId - Contribution ID to delete
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the contribution does not exist
   */
  deleteContribution: protectedProcedure
    .input(
      z.object({
        goalId: z.string().min(1),
        contributionId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(
        `${GATEWAY_URL}/api/goal/${input.goalId}/contribution/${input.contributionId}`,
        {
          method: 'DELETE',
          headers: gatewayHeaders(ctx.headers),
        },
      );

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),
});
