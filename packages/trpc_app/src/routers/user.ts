import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../setup';
import { Currency, DateFormat, Language } from '@fintrack/database/types';
import { type GetMeResponse } from '@fintrack/database/user.select';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { MAX_FILE_SIZE } from '@fintrack/types/constants/file.constants';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';
import { base64ToBufferingString } from '@fintrack/utils/file';

export type { GetMeResponse };

export const userRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Fetch the current user's profile from the API Gateway.
   * Response is Redis-cached in the gateway for 5 minutes.
   * Cache is invalidated on updateMe, updateSettings, and updateProfileImage.
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/user/me`, {
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<GetMeResponse> = await response.json();
    return data;
  }),

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Update the current user's profile fields.
   * Invalidates the Redis user profile cache in the gateway.
   */
  updateMe: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).nullable().default(null),
        lastName: z.string().min(1).nullable().default(null),
        avatar: z.string().url().nullable().default(null),
        language: z.nativeEnum(Language).nullable().default(null),
        currency: z.nativeEnum(Currency).nullable().default(null),
        dateFormat: z.nativeEnum(DateFormat).nullable().default(null),
        timezone: z.string().nullable().default(null),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // strip nulls — gateway only updates fields that are provided
      const body = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== null));

      const response = await fetch(`${GATEWAY_URL}/api/user/me`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<unknown> = await response.json();
      return data;
    }),

  /**
   * Update the current user's notification settings.
   * Invalidates the Redis user profile cache in the gateway.
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
        goalsAlertApp: z.boolean(),
        splitsAlertMail: z.boolean(),
        splitsAlertApp: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/user/settings`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<null> = await response.json();
      return data;
    }),

  /**
   * Upload a new profile image via the gateway upload endpoint.
   * Gateway updates avatar in DB and invalidates the user profile cache.
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
