import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../setup';
import { Currency, DateFormat, Language, Prisma, type User } from '@fintrack/database/types';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { MAX_FILE_SIZE, IMAGE_FILE_TYPE } from '@fintrack/types/constants/file.constants';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import { base64ToBufferingString } from '@fintrack/utils/file';

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

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Update the current user data
   *
   * Also returns the base data of the user profile
   * Use in Profile Settings screen
   *
   * @returns {User} user data with prefrences and subscription
   * @throws NOT_FOUND_ERROR on cases where user is missing
   * @throws INTERNAL_SERVER_ERROR on unexpected database failure
   */

  updateMe: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1, 'first name is required').nullable().default(null),
        lastName: z.string().min(1, 'last name is required').nullable().default(null),
        avatar: z.string().url('Invalid url').nullable().default(null),
        language: z.nativeEnum(Language).nullable().default(null),
        currency: z.nativeEnum(Currency).nullable().default(null),
        dateFormat: z.nativeEnum(DateFormat).nullable().default(null),
        timezone: z.string().nullable().default(null),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let data: Partial<User> = {};
        if (input.firstName) {
          data.firstName = input.firstName;
        }
        if (input.lastName) {
          data.lastName = input.lastName;
        }
        if (input.avatar) {
          data.avatar = input.avatar;
        }
        if (input.language) {
          data.language = input.language;
        }
        if (input.currency) {
          data.currency = input.currency;
        }
        if (input.dateFormat) {
          data.dateFormat = input.dateFormat;
        }
        if (input.timezone) {
          data.timezone = input.timezone;
        }
        const newUser = await ctx.db.user.update({
          where: { email: ctx.session.user.email },
          data,
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

        return newUser;
      } catch (error: any) {
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

  /**
   * Update the current user notificatrion setting
   *
   * Also returns the updated notification setting
   * Use in  ccount Setting screens
   *
   * @returns {NotificationSetting} user notification setting
   * @throws NOT_FOUND_ERROR on cases where setting is missing
   * @throws INTERNAL_SERVER_ERROR on unexpected database failure
   */

  updateSettings: protectedProcedure
    .input(
      z.object({
        budgetAlertMail: z.boolean(),
        budgetAlertApp: z.boolean(),
        billReminderMail: z.boolean(),
        billReminderApp: z.boolean(),
        weeklyReportMail: z.boolean(),
        weeklyReportApp: z.boolean(),
        aiInsightsMail: z.boolean(),
        aiInsightsApp: z.boolean(),
        goalsAlertMail: z.boolean(),
        gaolsAlertApp: z.boolean(),
        splitsAlertMail: z.boolean(),
        splitsAlertApp: z.boolean(),
        newsLetterAlert: z.boolean(),
        communityAlert: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const notification = await ctx.db.notificationSetting.update({
          where: { userId: ctx.session.user.id },
          data: input,
        });

        return notification;
      } catch (error: any) {
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

  /**
   * Update the current user profile image
   *
   * @param {File} image - The image to update the profile image with
   * @returns {string} the updated profile image
   * @throws BAD_REQUEST_ERROR on cases where image is missing
   * @throws INTERNAL_SERVER_ERROR on unexpected database failure
   */
  updateProfileImage: protectedProcedure
    .input(
      z.object({
        base64: z.string().min(1, 'File is required'),
        mimeType: z.string().min(1, 'Mime type is required'),
        fileName: z.string().min(1, 'File name is required'),
        size: z.number().max(MAX_FILE_SIZE, 'File must be less than 5MB'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const bufferableString = base64ToBufferingString(input.base64);
        const buffer = Buffer.from(bufferableString, 'base64');
        const blob = new Blob([buffer], { type: input.mimeType });

        const formData = new FormData();
        formData.append('file', blob, input.fileName);
        const response = await fetch(`${GATEWAY_URL}/api/upload/profile-image`, {
          method: 'POST',
          body: formData,
          headers: gatewayHeaders(ctx.headers),
        });
        if (!response.ok) await throwGatewayError(response);
        const data: StandardResponse<null> = await response.json();
        return data;
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'an error occured',
        });
      }
    }),
});
