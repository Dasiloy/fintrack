import { status } from '@grpc/grpc-js';

import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import { BudgetPeriod, Category, Prisma } from '@fintrack/database/types';
import { Category as ProtoCategory } from '@fintrack/types/protos/finance/transaction';

/**
 * Utility helpers shared across all Finance microservice domain services.
 * Provides category resolution, proto formatting, and period boundary calculations.
 *
 * @class UtilsService
 */
@Injectable()
export class UtilsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * @description Get a category by id
   *
   * @public
   * @param userId - The user id
   * @param categoryId - The category id
   * @returns The category
   */
  async getCategory(userId: string, slug: string): Promise<Partial<Category>> {
    try {
      const category = await this.prismaService.category.findFirstOrThrow({
        where: {
          OR: [
            {
              slug,
              userId,
              isSystem: false,
            },
            {
              slug,
              isSystem: true,
            },
          ],
        },
        select: {
          id: true,
        },
      });
      return category;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Category not found',
        });
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured',
        details: error.message,
      });
    }
  }

  /**
   * @description Format prisma category into standard proto category
   *
   * @public
   * @param {Category} category The Category to be formatted
   * @returns {ProtoCategory} The standard proto category formatted response
   */
  formatCategory(category?: Category | null): ProtoCategory | undefined {
    return category
      ? {
          name: category.name,
          slug: category.slug,
          color: category.color ?? '',
          icon: category.icon ?? '',
        }
      : undefined;
  }

  /**
   * Returns the inclusive start boundary of the budget period that contains `date`.
   *
   * All arithmetic is done in UTC so that server timezone never bleeds into period
   * boundaries.  A budget period is always anchored to a calendar unit:
   *
   *   WEEKLY    → the Monday of the ISO week that contains `date`.
   *               ISO weeks start on Monday (day 1).  getUTCDay() returns 0 for
   *               Sunday, so a Sunday is treated as the last day of the *previous*
   *               ISO week — the offset formula `day === 0 ? -6 : 1 - day` walks
   *               back to Monday in both the Sunday-edge case and the general case.
   *
   *   MONTHLY   → the 1st of the calendar month that contains `date`.
   *               e.g. any date in May 2026 → 2026-05-01T00:00:00.000Z
   *
   *   QUARTERLY → the 1st of the quarter's opening month.
   *               Quarters are fixed calendar quarters:
   *                 Q1 Jan–Mar  (months 0–2)  → Jan 1
   *                 Q2 Apr–Jun  (months 3–5)  → Apr 1
   *                 Q3 Jul–Sep  (months 6–8)  → Jul 1
   *                 Q4 Oct–Dec  (months 9–11) → Oct 1
   *               `Math.floor(month / 3) * 3` maps any month to its quarter-start
   *               month in a single expression.
   *
   *   YEARLY    → Jan 1 of the year that contains `date`.
   *
   * @param period  - The budget's recurrence period.
   * @param date    - Any date within the target period (typically `new Date()` or a
   *                  transaction date).  The time component is ignored.
   * @returns The period's start as a UTC midnight Date.
   */
  getStartOfPeriod(period: BudgetPeriod, date: Date): Date {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth(); // 0-indexed

    switch (period) {
      case BudgetPeriod.WEEKLY: {
        // ISO week: Mon=1 … Sat=6, Sun=0.  Walk back to the nearest Monday.
        const day = date.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(date);
        monday.setUTCDate(date.getUTCDate() + diff);
        return new Date(
          Date.UTC(
            monday.getUTCFullYear(),
            monday.getUTCMonth(),
            monday.getUTCDate(),
          ),
        );
      }
      case BudgetPeriod.MONTHLY:
        return new Date(Date.UTC(y, m, 1));
      case BudgetPeriod.QUARTERLY:
        return new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1));
      case BudgetPeriod.YEARLY:
        return new Date(Date.UTC(y, 0, 1));
      default:
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Invalid budget period',
        });
    }
  }

  /**
   * Returns the inclusive end boundary of the budget period that starts at `periodStart`.
   *
   * The end is always the last millisecond of the day before the *next* period begins.
   * This is computed by advancing to the next period's start and subtracting 1 ms — the
   * subtraction trick is safe because `Date.UTC` auto-normalises out-of-range values
   * (e.g. month 12 → Jan of the following year, day 0 of a month → last day of the
   * previous month), so we never need to special-case year or month rollovers manually.
   *
   *   WEEKLY    → `periodStart` is a Monday.  The end is the following Sunday at
   *               23:59:59.999Z — computed as (Monday + 7 days) − 1 ms.
   *
   *   MONTHLY   → `periodStart` is the 1st of a month.  The end is the last
   *               millisecond of that month — computed as (1st of next month) − 1 ms.
   *               Works for every month length including February in leap years.
   *
   *   QUARTERLY → `periodStart` is the 1st of a quarter-opening month (Jan/Apr/Jul/Oct).
   *               The end is the last millisecond of the quarter's closing month —
   *               computed as (1st of the month 3 positions ahead) − 1 ms.
   *
   *   YEARLY    → `periodStart` is Jan 1.  The end is Dec 31 23:59:59.999Z of the same
   *               year — computed as (Jan 1 of the following year) − 1 ms.
   *
   * Important: pass `periodStart` — not an arbitrary date — as the argument.
   * The function does not re-derive the period start; it computes the end *from* it.
   * Always call `getStartOfPeriod` first, then pass its result here.
   *
   * @param period      - The budget's recurrence period.
   * @param periodStart - The UTC midnight start of the period, as returned by
   *                      `getStartOfPeriod`.
   * @returns The period's end as the last millisecond of its final day (UTC).
   */
  getEndOfPeriod(period: BudgetPeriod, periodStart: Date): Date {
    const y = periodStart.getUTCFullYear();
    const m = periodStart.getUTCMonth(); // 0-indexed
    const d = periodStart.getUTCDate();

    switch (period) {
      case BudgetPeriod.WEEKLY:
        // Next Monday = periodStart + 7 days; subtract 1 ms → Sunday 23:59:59.999Z
        return new Date(Date.UTC(y, m, d + 7) - 1);
      case BudgetPeriod.MONTHLY:
        // 1st of next month − 1 ms → last ms of current month
        return new Date(Date.UTC(y, m + 1, 1) - 1);
      case BudgetPeriod.QUARTERLY:
        // 1st of the month 3 ahead − 1 ms → last ms of the closing quarter month
        return new Date(Date.UTC(y, m + 3, 1) - 1);
      case BudgetPeriod.YEARLY:
        // Jan 1 of next year − 1 ms → Dec 31 23:59:59.999Z
        return new Date(Date.UTC(y + 1, 0, 1) - 1);
      default:
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Invalid budget period',
        });
    }
  }
}
