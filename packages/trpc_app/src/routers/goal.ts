import { z } from 'zod';

import { Goalstatus, GoalPriority } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { createTRPCRouter, protectedProcedure, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type { GetGoalsRes, Goal, Contribution } from '@fintrack/types/protos/finance/goal';

export const goalRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated list of goals for the authenticated user.
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

      if (input?.amount) params.set('page', String(input.amount));
      if (input?.operator) params.set('limit', String(input.operator));

      if (input?.status?.length) params.set('status', input.status.join(','));
      if (input?.priority?.length) params.set('priority', input.priority.join(','));

      const response = await fetch(`${GATEWAY_URL}/api/goal?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<GetGoalsRes['goals']> = await response.json();
      return data;
    }),

  /**
   * Returns a single goal by ID including its contributions.
   *
   * @param id - Goal ID
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist
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

  // ---------------------------------------------------------------------------
  // Mutations — Goals
  // ---------------------------------------------------------------------------

  /**
   * Creates a new savings goal.
   * Gated by MAX_GOALS plan limit.
   *
   * @throws FORBIDDEN if the user has reached their goal limit
   * @throws BAD_REQUEST on validation failure
   */
  create: protectedProcedureWithPlanLimits
    .input(
      z.object({
        feature: z.literal(Usage.MAX_GOALS),
        name: z.string().min(1).max(255),
        targetAmount: z.number().min(0),
        targetDate: z.string(),
        priority: z.nativeEnum(GoalPriority).optional(),
        description: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { feature: _feature, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/goal`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Goal> = await response.json();
      return data;
    }),

  /**
   * Updates an existing goal by ID.
   *
   * @param id - Goal ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(255).optional(),
        targetAmount: z.number().min(0).optional(),
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

      const data: StandardResponse<unknown> = await response.json();
      return data;
    }),

  /**
   * Deletes a goal by ID.
   *
   * @param id - Goal ID to delete
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist
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
   *
   * @param goalId - Goal to contribute to
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the goal does not exist
   * @throws PRECONDITION_FAILED if the amount exceeds the linked transaction amount
   */
  createContribution: protectedProcedure
    .input(
      z.object({
        goalId: z.string().min(1),
        amount: z.number().min(0),
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
   * Updates a contribution by ID.
   *
   * @param goalId - Parent goal ID
   * @param contributionId - Contribution ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the contribution does not exist
   * @throws PRECONDITION_FAILED if the amount exceeds the linked transaction amount
   */
  updateContribution: protectedProcedure
    .input(
      z.object({
        goalId: z.string().min(1),
        contributionId: z.string().min(1),
        amount: z.number().min(0).optional(),
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
   * Deletes a contribution by ID.
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
