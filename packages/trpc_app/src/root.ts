import {
  subscriptionRouter,
  authrouter,
  userRouter,
  publicRouter,
  budgetRouter,
  transactionRouter,
} from './routers';
import { createTRPCRouter, createCallerFactory } from './setup';

/**
 * This is the primary router for the internal App API.
 * All shared routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authrouter,
  user: userRouter,
  public: publicRouter,
  subscription: subscriptionRouter,
  budget: budgetRouter,
  transaction: transactionRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller factory for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
