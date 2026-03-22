import { createTRPCRouter, protectedProcedure } from '../setup';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import type {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
} from '@fintrack/types/protos/payment/payment';

export const subscriptionRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  createSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/payment/subscribe`, {
      method: 'POST',
      headers: gatewayHeaders(ctx.headers, ContentType.JSON),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<CreateCheckoutSessionResponse> = await response.json();
    return data;
  }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/payment/portal`, {
      method: 'POST',
      headers: gatewayHeaders(ctx.headers, ContentType.JSON),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<CreatePortalSessionResponse> = await response.json();
    return data;
  }),
});
