import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../setup';
import type { MonoBankAccount } from '@fintrack/database/types';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';

export const accountRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns all bank accounts linked to the authenticated user.
   * Only display-safe fields are returned — no internal Mono IDs or credentials.
   *
   * @throws UNAUTHORIZED if the session is invalid
   * @throws INTERNAL_SERVER_ERROR on unexpected gateway failure
   */
  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/account`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<MonoBankAccount[]> = await response.json();
    return data;
  }),

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Exchange the one-time Mono Connect code for a permanent accountId and
   * link the bank account to the authenticated user.
   *
   * Call immediately after the user completes the Mono Connect widget —
   * the code is short-lived and single-use.
   *
   * @param code - One-time code returned by the Mono Connect widget
   * @throws UNAUTHORIZED if the session is invalid
   * @throws INTERNAL_SERVER_ERROR on unexpected gateway failure
   */
  linkMonoAccount: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1, 'Mono code is required'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/account/link`, {
        method: 'POST',
        body: JSON.stringify({ code: input.code }),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),

  /**
   * Re-authenticate a previously linked Mono bank account whose session has
   * expired or been revoked by the bank.
   *
   * The frontend opens the Mono Connect widget in reauth mode with the
   * existing accountId, the user re-authenticates, and the resulting code
   * is sent here alongside the accountId to restore the active session.
   *
   * @param code - One-time reauth code from the Mono Connect widget
   * @param accountId - Mono accountId of the account being re-authenticated
   * @throws UNAUTHORIZED if the session is invalid or accountId mismatch
   * @throws NOT_FOUND if no linked account exists for the given accountId
   * @throws INTERNAL_SERVER_ERROR on unexpected gateway failure
   */
  relinkMonoAccount: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1, 'Mono code is required'),
        accountId: z.string().min(1, 'Account ID is required'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/account/relink`, {
        method: 'POST',
        body: JSON.stringify({ code: input.code, accountId: input.accountId }),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),
});
