import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../setup';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';

export const notificationRouter = createTRPCRouter({
  // =================================================================================
  //   QUERIES
  // =================================================================================

  /**
   * @description Get user's notifications
   *
   * @async
   * @returns {Promise<StandardResponse<Notification[]>>}
   */
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    try {
      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session?.user?.id,
          archived: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          title: true,
          body: true,
          read: true,
          data: true,
          createdAt: true,
          notificationId: true,
        },
      });
      const data: StandardResponse<typeof notifications> = {
        message: 'Notifications fetched successfully',
        data: notifications,
        statusCode: 200,
        success: true,
      };
      return data;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'an error occured',
      });
    }
  }),

  // =================================================================================
  //   MUTATIONS
  // =================================================================================

  /**
   * @description Mark a notification as read
   *
   * @async
   * @returns {Promise<StandardResponse<void>>}
   */
  markNotificationAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { notificationId } = input;
        await ctx.db.notification.update({
          where: {
            notificationId,
            userId: ctx.session?.user?.id,
          },
          data: {
            read: true,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'an error occured',
        });
      }
    }),

  /**
   * @description Archive a notification
   *
   * @async
   * @returns {Promise<StandardResponse<void>>}
   */
  archiveNotification: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { notificationId } = input;
        await ctx.db.notification.update({
          where: {
            notificationId,
            userId: ctx.session?.user?.id,
          },
          data: {
            read: true,
            archived: true,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'an error occured',
        });
      }
    }),
});
