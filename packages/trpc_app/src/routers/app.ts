import { TRPCError } from '@trpc/server';
import { DateFormat } from '@fintrack/database/types';
import { publicProcedure, createTRPCRouter } from '../setup';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';

const dateLabels: Record<DateFormat, string> = {
  DMY: 'DD/MM/YYYY',
  MDY: 'MM/DD/YYYY',
  YMD: 'YYYY/MM/DD',
};
export const publicRouter = createTRPCRouter({
  // ============================== Profile Routes ==============================
  //    QUERIES
  //=======================

  /**
   * Fetch all currencies from the database
   * @returns StandardResponse<typeof query>
   * @throws TRPCError
   * @description This query is used to fetch all currencies from the database
   * @description This query is used to fetch all currencies from the database
   */
  getCurrencies: publicProcedure.query(async ({ ctx }) => {
    try {
      const query = await ctx.db.currencies.findMany({
        orderBy: {
          label: 'asc',
        },
        select: {
          currency: true,
          label: true,
        },
      });
      const data: StandardResponse<typeof query> = {
        message: 'Currencies fetched successfully',
        data: query,
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

  /**
   * Fetch all locales from the database
   * @returns StandardResponse<typeof query>
   * @throws TRPCError
   * @description This query is used to fetch all locales from the database
   * @description This query is used to fetch all locales from the database
   * @description This query is used to fetch all locales from the database
   */
  getLocales: publicProcedure.query(async ({ ctx }) => {
    try {
      const query = await ctx.db.locale.findMany({
        orderBy: {
          label: 'asc',
        },
        select: {
          language: true,
          label: true,
        },
      });
      const data: StandardResponse<typeof query> = {
        message: 'Locales fetched successfully',
        data: query,
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

  /**
   * Fetch all timezones from the database
   * @returns StandardResponse<typeof query>
   * @throws TRPCError
   * @description This query is used to fetch all timezones from the database
   * @description This query is used to fetch all timezones from the database
   */
  getTimezones: publicProcedure.query(async ({ ctx }) => {
    try {
      const zones = await import('../json/tz.json').then((module) => module.default as any);

      const timezones: { label: string; value: string }[] = zones.map((zone: any) => ({
        label: zone.tz,
        value: zone.tz,
      }));

      const data: StandardResponse<{ label: string; value: string }[]> = {
        message: 'Timezones fetched successfully',
        data: timezones,
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

  /**
   * Fetch all date formats from the database
   * @returns StandardResponse<typeof query>
   * @throws TRPCError
   * @description This query is used to fetch all date formats from the database
   * @description This query is used to fetch all date formats from the database
   */
  getDateFormats: publicProcedure.query(async ({ ctx }) => {
    try {
      const dateFormats: { label: string; value: DateFormat }[] = Object.values(DateFormat).map(
        (date) => ({
          label: dateLabels[date],
          value: date,
        }),
      );
      const data: StandardResponse<typeof dateFormats> = {
        message: 'Date formats fetched successfully',
        data: dateFormats,
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
});
