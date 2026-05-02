import { protectedProcedure, createTRPCRouter } from '../setup';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';

type MerchantItem = { id: string; name: string; aliases: string[] };

export const merchantRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/merchants`, {
      headers: gatewayHeaders(ctx.headers),
    });
    if (!response.ok) await throwGatewayError(response);
    const data: StandardResponse<MerchantItem[]> = await response.json();
    return data;
  }),
});
