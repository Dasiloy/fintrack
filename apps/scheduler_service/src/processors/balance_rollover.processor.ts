import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import { Prisma, TransactionType } from '@fintrack/database/types';
import {
  BALANCE_ROLLOVER_QUEUE,
  BALANCE_ROLLOVER_JOB,
} from '@fintrack/types/constants/queus.constants';
import dayjs from '@fintrack/utils/date';

/**
 * BalanceRolloverProcessor — monthly safety-net rollover for UserBalance rows.
 *
 * The primary rollover path is synchronous: every time a user writes a
 * transaction, `BalanceService.ensureCurrentMonth()` in finance_service checks
 * whether the stored month has changed and archives + re-initialises it inline.
 *
 * This processor handles the edge case of users who made zero transactions
 * during the new month, meaning the write-path rollover never fired for them.
 * It is triggered once a month by a @Cron job in SchedulerService.
 *
 * For each stale UserBalance row (monthYear !== current month):
 *   1. Archives the stale counters to MonthlyBalanceSnapshot (idempotent upsert).
 *   2. Re-initialises monthly counters from a bounded groupBy query so that any
 *      future-dated transactions entered in prior months are correctly captured.
 *
 * Each user is processed in an isolated $transaction with Serializable isolation
 * so the groupBy reads see a fully consistent snapshot even if concurrent
 * transaction writes are in flight during the rollover window.
 *
 * Failures per user are caught and logged individually — a single user failure
 * does not abort the remaining rollover work.
 */
@Processor(BALANCE_ROLLOVER_QUEUE)
export class BalanceRolloverProcessor extends WorkerHost {
  private readonly logger = new Logger(BalanceRolloverProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Entry point called by BullMQ when a BALANCE_ROLLOVER_JOB is dequeued.
   * Iterates all stale UserBalance rows and rolls each one over to the current month.
   *
   * @param job BullMQ job — payload unused; the job is a signal-only trigger.
   */
  async process(
    job: Job<void, void, typeof BALANCE_ROLLOVER_JOB>,
  ): Promise<void> {
    this.logger.log(`[${job.id}] Balance rollover started`);

    const currentMonthYear = dayjs().format('YYYY-MM');

    // Fetch all rows whose month counter is behind the current month.
    // Querying for `not: currentMonthYear` rather than `equals: previousMonth`
    // catches users who have been inactive for multiple months (their monthYear
    // could be 2–12 months in the past, not just one month behind).
    const staleRows = await this.prisma.userBalance.findMany({
      where: { monthYear: { not: currentMonthYear } },
      select: {
        userId: true,
        monthYear: true,
        monthlyIncome: true,
        monthlyExpense: true,
      },
    });

    if (!staleRows.length) {
      this.logger.log(
        `[${job.id}] No stale balance rows found — nothing to roll over`,
      );
      return;
    }

    this.logger.log(
      `[${job.id}] Rolling over ${staleRows.length} stale balance(s) to ${currentMonthYear}`,
    );

    let succeeded = 0;
    let failed = 0;

    for (const row of staleRows) {
      try {
        await this.rolloverUser(row, currentMonthYear);
        succeeded++;
      } catch (err) {
        this.logger.error(
          `[${job.id}] Rollover failed for userId=${row.userId}`,
          err instanceof Error ? err.stack : err,
        );
        failed++;
      }
    }

    this.logger.log(
      `[${job.id}] Balance rollover complete — succeeded: ${succeeded}, failed: ${failed}`,
    );

    if (failed > 0) {
      throw new Error(
        `Balance rollover completed with ${failed} failure(s). Succeeded: ${succeeded}.`,
      );
    }
  }

  /**
   * Rolls a single user's stale balance over to the current month within a
   * Serializable transaction so the groupBy re-initialisation reads a fully
   * consistent snapshot even under concurrent transaction writes.
   *
   * @param row             The stale UserBalance row fetched before this call.
   * @param currentMonthYear Server's current "YYYY-MM" string.
   */
  private async rolloverUser(
    row: {
      userId: string;
      monthYear: string;
      monthlyIncome: Prisma.Decimal;
      monthlyExpense: Prisma.Decimal;
    },
    currentMonthYear: string,
  ): Promise<void> {
    const monthStart = dayjs().startOf('month').toDate();
    const monthEnd = dayjs().endOf('month').toDate();

    await this.prisma.$transaction(
      async (tx) => {
        // ── Step 1: archive the stale month ──────────────────────────────────
        // upsert so this is idempotent: a snapshot for this month may already
        // exist if the write-path ensureCurrentMonth partially ran earlier.
        await tx.monthlyBalanceSnapshot.upsert({
          where: {
            userId_monthYear: {
              userId: row.userId,
              monthYear: row.monthYear,
            },
          },
          create: {
            userId: row.userId,
            monthYear: row.monthYear,
            income: row.monthlyIncome,
            expense: row.monthlyExpense,
            net: row.monthlyIncome.sub(row.monthlyExpense),
          },
          update: {}, // never overwrite a snapshot that is already stored
        });

        // ── Step 2: initialise new month counters ─────────────────────────────
        // DO NOT reset to 0. Future-dated transactions entered in prior months
        // (e.g. a user in April who booked a July transaction last month) already
        // exist in the DB and belong to the new month. A hard reset would lose them.
        // The groupBy re-derives the correct opening balance from all transactions
        // that fall within the new month's date range.
        const totals = await tx.transaction.groupBy({
          by: ['type'],
          where: {
            userId: row.userId,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        });

        const initIncome = new Prisma.Decimal(
          totals.find((r) => r.type === TransactionType.INCOME)?._sum.amount ??
            0,
        );
        const initExpense = new Prisma.Decimal(
          totals.find((r) => r.type === TransactionType.EXPENSE)?._sum.amount ??
            0,
        );

        await tx.userBalance.update({
          where: { userId: row.userId },
          data: {
            monthYear: currentMonthYear,
            monthlyIncome: initIncome,
            monthlyExpense: initExpense,
          },
        });
      },
      {
        // Serializable isolation prevents non-repeatable reads: if concurrent
        // transaction writes commit while the groupBy is running, Postgres
        // ensures they are either fully visible or not at all, avoiding
        // partial aggregates that would produce an incorrect opening balance.
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000, // ms to wait for a pool connection
        timeout: 30_000, // max wall-clock time per user rollover
      },
    );

    this.logger.log(
      `[BalanceRolloverProcessor] userId=${row.userId}: ${row.monthYear} → ${currentMonthYear}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[${job.id}] Balance rollover job completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[${job.id}] Balance rollover job failed`, error.stack);
  }
}
