import { status } from '@grpc/grpc-js';

import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import { Prisma } from '@fintrack/database/types';
import {
  FinanceBoard,
  FinanceBoardHistory,
} from '@fintrack/types/protos/finance/finance';
import dayjs, { getPeriodRange } from '@fintrack/utils/date';
import {
  isGoalOnPace,
  ratioScore,
  roundScore,
  savingScore,
} from '@fintrack/utils/finance_score';
import {
  BUDGET_WEIGHT,
  GOAL_WEIGHT,
  SAVING_WEIGHT,
  SPLIT_WEIGHT,
} from '@fintrack/types/constants/finance.constant';
import { BalanceService } from '@fintrack/common/services/balance.service';

/**
 * @description Computes and serves the weekly **Financial Health Score** board
 * (aka FinanceBoard) — a single 0–100 score plus its four weighted components.
 *
 * ## Score model (per BL-008)
 * | Component           | Field         | Max weight |
 * |---------------------|---------------|------------|
 * | Budget adherence    | `budgetScore` | 35 |
 * | Savings rate        | `savingScore` | 25 |
 * | Goal pacing         | `goalScore`   | 25 |
 * | Outstanding splits  | `splitScore`  | 15 |
 *
 * `score` is the sum of the four components (0.0–100.0). Component caps match
 * the `Decimal(4,1)` columns on the `FinanceScoreBoard` model.
 *
 * Each component is an adherence/health ratio scaled to its weight. When a
 * category has nothing to assess (no budgets, no income, no active goals, no
 * splits) it scores **full marks** — the absence of a problem is treated as
 * healthy rather than penalised.
 *
 * ## Cadence & persistence
 * {@link getFinanceBoard} computes the **live** current-week board on demand.
 * Weekly snapshots (Mon→Sun) are persisted to `FinanceScoreBoard` and served by
 * {@link getFinanceBoardHistory}. Writing those snapshots is the scheduler's job
 * (a future weekly sweep) — this service owns the read/compute side.
 *
 * Exposed over gRPC on `FinanceService`
 * (`GetFinanceBoard` / `GetFinanceBoardHistory` — `packages/types/proto/finance/finance.proto`).
 *
 * @class FinnaceService
 */
@Injectable()
export class FinnaceService {
  private readonly logger = new Logger(FinnaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly balace: BalanceService,
  ) {}

  /**
   * @description Computes the live current-week Financial Health board for a
   * user — each weighted component plus the composite `score` — in one read
   * transaction.
   *
   * Savings and budget adherence are assessed over the current calendar month
   * (matching `UserBalance` and the MONTHLY budget period); goal pacing and
   * split settlement reflect current state. The reported window is the current
   * ISO week (Mon→Sun), consistent with the persisted snapshot cadence.
   *
   * @async
   * @public
   * @param {string} userId The user whose board to compute
   * @returns {Promise<FinanceBoard>} The assembled current-week board
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  public async getFinanceBoard(userId: string): Promise<FinanceBoard> {
    try {
      const scores = await this.prisma.$transaction(
        async (tx) => {
          // Savings first — it may roll the UserBalance row onto the current
          // month before we read the monthly counters.
          const savingScore = await this.computeSavingScore(tx, userId);

          const [budgetScore, goalScore, splitScore] = await Promise.all([
            this.computeBudgetScore(tx, userId),
            this.computeGoalScore(tx, userId),
            this.computeSplitScore(tx, userId),
          ]);
          return { budgetScore, savingScore, goalScore, splitScore };
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
          isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        },
      );

      const start = dayjs().startOf('isoWeek');
      const end = dayjs().endOf('isoWeek');

      return {
        id: 'current',
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
        score: roundScore(
          scores.budgetScore +
            scores.savingScore +
            scores.goalScore +
            scores.splitScore,
        ),
        budgetScore: roundScore(scores.budgetScore),
        savingScore: roundScore(scores.savingScore),
        goalScore: roundScore(scores.goalScore),
        splitScore: roundScore(scores.splitScore),
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(
        `getFinanceBoard failed: ${error.message}`,
        error.stack,
      );
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred, please try again later',
        details: error.message,
      });
    }
  }

  /**
   * @description Returns the user's persisted weekly Financial Health history —
   * the most recent 12 weeks, in chronological (oldest→newest) order for
   * charting. Each row's `Decimal` metrics map to numbers and dates to
   * `YYYY-MM-DD`.
   *
   * @async
   * @public
   * @param {string} userId The user whose history to fetch
   * @returns {Promise<FinanceBoardHistory>} Up to 12 weekly snapshots, oldest-first
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  public async getFinanceBoardHistory(
    userId: string,
  ): Promise<FinanceBoardHistory> {
    try {
      const rows = await this.prisma.financeScoreBoard.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
        take: 12,
      });

      return {
        history: rows.reverse().map((fbh) => ({
          id: fbh.id,
          startDate: dayjs(fbh.startDate).format('YYYY-MM-DD'),
          endDate: dayjs(fbh.endDate).format('YYYY-MM-DD'),
          score: fbh.score.toNumber(),
          splitScore: fbh.splitScore.toNumber(),
          budgetScore: fbh.budgetScore.toNumber(),
          goalScore: fbh.goalScore.toNumber(),
          savingScore: fbh.savingScore.toNumber(),
        })),
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(
        `getFinanceBoardHistory failed: ${error.message}`,
        error.stack,
      );
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred, please try again later',
        details: error.message,
      });
    }
  }

  // ── Component computations ──────────────────────────────────────────────────

  /**
   * @description Savings-rate component (≤25). Savings rate is
   * `(monthlyIncome − monthlyExpense) / monthlyIncome` for the current month,
   * clamped to `[0, 1]` and scaled to the weight. Returns 0 when there is no
   * income to measure against.
   *
   * @private
   */
  private async computeSavingScore(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<number> {
    const balance = await this.balace.ensureCurrentMonth(tx, userId);
    const income = balance?.monthlyIncome?.toNumber() ?? 0;
    const expense = balance?.monthlyExpense?.toNumber() ?? 0;
    return savingScore(income, expense, SAVING_WEIGHT);
  }

  /**
   * @description Budget-adherence component (≤35). The fraction of active
   * budgets whose current-month EXPENSE spend is within their effective limit,
   * scaled to the weight. Full marks when the user has no active budgets.
   *
   * @private
   */
  private async computeBudgetScore(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<number> {
    const [periodStart, periodEnd] = getPeriodRange(); // [monthStart, nextMonthStart)

    const budgets = await tx.budget.findMany({
      where: {
        userId,
        OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: periodStart } }],
      },
      select: { id: true, categoryId: true, amount: true },
    });
    if (budgets.length === 0) return BUDGET_WEIGHT;

