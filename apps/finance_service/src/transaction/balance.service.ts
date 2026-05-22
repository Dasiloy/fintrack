import { Injectable, Logger } from '@nestjs/common';

import {
  currentMonthBounds,
  currentMonthYear,
  toMonthYear,
} from '@fintrack/utils/date';
import { Prisma, TransactionType } from '@fintrack/database/types';

/**
 * BalanceService -- synchronous, transactional balance bookkeeping.
 *
 * Maintains two materialised tables:
 *   - UserBalance            -- live all-time totals + current-month counters (O(1) read)
 *   - MonthlyBalanceSnapshot -- end-of-month archives for historical analytics (O(12) read)
 *
 * All methods receive a Prisma interactive-transaction client so every balance
 * mutation is atomic with the transaction record that triggered it. If either
 * the balance write or the transaction write fails, the whole operation rolls back.
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
   * Checks whether the stored calendar month in UserBalance matches the server's
   * current month. If it does not (the user's last write was in a prior month),
   * this method archives the stale counters and re-initialises the monthly
   * fields for the current month.
   *
   * Why a raw groupBy for initialisation instead of resetting to 0?
   * Future-dated transactions entered in prior months (e.g. a May user who
   * booked a July transaction last month) already live in the DB. A hard reset
   * would lose them. The groupBy re-derives the correct opening balance from
   * whatever transactions actually exist for the new month.
   *
   * @param tx     Prisma interactive transaction client -- must be the same tx
   *               passed to the subsequent `tx.transaction.create()` call.
   * @param userId Owner of the balance row to check and, if needed, roll over.
   */
  async ensureCurrentMonth(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    const thisMonth = currentMonthYear();

    const existing = await tx.userBalance.findUnique({
      where: { userId },
      select: {
        monthYear: true,
        monthlyIncome: true,
        monthlyExpense: true,
      },
    });

    // No balance row yet (first-ever transaction for this user) or already
    // on the current month -- nothing to archive or initialise.
    if (!existing || existing.monthYear === thisMonth) return;

    // Step 1: archive the stale month.
    // upsert so this is idempotent: a snapshot may already exist if a prior
    // rollover was partially applied before a crash.
    await tx.monthlyBalanceSnapshot.upsert({
      where: {
        userId_monthYear: { userId, monthYear: existing.monthYear },
      },
      create: {
        userId,
        monthYear: existing.monthYear,
        income: existing.monthlyIncome,
        expense: existing.monthlyExpense,
        net: existing.monthlyIncome.sub(existing.monthlyExpense),
      },
      update: {}, // never overwrite a snapshot that is already stored
    });

    // Step 2: initialise new month counters.
    // This query runs BEFORE the incoming transaction is created, so it cannot
    // double-count it. It will capture any future-dated transactions that were
    // entered in prior months and belong to the new month.
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
      data: {
        monthYear: thisMonth,
        monthlyIncome: initIncome,
        monthlyExpense: initExpense,
      },
    });

    this.logger.log(
      `[BalanceService] rolled over userId=${userId}: ${existing.monthYear} -> ${thisMonth}`,
    );
  }

  /**
   * Atomically applies a signed delta to UserBalance for all-time totals, and
   * conditionally to the current-month counters or a historical snapshot,
   * depending on when the transaction is dated.
   *
   * Three date scenarios:
   *
   *   Present (txDate falls in the current calendar month):
   *     Updates netBalance, totalIncome/totalExpense, AND monthlyIncome/monthlyExpense.
   *
   *   Past (txDate falls in a prior calendar month):
   *     Updates netBalance and totalIncome/totalExpense on UserBalance.
   *     Upserts MonthlyBalanceSnapshot for that month -- creates the row if it
   *     does not exist. This handles users who signed up after that month and
   *     therefore have no snapshot row for it.
   *
   *   Future (txDate falls in a future calendar month):
   *     Updates netBalance and totalIncome/totalExpense on UserBalance only.
   *     Monthly counters for that future month are derived by ensureCurrentMonth
   *     when that month becomes current -- it re-queries all transactions in range,
   *     including this future-dated one.
   *
   * @param tx        Prisma interactive transaction client.
   * @param userId    Owner of the balance row.
   * @param type      INCOME or EXPENSE -- determines the sign of the net delta.
   * @param amount    Raw transaction amount -- always a positive float as stored
   *                  on the Transaction record; sign is derived from `operation`.
   * @param operation ADD for creates, REMOVE for deletes.
   * @param txDate    The `date` field of the transaction record (may be past,
   *                  present, or future relative to today).
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

    // Positive for ADD, negative for REMOVE -- used for all `increment` fields.
    const delta = new Prisma.Decimal(amount).mul(operation === 'ADD' ? 1 : -1);

    // Net balance moves up for income, down for expense.
    const netDelta = isIncome ? delta : delta.neg();

    const isCurrentMonth = txMonth === thisMonth;
    const isPastMonth = txMonth < thisMonth;

    // All-time totals always move. Monthly counters move only for the current month.
    // upsert handles the edge case where no UserBalance row exists yet -- theoretically
    // impossible here (ensureCurrentMonth creates it on first write) but included
    // for defensive completeness.
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
        ...(isCurrentMonth && isIncome
          ? { monthlyIncome: { increment: delta } }
          : {}),
        ...(isCurrentMonth && !isIncome
          ? { monthlyExpense: { increment: delta } }
          : {}),
      },
    });

    // Past-dated: patch the historical snapshot.
    // upsert instead of updateMany because the snapshot row may not exist --
    // a user who registered after this month has no snapshot for it.
    // upsert seeds the row with the delta on first encounter; subsequent
    // back-dated writes to the same month hit the update branch and increment.
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

    // Future-dated: no snapshot action.
    // All-time totals and netBalance are updated above.
    // Monthly counters for the future month are derived when that month arrives:
    // ensureCurrentMonth re-queries all transactions in range, including this one.
  }

  /**
   * Batch variant of `applyBalanceDelta` designed for bulk transaction imports.
   *
   * Accepts an array of transaction descriptors and applies all deltas in the
   * minimum number of DB writes:
   *   - 1 upsert on UserBalance (all-time totals + current-month counters)
   *   - 1 upsert per distinct past calendar month in the batch (snapshot patches)
   *
   * Calling `applyBalanceDelta` in a loop would produce O(n) DB round trips.
   * This method collapses them to O(1 + distinct_past_months), which matters
   * for bank-import batches that can contain hundreds of historical transactions.
   *
   * Same three-scenario logic as `applyBalanceDelta` applies per item:
   *   Present  -- updates UserBalance all-time totals + monthly counters.
   *   Past     -- updates UserBalance all-time totals + patches MonthlyBalanceSnapshot.
   *   Future   -- updates UserBalance all-time totals only.
   *
   * @param tx        Prisma interactive transaction client.
   * @param userId    Owner of the balance row.
   * @param items     Transaction descriptors to apply -- must be the set of
   *                  records that were actually inserted (not the full input
   *                  including skipped duplicates).
   * @param operation ADD for creates, REMOVE for deletes.
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

    // Accumulate per-past-month income/expense/net for snapshot upserts.
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
        const bucket = pastBuckets.get(txMonth) ?? {
          income: ZERO,
          expense: ZERO,
          net: ZERO,
        };
        pastBuckets.set(txMonth, {
          income: isIncome ? bucket.income.add(delta) : bucket.income,
          expense: isIncome ? bucket.expense : bucket.expense.add(delta),
          net: bucket.net.add(itemNet),
        });
      }
      // Future-dated: all-time totals and netBalance only (handled above).
    }

    // Single upsert covering all-time totals and current-month counters.
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

    // One upsert per distinct past month — O(distinct past months), not O(n).
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
