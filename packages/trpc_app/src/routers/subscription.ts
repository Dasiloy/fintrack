import { createTRPCRouter, protectedProcedure } from '../setup';
import { type Subscription } from '@fintrack/database/types';

export const subscriptionRouter = createTRPCRouter({
  getPlan: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.subscription.findFirst({
      where: {
        userId: ctx.session.user.id,
        status: 'ACTIVE',
        plan: 'PRO',
      },
    });
    return subscription as Subscription;
  }),
});
