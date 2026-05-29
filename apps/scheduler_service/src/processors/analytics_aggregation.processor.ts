import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';

import { PrismaService } from '@fintrack/database/service';
import {
  Goalstatus,
  Prisma,
  SnapshotType,
  TransactionType,
} from '@fintrack/database/types';
import {
  ANALYTICS_AGGREGATION_JOB,
  ANALYTICS_AGGREGATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import dayjs from '@fintrack/utils/date';

import { AnalyticsSnapshotData } from '@fintrack/types/interfaces/analytics';

/**
 * AnalyticsAggregationProcessor — nightly per-user analytics snapshot job.
 *
 * Stores only what is NOT already maintained in real-time elsewhere:
 *   - topCategories + budgetUtilisation — derived from ONE shared
 *     transaction.groupBy(categoryId) for the current month's EXPENSE rows.
 *   - goalProgress — ONE goalContribution.groupBy(goalId) for all active goals.
 *
 * totalIncome / totalExpense / netSavings are intentionally excluded.
 * Those are kept accurate in real-time by UserBalance (current month) and
 * MonthlyBalanceSnapshot (historical months) — reading from there avoids stale
 * aggregates and removes all income/expense transaction scans from this job.
 *
 * Per-user query cost: 4 queries.
 */
@Processor(ANALYTICS_AGGREGATION_QUEUE)
export class AnalyticsAggregationProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsAggregationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<void, void, typeof ANALYTICS_AGGREGATION_JOB>,
  ): Promise<void> {
    this.logger.log(`[${job.id}] Analytics aggregation started`);

    const now = dayjs();
    const currentMonthYear = now.format('YYYY-MM');

    // Users with a UserBalance row have at least one transaction — only
    // these users have meaningful data to aggregate.
    const users = await this.prisma.userBalance.findMany({
      select: { userId: true },
    });

    this.logger.log(
      `[${job.id}] Aggregating ${users.length} user(s) — period=${currentMonthYear}`,
    );

    let succeeded = 0;
    let failed = 0;

    for (const { userId } of users) {
      try {
        await this.aggregateUser(userId, currentMonthYear, now);
        succeeded++;
      } catch (err) {
        this.logger.error(
          `[${job.id}] Aggregation failed for userId=${userId}`,
          err instanceof Error ? err.stack : err,
        );
        failed++;
      }
    }

    this.logger.log(
      `[${job.id}] Aggregation complete — succeeded: ${succeeded}, failed: ${failed}`,
    );

    if (failed > 0) {
      throw new Error(
        `Analytics aggregation completed with ${failed} failure(s). Succeeded: ${succeeded}.`,
      );
    }
  }

  private async aggregateUser(
    userId: string,
    currentMonthYear: string,
    now: ReturnType<typeof dayjs>,
  ): Promise<void> {
    const monthStart = now.startOf('month').toDate();
    const monthEnd = now.endOf('month').toDate();

    // ── Step 1,2: ONE groupBy for topCategories + budgetUtilisation.spent and budgets───────
    // Ordering by sum(amount) desc avoids a second sort when slicing top 10.
    const [categorySpend, budgets] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.budget.findMany({
        where: { userId, deactivatedAt: null },
        select: {
          amount: true,
          categoryId: true,
          category: { select: { slug: true } },
        },
      }),
    ]);

    // ── Step 3: category slug map for topCategories ───────────────────────────
    // topCategories may include categories not tied to any budget, so we fetch
    // slugs for all spend category IDs rather than relying on the budget join.
    const spendCategoryIds = categorySpend.map((r) => r.categoryId);
    const categories =
      spendCategoryIds.length > 0
        ? await this.prisma.category.findMany({
            where: { id: { in: spendCategoryIds } },
            select: { id: true, slug: true },
          })
        : [];
    const slugMap = new Map(categories.map((c) => [c.id, c.slug]));

    const topCategories = categorySpend.slice(0, 10).map((row) => ({
      slug: slugMap.get(row.categoryId) ?? row.categoryId,
      total: row._sum.amount ?? 0,
      transactionCount: row._count._all,
    }));

    // ── Step 4: budget utilisation — no extra query, reuse categorySpend ──────
    const spendByCategory = new Map(
      categorySpend.map((r) => [r.categoryId, r._sum.amount ?? 0]),
    );
    const budgetUtilisation = budgets.map((b) => {
      const spent = spendByCategory.get(b.categoryId) ?? 0;
      return {
        categorySlug: b.category.slug,
        budgeted: b.amount,
        spent,
        pct: b.amount > 0 ? spent / b.amount : 0,
      };
    });

    // ── Step 5: goal progress — single groupBy across all active goals ────────
    const goals = await this.prisma.goal.findMany({
      where: { userId, status: Goalstatus.ACTIVE },
      select: { id: true, targetAmount: true },
    });

    let goalProgress: AnalyticsSnapshotData['goalProgress'] = [];
    if (goals.length > 0) {
      const contributions = await this.prisma.goalContribution.groupBy({
        by: ['goalId'],
        where: { goalId: { in: goals.map((g) => g.id) } },
        _sum: { amount: true },
      });
      const savedMap = new Map(
        contributions.map((c) => [c.goalId, c._sum.amount ?? 0]),
      );
      goalProgress = goals.map((g) => {
        const savedAmount = savedMap.get(g.id) ?? 0;
        return {
          goalId: g.id,
          targetAmount: g.targetAmount,
          savedAmount,
          pct: g.targetAmount > 0 ? savedAmount / g.targetAmount : 0,
        };
      });
    }

    // ── Step 6: upsert monthly snapshot ───────────────────────────────────────
    const data: AnalyticsSnapshotData = {
      topCategories,
      budgetUtilisation,
      goalProgress,
    };

    await this.prisma.analyticsSnapshot.upsert({
      where: {
        userId_period_type: {
          userId,
          period: currentMonthYear,
          type: SnapshotType.MONTHLY_SUMMARY,
        },
      },
      create: {
        userId,
        period: currentMonthYear,
        type: SnapshotType.MONTHLY_SUMMARY,
        data: data as unknown as Prisma.InputJsonValue,
      },
      update: {
        data: data as unknown as Prisma.InputJsonValue,
        computedAt: new Date(),
      },
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[${job.id}] Analytics aggregation job completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `[${job.id}] Analytics aggregation job failed`,
      error.stack,
    );
  }
}
