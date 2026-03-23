import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@fintrack/database/types';
import { createTRPCRouter, protectedProcedureWithPlanLimits } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';

export const budgetRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  /**
   *  Creates a new budget
   *
   * @returns {StandardResponse<CreateBudgetResponse>}
   * @throws FORBIDDEN if the user is not allowed to create a budget => Limit Reached
   * @throws BAD_REQUEST if the request is invalid
   */
  createBudget: protectedProcedureWithPlanLimits.mutation(async ({ ctx }) => {
    try {
      const { session } = ctx;

      console.log('session', session);
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  }),
});
