import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import {
  FINANCE_SCORE_QUEUE,
  FINANCE_SCORE_SNAPSHOT_JOB,
} from '@fintrack/types/constants/queus.constants';
import {
  BUDGET_WEIGHT,
  GOAL_WEIGHT,
  SAVING_WEIGHT,
  SPLIT_WEIGHT,
} from '@fintrack/types/constants/finance.constant';
import {
  isGoalOnPace,
  ratioScore,
  roundScore,
  savingScore,
} from '@fintrack/utils/finance_score';
import dayjs, { currentMonthYear, getPeriodRange } from '@fintrack/utils/date';

const INSERT_CHUNK = 1000;

/**
 * Weekly **Financial Health Score** snapshot job (BL-008).
 *
 * Runs every Monday (enqueued by `SchedulerService.snapshotFinanceScores`) and
 * persists one `FinanceScoreBoard` row per active user for the ISO week that
 * just ended — the historical audit trail powering the score trend.
 *
 * ## Why this differs from `FinnaceService`
 * The finance service computes a single user's board with per-user queries. The
 * scheduler must score *every* user, so it computes in **bulk**: a handful of
 * `groupBy`/`findMany` queries fetch all the inputs at once, results are indexed
 * by user in memory, and snapshots are written with a chunked `createMany`. The
 * scoring math itself is shared via `@fintrack/utils/finance_score` so the
 * weekly snapshot and the live board can never drift.
 *
 * Idempotent: users already snapshotted for the target week are skipped, so a
 * re-run never double-writes.
 */
@Processor(FINANCE_SCORE_QUEUE)
export class FinanceScoreProcessor extends WorkerHost {
  private readonly logger = new Logger(FinanceScoreProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`${FINANCE_SCORE_QUEUE} queue is ready`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `${FINANCE_SCORE_QUEUE} queue: Job ${job.id} [${job.name}] started`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: unknown) {
    this.logger.log(
      `${FINANCE_SCORE_QUEUE} queue: Job ${job.id} [${job.name}] completed. Result: ${JSON.stringify(result)}`,
    );
  }

  @OnWorkerEvent('failed')
  onFail(job: Job, err: Error) {
    this.logger.error(
      `${FINANCE_SCORE_QUEUE} queue: Job ${job.id} [${job.name}] failed: ${err.message}`,
      err.stack,
    );
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log(`${FINANCE_SCORE_QUEUE} queue is drained`);
  }

  @OnWorkerEvent('error')
  onError(err: Error) {
    this.logger.error(
      `${FINANCE_SCORE_QUEUE} queue: Worker error: ${err.message}`,
      err.stack,
    );
  }

  async process(job: Job): Promise<void> {
    if (job.name !== FINANCE_SCORE_SNAPSHOT_JOB) return;
    await this.snapshotWeeklyScores();
  }

