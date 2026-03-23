import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@fintrack/database/types';
import { createTRPCRouter, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';

export const transactionRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  /**
   *  Creates a new transaction
   *
   * @returns {StandardResponse<CreateTransactionResponse>}
   * @throws NOT_ALLOWED if the user is not allowed to create a transaction => Limit Reached
   */
});