    const [spend, limits] = await Promise.all([
      tx.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: 'EXPENSE',
          categoryId: { in: budgets.map((b) => b.categoryId) },
          date: { gte: periodStart, lt: periodEnd },
        },
        _sum: { amount: true },
      }),
      // Effective limit for each budget at the start of the period.
      tx.budgetHistory.findMany({
        where: {
          budgetId: { in: budgets.map((b) => b.id) },
          startDate: { lte: periodStart },
          OR: [{ endDate: null }, { endDate: { gt: periodStart } }],
        },
        select: { budgetId: true, limit: true },
      }),
    ]);

    const spentMap = new Map(
      spend.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]),
    );
    const limitMap = new Map(limits.map((l) => [l.budgetId, l.limit]));

    let adherent = 0;
    for (const b of budgets) {
      const limit = limitMap.get(b.id) ?? b.amount;
      const spent = spentMap.get(b.categoryId) ?? 0;
      if (spent <= limit) adherent++;
    }

    return ratioScore(adherent, budgets.length, BUDGET_WEIGHT);
  }

  /**
   * @description Goal-pacing component (≤25). The fraction of ACTIVE goals on
   * pace, scaled to the weight. A goal is on pace when its contributed fraction
   * (`saved / targetAmount`) is at least its expected fraction (elapsed share of
   * `createdAt`→`targetDate`). Full marks when there are no active goals.
   *
   * @private
   */
  private async computeGoalScore(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<number> {
    const goals = await tx.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      select: {
        id: true,
        targetAmount: true,
        targetDate: true,
        createdAt: true,
      },
    });
    if (goals.length === 0) return GOAL_WEIGHT;

    const contributions = await tx.goalContribution.groupBy({
      by: ['goalId'],
      where: { goalId: { in: goals.map((g) => g.id) } },
      _sum: { amount: true },
    });
    const savedMap = new Map(
      contributions.map((c) => [c.goalId, Number(c._sum.amount ?? 0)]),
    );

    const now = Date.now();
    let onPace = 0;
    for (const g of goals) {
      const saved = savedMap.get(g.id) ?? 0;
      if (
        isGoalOnPace(
          saved,
          g.targetAmount,
          g.createdAt.getTime(),
          g.targetDate.getTime(),
          now,
        )
      ) {
        onPace++;
      }
    }

    return ratioScore(onPace, goals.length, GOAL_WEIGHT);
  }

  /**
   * @description Split-settlement component (≤15). The fraction of the user's
   * splits that are fully SETTLED, scaled to the weight. Full marks when the
   * user has no splits.
   *
   * @private
   */
  private async computeSplitScore(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<number> {
    const groups = await tx.split.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });

    const total = groups.reduce((sum, g) => sum + g._count._all, 0);
    const settled =
      groups.find((g) => g.status === 'SETTLED')?._count._all ?? 0;
    return ratioScore(settled, total, SPLIT_WEIGHT);
  }
}
