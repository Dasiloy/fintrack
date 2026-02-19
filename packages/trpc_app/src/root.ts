import { postRouter } from './routers/post';
import { createTRPCRouter, createCallerFactory } from './setup';

/**
 * This is the primary router for the internal App API.
 * All shared routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller factory for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
