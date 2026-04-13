import { z } from 'zod';

import { SplitStatus } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { createTRPCRouter, protectedProcedure, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type {
  GetSplitAggregateRes,
  Split,
  SplitParticipant,
  SplitSettlement,
} from '@fintrack/types/protos/finance/split';

export const splitRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated list of splits for the authenticated user.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
          status: z.array(z.nativeEnum(SplitStatus)).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams();

      if (input?.page) params.set('page', String(input.page));
      if (input?.limit) params.set('limit', String(input.limit));
      if (input?.status?.length) params.set('status', input.status.join(','));

      const response = await fetch(`${GATEWAY_URL}/api/split?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Split[]> = await response.json();
      return data;
    }),

  /**
   * Returns a single split by ID with all participants and settlements.
   *
   * @param id - Split ID
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the split does not exist
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/split/${input.id}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Split> = await response.json();
      return data;
    }),

  /**
   * Returns aggregate summary stats for the user's splits.
   * (total owed, total paid, total settled)
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getAggregate: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/split/aggregate`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<GetSplitAggregateRes> = await response.json();
    return data;
  }),

  // ---------------------------------------------------------------------------
  // Mutations — Splits
  // ---------------------------------------------------------------------------

  /**
   * Creates a new split.
   * Gated by MAX_ACTIVE_SPLITS plan limit.
   *
   * @throws FORBIDDEN if the user has reached their active splits limit
   * @throws BAD_REQUEST on validation failure
   * @throws PRECONDITION_FAILED if the linked transaction is not an EXPENSE
   */
  create: protectedProcedureWithPlanLimits
    .input(
      z.object({
        feature: z.literal(Usage.MAX_ACTIVE_SPLITS),
        name: z.string().min(1).max(255),
        amount: z.number().min(0),
        transactionId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { feature: _feature, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/split`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Split> = await response.json();
      return data;
    }),

  /**
   * Updates a split by ID.
   *
   * @param id - Split ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the split does not exist
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(255).optional(),
        amount: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/split/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Split> = await response.json();
      return data;
    }),

  /**
   * Deletes a split by ID.
   *
   * @param id - Split ID to delete
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the split does not exist
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/split/${input.id}`, {
        method: 'DELETE',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),

  // ---------------------------------------------------------------------------
  // Mutations — Participants
  // ---------------------------------------------------------------------------

  /**
   * Adds a participant to a split.
   * Gated by MAX_PEOPLE_PER_SPLIT plan limit.
   *
   * @param splitId - Parent split ID
   * @throws FORBIDDEN if the participant limit per split is reached
   * @throws NOT_FOUND if the split does not exist
   */
  addParticipant: protectedProcedureWithPlanLimits
    .input(
      z.object({
        feature: z.literal(Usage.MAX_PEOPLE_PER_SPLIT),
        splitId: z.string().min(1),
        name: z.string().min(1).max(255),
        email: z.string().email().optional(),
        owedAmount: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { feature: _feature, splitId, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/split/${splitId}/participant`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<SplitParticipant> = await response.json();
      return data;
    }),

  /**
   * Updates a participant by ID.
   *
   * @param splitId - Parent split ID
   * @param participantId - Participant ID to update
   * @throws NOT_FOUND if the participant does not exist
   */
  updateParticipant: protectedProcedure
    .input(
      z.object({
        splitId: z.string().min(1),
        participantId: z.string().min(1),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
        owedAmount: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { splitId, participantId, ...body } = input;

      const response = await fetch(
        `${GATEWAY_URL}/api/split/${splitId}/participant/${participantId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(body),
          headers: gatewayHeaders(ctx.headers, ContentType.JSON),
        },
      );

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<SplitParticipant> = await response.json();
      return data;
    }),

  /**
   * Removes a participant from a split.
   *
   * @param splitId - Parent split ID
   * @param participantId - Participant ID to remove
   * @throws NOT_FOUND if the participant does not exist
   */
  deleteParticipant: protectedProcedure
    .input(
      z.object({
        splitId: z.string().min(1),
        participantId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(
        `${GATEWAY_URL}/api/split/${input.splitId}/participant/${input.participantId}`,
        {
          method: 'DELETE',
          headers: gatewayHeaders(ctx.headers),
        },
      );

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),

  // ---------------------------------------------------------------------------
  // Mutations — Settlements
  // ---------------------------------------------------------------------------

  /**
   * Records a payment (settlement) from a participant.
   *
   * @param splitId - Parent split ID
   * @param participantId - Participant making the payment
   * @throws NOT_FOUND if the participant does not exist
   * @throws PRECONDITION_FAILED if the payment exceeds the owed amount
   */
  paySettlement: protectedProcedure
    .input(
      z.object({
        splitId: z.string().min(1),
        participantId: z.string().min(1),
        paidAmount: z.number().min(0),
        paidAt: z.string(),
        transactionId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { splitId, participantId, ...body } = input;

      const response = await fetch(
        `${GATEWAY_URL}/api/split/${splitId}/participant/${participantId}/settlement`,
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: gatewayHeaders(ctx.headers, ContentType.JSON),
        },
      );

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<SplitSettlement> = await response.json();
      return data;
    }),

  /**
   * Deletes a settlement record.
   *
   * @param splitId - Parent split ID
   * @param settlementId - Settlement ID to delete
   * @throws NOT_FOUND if the settlement does not exist
   */
  deleteSettlement: protectedProcedure
    .input(
      z.object({
        splitId: z.string().min(1),
        settlementId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(
        `${GATEWAY_URL}/api/split/${input.splitId}/settlement/${input.settlementId}`,
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
