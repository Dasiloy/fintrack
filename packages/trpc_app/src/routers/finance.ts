import { createTRPCRouter, protectedProcedure } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import type { FinanceBoard } from '@fintrack/types/protos/finance/finance';

export const financeRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns the live current-week Financial Health board for the authenticated
   * user (composite score + the four weighted components).
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getBoard: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/finance/board`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<FinanceBoard> = await response.json();
    return data;
  }),

  /**
   * Returns the user's weekly Financial Health score history (most recent 12
   * weeks, oldest-first) for trend charting.
   *
   * @throws UNAUTHORIZED if the session is invalid
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/finance/board/history`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<FinanceBoard[]> = await response.json();
    return data;
  }),
});
