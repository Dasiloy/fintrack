import { createTRPCRouter, protectedProcedure } from '../setup';
import { TRPCError } from '@trpc/server';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';

export const userRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Fetch the current user's data
   *
   * Also returns the base data of the user profile
   * Use in Dahboard layout prefetched, Fetch extensively in other routes
   *
   * @returns {User} user data with prefrences and subscription
   * @throws INTERNAL_SERVER_ERROR on unexpected database failure
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { email: ctx.session.user.email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          language: true,
          currency: true,
          dateFormat: true,
          timezone: true,
          setting: true,
          lastLoginAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      const data: StandardResponse<typeof user> = {
        data: user,
        message: 'Profile fetched successfully',
        statusCode: 200,
        success: true,
      };
      return data;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'an error occured',
      });
    }
  }),
});
