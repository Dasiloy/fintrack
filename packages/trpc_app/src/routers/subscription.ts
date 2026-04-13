import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../setup';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import type {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
} from '@fintrack/types/protos/payment/payment';
import { SubscriptionPlan, SubscriptionStatus } from '@fintrack/database/types';
import { type GatedUsageResponse } from '@fintrack/database/usage.types';
import { TRPCError } from '@trpc/server';
import { Usage } from '@fintrack/types/constants/plan.constants';

export const subscriptionRouter = createTRPCRouter({
  /**
   * Lightweight check — returns whether the user is on the PRO plan.
   */
  isPro: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sub = await ctx.db.subscription.findUnique({
        where: { userId: ctx.session.user.id },
        select: { plan: true },
      });
      const isPro = sub?.plan === SubscriptionPlan.PRO;

      const response: StandardResponse<boolean> = {
        data: isPro,
        message: 'Plan data got successfully',
        statusCode: 200,
        success: true,
      };

      return response;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'an error occured',
      });
    }
  }),

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   *  Gets the gated usage for the user
   *
   * @returns {StandardResponse<GetGatedUsageResponse>}
   * @throws Errors from the server
   */
  getGatedUsage: protectedProcedure
    .output(
      z.object({
        plan: z.nativeEnum(SubscriptionPlan),
        status: z.nativeEnum(SubscriptionStatus),
        cancelAtPeriodEnd: z.boolean(),
        stripeCurrentPeriodEnd: z.date().nullable(),
        usage: z.record(
          z.nativeEnum(Usage),
          z.object({ count: z.number(), periodStart: z.date(), periodEnd: z.date() }),
        ),
        limits: z.record(z.nativeEnum(Usage), z.any()),
        resourceCounts: z.object({
          categories: z.number(),
          budgets: z.number(),
          recurringItems: z.number(),
          goals: z.number(),
          splits: z.number(),
        }),
      }),
    )
    .query(async ({ ctx }) => {
      const response = await fetch(`${GATEWAY_URL}/api/usage/gated`, {
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const body: StandardResponse<GatedUsageResponse> = await response.json();

      const raw = body.data!;
      return {
        ...raw,
        stripeCurrentPeriodEnd: raw.stripeCurrentPeriodEnd
          ? new Date(raw.stripeCurrentPeriodEnd)
          : null,
        usage: Object.fromEntries(
          (
            Object.entries(raw.usage) as [
              string,
              { count: number; periodStart: string; periodEnd: string },
            ][]
          ).map(([key, val]) => [
            key,
            {
              ...val!,
              periodStart: new Date(val!.periodStart),
              periodEnd: new Date(val!.periodEnd),
            },
          ]),
        ) as Record<Usage, { count: number; periodStart: Date; periodEnd: Date }>,
      };
    }),
  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   *  Creates Checkout session for upgrading users to pro
   *
   * @returns {StandardResponse<CreateCheckoutSessionResponse>}
   * @throws Errors from the server
   */
  createSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/payment/subscribe`, {
      method: 'POST',
      headers: gatewayHeaders(ctx.headers, ContentType.JSON),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<CreateCheckoutSessionResponse> = await response.json();
    return data;
  }),

  /**
   *  Creates Portal session for managing sessions and billing configurations
   *
   * @returns {StandardResponse<CreatePortalSessionResponse>}
   * @throws Errors from the server
   */
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
