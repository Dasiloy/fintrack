import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../setup';

// Mock data store (migrated from web app)
const mockPosts = new Map<
  string,
  { id: string; name: string; createdById: string; createdAt: Date }
>();

export const postRouter = createTRPCRouter({
  hello: protectedProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
    return {
      greeting: `Hello ${input.text}`,
    };
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
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

  getLatest: publicProcedure.query(async () => {
    const userPosts = Array.from(mockPosts.values())
      .filter((post) => post.createdById === '1')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userPosts[0] ?? null;
  }),

  getSecretMessage: publicProcedure.query(() => {
    return 'you can now see this secret message!';
  }),
});