  private async snapshotWeeklyScores(): Promise<void> {
    // Snapshot the ISO week that just ended (job runs Monday → previous Mon–Sun).
    const lastWeek = dayjs().subtract(1, 'week');
    const startDate = lastWeek.startOf('isoWeek').toDate();
    const endDate = lastWeek.endOf('isoWeek').toDate();

    // Budget adherence & savings are assessed over the current calendar month
    // (matching UserBalance + the MONTHLY budget period), as on the live board.
    const [monthStart, monthEnd] = getPeriodRange();
    const currentMonth = currentMonthYear();
    const now = Date.now();

    // User universe: everyone with a balance row (i.e. who has transacted).
    const balances = await this.prisma.userBalance.findMany({
      select: {
        userId: true,
        monthYear: true,
        monthlyIncome: true,
        monthlyExpense: true,
      },
    });
    if (balances.length === 0) {
      this.logger.log('Finance score snapshot: no users to score');
      return;
    }

    const allUserIds = balances.map((b) => b.userId);

    // Idempotency — skip users already snapshotted for this week.
    const existing = await this.prisma.financeScoreBoard.findMany({
      where: { startDate, userId: { in: allUserIds } },
      select: { userId: true },
    });
    const alreadyDone = new Set(existing.map((e) => e.userId));
    const userIds = allUserIds.filter((id) => !alreadyDone.has(id));
    if (userIds.length === 0) {
      this.logger.log('Finance score snapshot: all users already snapshotted');
      return;
    }

    // ── Bulk inputs, keyed by user ────────────────────────────────────────────
    const [budgets, goals, splitGroups] = await Promise.all([
      this.prisma.budget.findMany({
        where: {
          userId: { in: userIds },
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: monthStart } }],
        },
        select: { id: true, userId: true, categoryId: true, amount: true },
      }),
      this.prisma.goal.findMany({
        where: { userId: { in: userIds }, status: 'ACTIVE' },
        select: {
          id: true,
          userId: true,
          targetAmount: true,
          targetDate: true,
          createdAt: true,
        },
      }),
      this.prisma.split.groupBy({
        by: ['userId', 'status'],
        where: { userId: { in: userIds } },
        _count: { _all: true },
      }),
    ]);

    const budgetIds = budgets.map((b) => b.id);
    const goalIds = goals.map((g) => g.id);

    const [spend, limits, contributions] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['userId', 'categoryId'],
        where: {
          userId: { in: userIds },
          type: 'EXPENSE',
          date: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      }),
      // `in: []` is valid and returns nothing, so we always query for clean types.
      this.prisma.budgetHistory.findMany({
        where: {
          budgetId: { in: budgetIds },
          startDate: { lte: monthStart },
          OR: [{ endDate: null }, { endDate: { gt: monthStart } }],
        },
        select: { budgetId: true, limit: true },
      }),
      this.prisma.goalContribution.groupBy({
        by: ['goalId'],
        where: { goalId: { in: goalIds } },
        _sum: { amount: true },
      }),
    ]);

    // ── Index everything by user ──────────────────────────────────────────────
    const balanceByUser = new Map(balances.map((b) => [b.userId, b]));
    const budgetsByUser = this.groupBy(budgets, (b) => b.userId);
    const goalsByUser = this.groupBy(goals, (g) => g.userId);

    const spentByCat = new Map<string, number>(); // key: `${userId}:${categoryId}`
    for (const s of spend) {
      spentByCat.set(`${s.userId}:${s.categoryId}`, Number(s._sum.amount ?? 0));
    }
    const limitByBudget = new Map(limits.map((l) => [l.budgetId, l.limit]));
    const savedByGoal = new Map(
      contributions.map((c) => [c.goalId, Number(c._sum.amount ?? 0)]),
    );

    const splitByUser = new Map<string, { total: number; settled: number }>();
    for (const g of splitGroups) {
      const cur = splitByUser.get(g.userId) ?? { total: 0, settled: 0 };
      cur.total += g._count._all;
      if (g.status === 'SETTLED') cur.settled += g._count._all;
      splitByUser.set(g.userId, cur);
    }

    // ── Compose one snapshot row per user ─────────────────────────────────────
    const rows = userIds.map((userId) => {
      const bal = balanceByUser.get(userId);
      const onCurrentMonth = bal?.monthYear === currentMonth;
      const income = onCurrentMonth ? (bal?.monthlyIncome.toNumber() ?? 0) : 0;
      const expense = onCurrentMonth
        ? (bal?.monthlyExpense.toNumber() ?? 0)
        : 0;
      const saving = savingScore(income, expense, SAVING_WEIGHT);

      const userBudgets = budgetsByUser.get(userId) ?? [];
      let adherent = 0;
      for (const b of userBudgets) {
        const limit = limitByBudget.get(b.id) ?? b.amount;
        const spent = spentByCat.get(`${userId}:${b.categoryId}`) ?? 0;
        if (spent <= limit) adherent++;
      }
      const budget = ratioScore(adherent, userBudgets.length, BUDGET_WEIGHT);

      const userGoals = goalsByUser.get(userId) ?? [];
      let onPace = 0;
      for (const g of userGoals) {
        const saved = savedByGoal.get(g.id) ?? 0;
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
      const goal = ratioScore(onPace, userGoals.length, GOAL_WEIGHT);

      const sp = splitByUser.get(userId) ?? { total: 0, settled: 0 };
      const split = ratioScore(sp.settled, sp.total, SPLIT_WEIGHT);

      return {
        userId,
        startDate,
        endDate,
        score: roundScore(budget + saving + goal + split),
        budgetScore: roundScore(budget),
        savingScore: roundScore(saving),
        goalScore: roundScore(goal),
        splitScore: roundScore(split),
      };
    });

    // Chunked insert to keep individual statements bounded.
    let written = 0;
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const chunk = rows.slice(i, i + INSERT_CHUNK);
      const res = await this.prisma.financeScoreBoard.createMany({
        data: chunk,
      });
      written += res.count;
    }

    this.logger.log(
      `Finance score snapshot: wrote ${written} board(s) for week ${dayjs(startDate).format('YYYY-MM-DD')} → ${dayjs(endDate).format('YYYY-MM-DD')}`,
    );
  }

  /** Groups an array into a `Map` keyed by the given selector. */
  private groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const k = key(item);
      const bucket = map.get(k);
      if (bucket) bucket.push(item);
      else map.set(k, [item]);
    }
    return map;
  }
}
