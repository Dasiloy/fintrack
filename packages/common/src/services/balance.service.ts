import { Injectable, Logger } from '@nestjs/common';

import {
  currentMonthBounds,
  currentMonthYear,
  toMonthYear,
} from '@fintrack/utils/date';
import { Prisma, TransactionType } from '@fintrack/database/types';

/**
 * Shared balance bookkeeping service.
 *
 * Maintains two materialised tables atomically with every transaction write:
 *   - UserBalance            — live all-time totals + current-month counters
 *   - MonthlyBalanceSnapshot — end-of-month archives for historical analytics
 *
 * All methods receive a Prisma interactive-transaction client so every balance
 * mutation is atomic with the transaction record that triggered it.
 *
 * Caller contract:
 *   1. Call `ensureCurrentMonth` BEFORE `tx.transaction.create()`.
 *   2. Call `applyBalanceDelta`  AFTER  `tx.transaction.create()`.
 *
 * This ordering prevents the month-rollover groupBy from seeing the incoming
 * transaction and double-counting it.
 */
@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  /**
   * Checks whether the stored calendar month in UserBalance matches the
   * current month. If it does not, archives the stale counters to
   * MonthlyBalanceSnapshot and re-initialises the monthly fields from a
   * fresh groupBy. Must run BEFORE the transaction record is created.
   */
  async ensureCurrentMonth(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    const thisMonth = currentMonthYear();

    const existing = await tx.userBalance.findUnique({
      where: { userId },
      select: { monthYear: true, monthlyIncome: true, monthlyExpense: true },
    });

    // No row yet (first-ever transaction) or already on the current month — nothing to do.
    if (!existing || existing.monthYear === thisMonth) return;

    // Archive the stale month (idempotent upsert so partial rollover is safe).
    await tx.monthlyBalanceSnapshot.upsert({
      where: { userId_monthYear: { userId, monthYear: existing.monthYear } },
      create: {
        userId,
        monthYear: existing.monthYear,
        income: existing.monthlyIncome,
        expense: existing.monthlyExpense,
        net: existing.monthlyIncome.sub(existing.monthlyExpense),
      },
      update: {},
    });

    // Re-initialise monthly counters from existing transactions in the new month.
    // Runs BEFORE the incoming transaction is created, so it cannot double-count it.
    const { start: monthStart, end: monthEnd } = currentMonthBounds();
    const totals = await tx.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    });

    const initIncome = new Prisma.Decimal(
      totals.find((r) => r.type === TransactionType.INCOME)?._sum.amount ?? 0,
    );
    const initExpense = new Prisma.Decimal(
      totals.find((r) => r.type === TransactionType.EXPENSE)?._sum.amount ?? 0,
    );

    await tx.userBalance.update({
      where: { userId },
      data: { monthYear: thisMonth, monthlyIncome: initIncome, monthlyExpense: initExpense },
    });

    this.logger.log(
      `[BalanceService] rolled over userId=${userId}: ${existing.monthYear} -> ${thisMonth}`,
    );
  }

  /**
   * Atomically applies a signed delta to UserBalance for all-time totals and
   * conditionally to the current-month counters or a historical snapshot
   * depending on when the transaction is dated. Must run AFTER the transaction
   * record is created.
   *
   * Three date scenarios:
   *   Present — updates netBalance, totalIncome/Expense, AND monthlyIncome/Expense.
   *   Past    — updates netBalance and totalIncome/Expense; upserts the monthly snapshot.
   *   Future  — updates netBalance and totalIncome/Expense only.
   */
  async applyBalanceDelta(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TransactionType,
    amount: number,
    operation: 'ADD' | 'REMOVE',
    txDate: Date,
  ): Promise<void> {
    const ZERO = new Prisma.Decimal(0);
    const thisMonth = currentMonthYear();
    const txMonth = toMonthYear(txDate);

    const isIncome = type === TransactionType.INCOME;
    const delta = new Prisma.Decimal(amount).mul(operation === 'ADD' ? 1 : -1);
    const netDelta = isIncome ? delta : delta.neg();

    const isCurrentMonth = txMonth === thisMonth;
    const isPastMonth = txMonth < thisMonth;

    await tx.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        monthYear: thisMonth,
        netBalance: netDelta,
        totalIncome: isIncome ? delta : ZERO,
        totalExpense: isIncome ? ZERO : delta,
        monthlyIncome: isCurrentMonth && isIncome ? delta : ZERO,
        monthlyExpense: isCurrentMonth && !isIncome ? delta : ZERO,
      },
      update: {
        netBalance: { increment: netDelta },
        ...(isIncome
          ? { totalIncome: { increment: delta } }
          : { totalExpense: { increment: delta } }),
        ...(isCurrentMonth && isIncome ? { monthlyIncome: { increment: delta } } : {}),
        ...(isCurrentMonth && !isIncome ? { monthlyExpense: { increment: delta } } : {}),
      },
    });

    if (isPastMonth) {
      await tx.monthlyBalanceSnapshot.upsert({
        where: { userId_monthYear: { userId, monthYear: txMonth } },
        create: {
          userId,
          monthYear: txMonth,
          income: isIncome ? delta : ZERO,
          expense: isIncome ? ZERO : delta,
          net: netDelta,
        },
        update: {
          ...(isIncome
            ? { income: { increment: delta } }
            : { expense: { increment: delta } }),
          net: { increment: netDelta },
        },
      });
    }
  }

  /**
   * Batch variant of `applyBalanceDelta` for bulk transaction imports.
   *
   * Collapses all deltas to O(1 + distinct_past_months) DB writes instead of
   * O(n) — critical for bank-import batches with hundreds of historical rows.
   *
   * Same three-scenario logic as `applyBalanceDelta` applies per item:
   *   Present — updates UserBalance all-time totals + monthly counters.
   *   Past    — updates UserBalance all-time totals + patches MonthlyBalanceSnapshot.
   *   Future  — updates UserBalance all-time totals only.
   */
  async applyBatchBalanceDelta(
    tx: Prisma.TransactionClient,
    userId: string,
    items: Array<{ type: TransactionType; amount: number; date: Date }>,
    operation: 'ADD' | 'REMOVE',
  ): Promise<void> {
    if (!items.length) return;

    const ZERO = new Prisma.Decimal(0);
    const thisMonth = currentMonthYear();
    const sign = operation === 'ADD' ? 1 : -1;

    let netDelta = ZERO;
    let totalIncomeDelta = ZERO;
    let totalExpenseDelta = ZERO;
    let monthlyIncomeDelta = ZERO;
    let monthlyExpenseDelta = ZERO;

    const pastBuckets = new Map<
      string,
      { income: Prisma.Decimal; expense: Prisma.Decimal; net: Prisma.Decimal }
    >();

    for (const item of items) {
      const txMonth = toMonthYear(item.date);
      const isIncome = item.type === TransactionType.INCOME;
      const delta = new Prisma.Decimal(item.amount).mul(sign);
      const itemNet = isIncome ? delta : delta.neg();

      netDelta = netDelta.add(itemNet);
      if (isIncome) {
        totalIncomeDelta = totalIncomeDelta.add(delta);
      } else {
        totalExpenseDelta = totalExpenseDelta.add(delta);
      }

      if (txMonth === thisMonth) {
        if (isIncome) {
          monthlyIncomeDelta = monthlyIncomeDelta.add(delta);
        } else {
          monthlyExpenseDelta = monthlyExpenseDelta.add(delta);
        }
      } else if (txMonth < thisMonth) {
        const bucket = pastBuckets.get(txMonth) ?? { income: ZERO, expense: ZERO, net: ZERO };
        pastBuckets.set(txMonth, {
          income: isIncome ? bucket.income.add(delta) : bucket.income,
          expense: isIncome ? bucket.expense : bucket.expense.add(delta),
          net: bucket.net.add(itemNet),
        });
      }
    }

    await tx.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        monthYear: thisMonth,
        netBalance: netDelta,
        totalIncome: totalIncomeDelta,
        totalExpense: totalExpenseDelta,
        monthlyIncome: monthlyIncomeDelta,
        monthlyExpense: monthlyExpenseDelta,
      },
      update: {
        netBalance: { increment: netDelta },
        totalIncome: { increment: totalIncomeDelta },
        totalExpense: { increment: totalExpenseDelta },
        monthlyIncome: { increment: monthlyIncomeDelta },
        monthlyExpense: { increment: monthlyExpenseDelta },
      },
    });

    for (const [monthYear, { income, expense, net }] of pastBuckets) {
      await tx.monthlyBalanceSnapshot.upsert({
        where: { userId_monthYear: { userId, monthYear } },
        create: { userId, monthYear, income, expense, net },
        update: {
          income: { increment: income },
          expense: { increment: expense },
          net: { increment: net },
        },
      });
    }
  }
}
