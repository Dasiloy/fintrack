/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError, z } from 'zod';

import { auth } from '@fintrack/next_auth';
import { prisma as db } from '@fintrack/database/client';
import { Usage, PLAN_LIMITS } from '@fintrack/types/constants/plan.constants';
import { UsageFeature } from '@fintrack/database/types';

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected (authenticated) procedure with plan limits
 *
 * This procedure checks if the user has reached the plan limits and throws an error if they have.
 * If the user has not reached the plan limits, it returns the next procedure.
 *
 * CRUCIAL!!! This can assert for monthly limits, all-time limits and boolean limits.
 *
 * @param ctx The context object
 * @param next The next procedure to call
 * @returns The result of the next procedure
 */
export const protectedProcedureWithPlanLimits = protectedProcedure
  .input(
    z.object({
      feature: z.nativeEnum(Usage).describe('The feature to check the limit for'),
      splitId: z.string().min(1).optional(),
    }),
  )
  .use(async ({ ctx, input, next }) => {
    try {
      const { feature } = input;

      const subscription = await ctx.db.subscription.findFirst({
        where: {
          userId: ctx.session?.user.id,
        },
        select: {
          plan: true,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'subscription not found',
        });
      }

      //? Short circut for PRO users  ===> Access granted
      if (subscription.plan === 'PRO') {
        return next({
          ctx: {
            // infers the `session` as non-nullable
            session: { ...ctx.session, user: ctx.session.user },
          },
        });
      }

      //? Get the feature limit
      const featureLimit = PLAN_LIMITS[subscription.plan][feature] as any;

      //* 1. Feature is a boolean limit ==> Privilege based access
      if (['PDF_REPORTS', 'CSV_EXPORT'].includes(feature)) {
        //? Free plan users are not allowed to access this feature
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'feature not allowed',
        });
      }

      //*2.  Feature is a resource limit ==> Resource based access
      if (feature.startsWith('MAX')) {
        let count: number = Infinity;

        //? switch between the catual feature and get the current count in db
        switch (feature) {
          case Usage.MAX_ACTIVE_SPLITS:
            count = await ctx.db.split.count({
              where: {
                userId: ctx.session?.user.id,
              },
            });
            break;
          case Usage.MAX_GOALS:
            count = await ctx.db.goal.count({
              where: {
                userId: ctx.session?.user.id,
              },
            });
            break;
          case Usage.MAX_BUDGETS:
            count = await ctx.db.budget.count({
              where: {
                userId: ctx.session?.user.id,
              },
            });
            break;

          case Usage.MAX_CUSTOM_CATEGORIES:
            count = await ctx.db.category.count({
              where: {
                userId: ctx.session?.user.id,
                isSystem: false,
              },
            });
            break;

          case Usage.MAX_RECURRING_ITEMS:
            count = await ctx.db.recurringItem.count({
              where: {
                userId: ctx.session?.user.id,
              },
            });
            break;

          case Usage.MAX_PEOPLE_PER_SPLIT:
            if (!input.splitId) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'feature usage limit reached',
              });
            }
            count = await ctx.db.splitParticipant.count({
              where: {
                id: input.splitId,
                split: {
                  userId: ctx.session.user.id,
                },
              },
            });

          default:
            count = Infinity;
            break;
        }

        //? Check if the user has reached the limit
        if (count >= featureLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'feature usage limit reached',
          });
        }

        ///!!!! CRITICAL => NO INCREMENTAL SINCE< COUNT IS BASED ON DB RECORDS
        return next({
          ctx: {
            // infers the `session` as non-nullable
            session: { ...ctx.session, user: ctx.session.user },
          },
        });
      }

      //* 3. Feature is a monthly limit ==> Usage based access
      if (feature.endsWith('_PER_MONTH')) {
        //? Get the usage feature
        const usageFeature = feature.replace('_PER_MONTH', '') as UsageFeature;

        //? Get the current usage tracker
        const currentTracker = await ctx.db.usageTracker.findFirst({
          where: {
            userId: ctx.session?.user.id,
            feature: usageFeature,
            periodStart: {
              lte: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            },
          },
          select: {
            id: true,
            count: true,
          },
        });

        if (!currentTracker) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'feature usage limit reached',
          });
        }

        //? Check if the user has reached the limit
        if (currentTracker.count >= featureLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'feature usage limit reached',
          });
        }

        //!!!! CRITICAL POINT ==> Update the usage tracker ONLY ON SUCCESSFUL CREATION OF THE RESOURCE, IN NEXT STEP
        return next({
          ctx: {
            // infers the `session` as non-nullable
            session: { ...ctx.session, user: ctx.session.user },
          },
        });
      }

      //* 4. Feature is not valid
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'invalid feature',
      });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'an error occured' });
    }
  });
