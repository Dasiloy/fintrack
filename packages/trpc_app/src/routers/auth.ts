import { z } from 'zod';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import type {
  Empty,
  InitiateTwoFactorSetupRes,
  ConfirmTwoFactorSetupRes,
} from '@fintrack/types/protos/auth/auth';

import { createTRPCRouter, protectedProcedure } from '../setup';
import { GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import { TRPCError } from '@trpc/server';

export const authrouter = createTRPCRouter({
  // Queries
  get2fa: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { twoFactorEnabled } = await ctx.db.user.findUniqueOrThrow({
        where: { email: ctx.session.user.email },
        select: {
          twoFactorEnabled: true,
        },
      });

      const codeLeft = await ctx.db.backupCodes.count({
        where: { userId: ctx.session.user.id, usedAt: null },
      });

      const data: StandardResponse<{ codeLeft: number; twoFactorEnabled: boolean }> = {
        message: 'Count fetched successfully',
        data: { codeLeft, twoFactorEnabled },
        statusCode: 200,
        success: true,
      };
      return data;
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'an error occured',
      });
    }
  }),

  // Mutations
  init2fa: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/auth/2fa/init`, {
      method: 'POST',
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<InitiateTwoFactorSetupRes> = await response.json();
    return data;
  }),
  confirm2fa: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .min(6, 'Code must be 6 characters long')
          .max(6, 'code must be 6 characters long'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/2fa/confirm`, {
        method: 'POST',
        body: JSON.stringify({ code: input.code }),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<ConfirmTwoFactorSetupRes> = await response.json();
      return data;
    }),
  disable2fa: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .min(6, 'Code must be 6 characters long')
          .max(6, 'Code must be 6 characters long'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/2fa`, {
        method: 'DELETE',
        body: JSON.stringify({ code: input.code }),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Empty> = await response.json();
      return data;
    }),
});
