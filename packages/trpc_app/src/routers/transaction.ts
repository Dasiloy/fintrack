import { z } from 'zod';

import { TransactionType, TransactionSource } from '@fintrack/database/types';
import { createTRPCRouter, protectedProcedure } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';

const TransactionTypeSchema = z.nativeEnum(TransactionType);
const TransactionSourceSchema = z.nativeEnum(TransactionSource);

export const transactionRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Creates a new manual transaction for the authenticated user.
   *
   * @throws UNAUTHORIZED if the session is invalid
   * @throws BAD_REQUEST on validation failure
   * @throws INTERNAL_SERVER_ERROR on unexpected gateway failure
   */
  create: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(0),
        date: z.string(),
        type: TransactionTypeSchema,
        source: TransactionSourceSchema,
        sourceId: z.string().min(1),
        categorySlug: z.string().min(1),
        description: z.string().min(1).max(255).optional(),
        merchant: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/transaction`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Transaction> = await response.json();
      return data;
    }),

  /**
   * Updates an existing transaction by ID.
   *
   * @param id - Transaction ID to update
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the transaction does not exist
   * @throws INTERNAL_SERVER_ERROR on unexpected gateway failure
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        amount: z.number().min(0).optional(),
        date: z.string().optional(),
        type: TransactionTypeSchema.optional(),
        description: z.string().min(1).max(255).optional(),
        merchant: z.string().min(1).max(255).optional(),
        categorySlug: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;

      const response = await fetch(`${GATEWAY_URL}/api/transaction/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Transaction> = await response.json();
      return data;
    }),

  /**
   * Deletes a transaction by ID.
   *
   * @param id - Transaction ID to delete
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the transaction does not exist
   * @throws INTERNAL_SERVER_ERROR on unexpected gateway failure
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/transaction/${input.id}`, {
        method: 'DELETE',
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Retrieves a paginated, filtered list of transactions for the authenticated user.
   *
   * @throws UNAUTHORIZED if the session is invalid
   * @throws INTERNAL_SERVER_ERROR on unexpected gateway failure
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          cursor: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(50).default(20),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          categorySlug: z.array(z.string()).optional(),
          type: z.array(TransactionTypeSchema).optional(),
          source: z.array(TransactionSourceSchema).optional(),
          sourceId: z.string().optional(),
          bankTransactionId: z.string().optional(),
          bankAccountId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams();

      if (input?.cursor) params.set('page', String(input.cursor));
      if (input?.limit) params.set('limit', String(input.limit));
      if (input?.startDate) params.set('startDate', input.startDate);
      if (input?.endDate) params.set('endDate', input.endDate);
      if (input?.categorySlug?.length) params.set('categorySlug', input.categorySlug.join(','));
      if (input?.type?.length) params.set('type', input.type.join(','));
      if (input?.source?.length) params.set('source', input.source.join(','));
      if (input?.sourceId) params.set('sourceId', input.sourceId);
      if (input?.bankTransactionId) params.set('bankTransactionId', input.bankTransactionId);
      if (input?.bankAccountId) params.set('bankAccountId', input.bankAccountId);

      const response = await fetch(`${GATEWAY_URL}/api/transaction?${params.toString()}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Transaction[]> = await response.json();
      return data;
    }),

  /**
   * Retrieves a single transaction by ID.
   *
   * @param id - Transaction ID
   * @throws UNAUTHORIZED if the session is invalid
   * @throws NOT_FOUND if the transaction does not exist
   * @throws INTERNAL_SERVER_ERROR on unexpected gateway failure
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/transaction/${input.id}`, {
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Transaction> = await response.json();
      return data;
    }),
});
