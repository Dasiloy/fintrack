import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../setup';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import type {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
} from '@fintrack/types/protos/payment/payment';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@fintrack/database/types';
import { TRPCError } from '@trpc/server';
import { PLAN_LIMITS, Usage } from '@fintrack/types/constants/plan.constants';

export const subscriptionRouter = createTRPCRouter({
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
      try {
        const userCount = await ctx.db.user.findUniqueOrThrow({
          where: { id: ctx.session.user.id },
          select: {
            usageTrackers: {
              select: {
                feature: true,
                count: true,
                periodStart: true,
                periodEnd: true,
              },
            },
            subscription: {
              select: {
                plan: true,
                status: true,
                stripeCancelAtPeriodEnd: true,
                stripeCurrentPeriodEnd: true,
              },
            },
            _count: {
              select: {
                categories: true,
                budgets: true,
                recurringItems: true,
                goals: true,
                splits: true,
              },
            },
          },
        });

        const map = new Map<Usage, { count: number; periodEnd: Date }>(
          userCount.usageTrackers.map((item) => [
            `${item.feature}_PER_MONTH` as Usage,
            {
              count: item.count,
              periodStart: item.periodStart,
              periodEnd: item.periodEnd,
            },
          ]),
        );

        return {
          plan: userCount.subscription!.plan,
          status: userCount.subscription!.status,
          cancelAtPeriodEnd: userCount.subscription!.stripeCancelAtPeriodEnd,
          stripeCurrentPeriodEnd: userCount.subscription!.stripeCurrentPeriodEnd,
          usage: Object.fromEntries(map.entries()),
          limits: PLAN_LIMITS[userCount.subscription!.plan],
          resourceCounts: userCount._count,
        };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invalid request',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'an error occured',
        });
      }
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
