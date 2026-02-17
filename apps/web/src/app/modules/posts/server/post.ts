import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc/trpc';

// Mock data store (in-memory, resets on server restart)
const mockPosts = new Map<
  string,
  { id: string; name: string; createdById: string; createdAt: Date }
>();

export const postRouter = createTRPCRouter({
  hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
    return {
      greeting: `Hello ${input.text}`,
    };
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const postId = `post_${Date.now()}`;
      const newPost = {
        id: postId,
        name: input.name,
        createdById: '1',
        createdAt: new Date(),
      };

      mockPosts.set(postId, newPost);

      return newPost;
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    // Get all posts for this user and return the latest
    const userPosts = Array.from(mockPosts.values())
      .filter((post) => post.createdById === '1')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userPosts[0] ?? null;
  }),

  getSecretMessage: publicProcedure.query(() => {
    return 'you can now see this secret message!';
  }),
});
