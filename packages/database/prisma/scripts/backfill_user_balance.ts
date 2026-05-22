/**
 * One-time backfill — UserBalance + MonthlyBalanceSnapshot
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds UserBalance and MonthlyBalanceSnapshot for every existing user who has
 * transactions but no balance row yet. Run once after deploying the
 * add_user_balance migration to production, before the new balance-aware code
 * goes live.
 *
 * HOW TO RUN:
 *   pnpm --filter @fintrack/database db:backfill
 *
 * REQUIRED ENV VARS (same as normal DB connection):
 *   DATABASE_URL
 *   DATABASE_CA_CERTIFICATE
 *
 * IDEMPOTENCY:
 *   Safe to run multiple times. UserBalance rows are upsert-skipped if they
 *   already exist. MonthlyBalanceSnapshot rows are upsert-skipped too.
 *   Re-running will only process users who still have no UserBalance row.
 */

import { prisma } from '../../src/client';
import { Prisma } from '../../src/generated/prisma';

const ZERO = new Prisma.Decimal(0);

// Serializable isolation — groupBy reads inside the transaction must see a
// fully consistent snapshot. ReadCommitted (Postgres default) allows
// non-repeatable reads, which could produce wrong aggregate totals if
// transactions are being written concurrently during the backfill.
const TX_OPTIONS: Parameters<typeof prisma.$transaction>[1] = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 10_000, // ms to wait for a pool connection before timing out
  timeout: 60_000, // max wall-clock time for the transaction — backfill can be slow
};

function currentMonthYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthBounds(monthYear: string): { start: Date; end: Date } {
  const [y, m] = monthYear.split('-').map(Number) as [number, number];
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999); // last day of month
  return { start, end };
}

async function backfillUser(userId: string, thisMonthYear: string): Promise<void> {
  // ── All-time totals (outside the $transaction — read-only, no consistency risk)
  const allTime = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId },
    _sum: { amount: true },
  });

  const totalIncome = allTime.find((r) => r.type === 'INCOME')?._sum.amount ?? ZERO;
  const totalExpense = allTime.find((r) => r.type === 'EXPENSE')?._sum.amount ?? ZERO;
  const netBalance = new Prisma.Decimal(totalIncome).sub(totalExpense);

  // ── Current-month totals ────────────────────────────────────────────────────
  const { start: mStart, end: mEnd } = monthBounds(thisMonthYear);
  const thisMonth = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, date: { gte: mStart, lte: mEnd } },
    _sum: { amount: true },
  });

  const monthlyIncome = thisMonth.find((r) => r.type === 'INCOME')?._sum.amount ?? ZERO;
  const monthlyExpense = thisMonth.find((r) => r.type === 'EXPENSE')?._sum.amount ?? ZERO;

  // ── All distinct past months that have transactions ─────────────────────────
  const pastMonths = await prisma.$queryRaw<{ month: string }[]>`
    SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') AS month
    FROM "Transaction"
    WHERE "userId" = ${userId}
      AND TO_CHAR(date, 'YYYY-MM') != ${thisMonthYear}
    ORDER BY month ASC
  `;

  // ── Write everything atomically ─────────────────────────────────────────────
  // Serializable + long timeout — each per-month groupBy inside the transaction
  // reads a consistent snapshot, preventing races with concurrent transaction writes.
  await prisma.$transaction(async (tx) => {
    // Create UserBalance — skip if row already exists (idempotent)
    await tx.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        monthYear: thisMonthYear,
        netBalance,
        totalIncome,
        totalExpense,
        monthlyIncome,
        monthlyExpense,
      },
      update: {}, // never overwrite — preserve writes that occurred after deploy
    });

    // Create MonthlyBalanceSnapshot for each historical month
    for (const { month } of pastMonths) {
      const { start, end } = monthBounds(month);

      const monthTotals = await tx.transaction.groupBy({
        by: ['type'],
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      });

      const mIncome = monthTotals.find((r) => r.type === 'INCOME')?._sum.amount ?? ZERO;
      const mExpense = monthTotals.find((r) => r.type === 'EXPENSE')?._sum.amount ?? ZERO;
      const mNet = new Prisma.Decimal(mIncome).sub(mExpense);

      await tx.monthlyBalanceSnapshot.upsert({
        where: { userId_monthYear: { userId, monthYear: month } },
        create: { userId, monthYear: month, income: mIncome, expense: mExpense, net: mNet },
        update: {}, // idempotent
      });
    }
  }, TX_OPTIONS);
}

async function main() {
  const thisMonthYear = currentMonthYear();
  console.log(`\nBackfilling UserBalance — current month: ${thisMonthYear}`);

  // Users who have transactions but no UserBalance row yet
  const targets = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT DISTINCT t."userId"
    FROM "Transaction" t
    LEFT JOIN "UserBalance" ub ON t."userId" = ub."userId"
    WHERE ub."userId" IS NULL
  `;

  console.log(`Found ${targets.length} user(s) to backfill\n`);

  let ok = 0;
  let failed = 0;

  for (const { userId } of targets) {
    try {
      await backfillUser(userId, thisMonthYear);
      console.log(`  ✓ ${userId}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${userId}`, err);
      failed++;
    }
  }

  console.log(`\nDone — ${ok} succeeded, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
