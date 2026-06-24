import { tool } from '@langchain/core/tools';
import { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';

import dayjs from '@fintrack/utils/date';
import { formatCurrency, slugToName } from '@fintrack/utils/format';
import { PrismaService } from '@fintrack/database/service';

import { AdvisorScope } from '@fintrack/database/types';
import { AdvisorContext } from './advisor.constants';
import { SCOPE_CATALOG } from './advisor.scopes';

/**
 * Advisor Postgres tools — the ONLY path by which the advisor reaches the
 * database. Each tool reads the user's own data directly from Prisma and is
 * wrapped by {@link withScope} so it runs only when the user has granted the
 * matching scope.
 *
 * ## Context, not arguments
 * `userId` is never a tool parameter — it is read from the per-run context
 * (`config.context.userId`), so an LLM can never point a tool at another user's
 * data. `grantedScopes` is read from the same context for enforcement.
 *
 * ## Permission handling (Phase 6)
 * When a scope is not granted, the tool returns a `PERMISSION_REQUIRED:` string
 * the model relays gracefully ("you can enable X in settings"). Phase 11 swaps
 * this for an inline `interrupt()` Allow/Deny prompt using the same scope check.
 */

/** Reads and validates the per-run advisor context from a tool's config. */
function readContext(config?: RunnableConfig): AdvisorContext {
  const ctx = (config as { context?: AdvisorContext } | undefined)?.context;
  if (!ctx?.userId) {
    throw new Error('advisor tool: userId missing from run context');
  }
  return ctx;
}

/**
 * Gates a tool implementation behind a granted scope. If granted, runs `fn`
 * with the resolved context; otherwise returns a permission-required message
 * for the model to relay (no database access happens).
 */
function withScope<A>(
  scope: AdvisorScope,
  fn: (args: A, ctx: AdvisorContext) => Promise<string>,
): (args: A, config?: RunnableConfig) => Promise<string> {
  return async (args, config) => {
    const ctx = readContext(config);
    if (!ctx.grantedScopes?.includes(scope)) {
      return (
        `PERMISSION_REQUIRED: This needs access to "${SCOPE_CATALOG[scope].label}", ` +
        `which the user has not enabled. Tell the user they can turn on ` +
        `${SCOPE_CATALOG[scope].label} in the advisor permissions panel to use this.`
      );
    }
    return fn(args, ctx);
  };
}

const MonthYearSchema = z.object({
  month: z.number().int().min(1).max(12).describe('Month number, 1-12'),
  year: z.number().int().describe('4-digit year'),
});

const GetSpendingSchema = z.object({
  ...MonthYearSchema.shape,
  categorySlug: z
    .string()
    .optional()
    .describe('Optional category slug to focus on (e.g. "food")'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe('Max expenses to scan (default 100)'),
});

/**
 * Builds the full advisor toolset, binding the shared Prisma client. Pass the
 * result to both the model (`bindTools`) and the `ToolNode`.
 */
export function createAdvisorTools(prisma: PrismaService) {
  // ── ANALYTICS ───────────────────────────────────────────────────────────────
  const getFinancialSummary = tool(
    withScope('ANALYTICS', async (_args, ctx) => {
      const balance = await prisma.userBalance.findUnique({
        where: { userId: ctx.userId },
      });
      if (!balance) return 'No balance data is available for this user yet.';

      const income = Number(balance.monthlyIncome);
      const expense = Number(balance.monthlyExpense);
      const savingsRate =
        income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

      return [
        `Financial summary for ${balance.monthYear} (current month so far):`,
        `Income: ${formatCurrency(income)}`,
        `Spending: ${formatCurrency(expense)}`,
        `Net this month: ${formatCurrency(income - expense)}`,
        `Savings rate: ${savingsRate}%`,
        `Overall net balance: ${formatCurrency(Number(balance.netBalance))}`,
      ].join('\n');
    }),
    {
      name: 'get_financial_summary',
      description:
        "Get the user's income, spending, savings rate, and net balance for the " +
        'current month. Use for "how am I doing", "am I saving enough", and overall checks.',
      schema: z.object({}),
    },
  );

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────────
  const getSpending = tool(
    withScope<z.infer<typeof GetSpendingSchema>>(
      'TRANSACTIONS',
      async ({ month, year, categorySlug, limit = 100 }, ctx) => {
        const from = dayjs()
          .year(year)
          .month(month - 1)
          .startOf('month')
          .toDate();
        const to = dayjs()
          .year(year)
          .month(month - 1)
          .endOf('month')
          .toDate();

        const txs = await prisma.transaction.findMany({
          where: {
            userId: ctx.userId,
            type: 'EXPENSE',
            date: { gte: from, lte: to },
            ...(categorySlug ? { category: { slug: categorySlug } } : {}),
          },
          orderBy: { amount: 'desc' },
          take: limit,
          select: {
            amount: true,
            date: true,
            merchant: true,
            description: true,
            category: { select: { name: true, slug: true } },
          },
        });

        const label = dayjs(from).format('MMMM YYYY');
        if (!txs.length) return `No spending recorded for ${label}.`;

        const byCat = new Map<string, number>();
        for (const t of txs) {
          const key =
            t.category?.name ?? slugToName(t.category?.slug ?? 'uncategorised');
          byCat.set(key, (byCat.get(key) ?? 0) + Number(t.amount));
        }
        const sortedCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
        const total = sortedCats.reduce((s, [, v]) => s + v, 0);

        const topExpenses = txs
          .slice(0, 8)
          .map(
            (t) =>
              `  ${dayjs(t.date).format('DD MMM')}: ${t.merchant ?? t.description ?? 'Unknown'} — ${formatCurrency(Number(t.amount))}`,
          );

        return [
          `Spending for ${label} — total ${formatCurrency(total)}:`,
          'By category:',
          ...sortedCats.map(([c, v]) => `  ${c}: ${formatCurrency(v)}`),
          '',
          'Largest expenses:',
          ...topExpenses,
        ].join('\n');
      },
    ),
    {
      name: 'get_spending',
      description:
        "Get the user's expenses for a month, totalled by category with the " +
        'largest individual expenses. Pass categorySlug to focus on one category ' +
        '(e.g. "what did I spend on food").',
      schema: GetSpendingSchema,
    },
  );

  // ── BUDGETS ───────────────────────────────────────────────────────────────────
  const getBudgets = tool(
    withScope('BUDGETS', async (_args, ctx) => {
      const budgets = await prisma.budget.findMany({
        where: { userId: ctx.userId, deactivatedAt: null },
        select: {
          name: true,
          amount: true,
          categoryId: true,
          category: { select: { name: true } },
        },
      });
      if (!budgets.length) return 'The user has no active budgets.';

      const from = dayjs().startOf('month').toDate();
      const to = dayjs().endOf('month').toDate();

      const lines: string[] = [];
      for (const b of budgets) {
        const spentAgg = await prisma.transaction.aggregate({
          where: {
            userId: ctx.userId,
            type: 'EXPENSE',
            categoryId: b.categoryId,
            date: { gte: from, lte: to },
          },
          _sum: { amount: true },
        });
        const spent = Number(spentAgg._sum.amount ?? 0);
        const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
        lines.push(
          `${b.category?.name ?? b.name}: ${formatCurrency(spent)} of ${formatCurrency(b.amount)} (${pct}%)`,
        );
      }

      return ['Budgets this month:', ...lines].join('\n');
    }),
    {
      name: 'get_budgets',
      description:
        "Get the user's active budgets with this month's spend and utilisation " +
        'percentage. Use for "how are my budgets" or "which am I close to hitting".',
      schema: z.object({}),
    },
  );

  // ── GOALS ─────────────────────────────────────────────────────────────────────
  const getGoals = tool(
    withScope('GOALS', async (_args, ctx) => {
      const goals = await prisma.goal.findMany({
        where: { userId: ctx.userId, status: 'ACTIVE' },
        select: {
          name: true,
          targetAmount: true,
          targetDate: true,
          contributions: { select: { amount: true } },
        },
      });
      if (!goals.length) return 'The user has no active savings goals.';

      const lines = goals.map((g) => {
        const saved = g.contributions.reduce((s, c) => s + c.amount, 0);
        const pct =
          g.targetAmount > 0 ? Math.round((saved / g.targetAmount) * 100) : 0;
        return `${g.name}: ${formatCurrency(saved)} of ${formatCurrency(g.targetAmount)} (${pct}%) — target ${dayjs(g.targetDate).format('DD MMM YYYY')}`;
      });

      return ['Savings goals:', ...lines].join('\n');
    }),
    {
      name: 'get_goals',
      description:
        "Get the user's active savings goals with amount saved, percentage, and " +
        'target date. Use for "am I on track for my goal".',
      schema: z.object({}),
    },
  );

  // ── RECURRING ───────────────────────────────────────────────────────────────────
  const getRecurringItems = tool(
    withScope('RECURRING', async (_args, ctx) => {
      const items = await prisma.recurringItem.findMany({
        where: { userId: ctx.userId, isActive: true },
        orderBy: { nextRunAt: 'asc' },
        select: {
          name: true,
          amount: true,
          type: true,
          frequency: true,
          nextRunAt: true,
        },
      });
      if (!items.length) return 'The user has no active recurring items.';

      const lines = items.map(
        (i) =>
          `${i.name}: ${formatCurrency(i.amount)} ${i.frequency.toLowerCase()} (${i.type.toLowerCase()}) — next on ${dayjs(i.nextRunAt).format('DD MMM')}`,
      );

      return ['Recurring items:', ...lines].join('\n');
    }),
    {
      name: 'get_recurring_items',
      description:
        "Get the user's active recurring bills and income with amount, frequency, " +
        'and next run date. Use for "what bills are coming up".',
      schema: z.object({}),
    },
  );

  // ── SPLITS ──────────────────────────────────────────────────────────────────────
  const getSplits = tool(
    withScope('SPLITS', async (_args, ctx) => {
      const splits = await prisma.split.findMany({
        where: {
          userId: ctx.userId,
          status: { in: ['OPEN', 'PARTIALLY_SETTLED'] },
        },
        select: {
          name: true,
          amount: true,
          status: true,
          participants: { select: { name: true, amount: true } },
        },
      });
      if (!splits.length) return 'The user has no open shared expenses.';

      const lines = splits.map((s) => {
        const who = s.participants
          .map((p) => `${p.name} ${formatCurrency(p.amount)}`)
          .join(', ');
        return `${s.name} (${formatCurrency(s.amount)}, ${s.status.toLowerCase()}): ${who}`;
      });

      return ['Open shared expenses:', ...lines].join('\n');
    }),
    {
      name: 'get_splits',
      description:
        "Get the user's open shared expenses (splits) with each participant's " +
        'outstanding amount. Use for "who owes me money".',
      schema: z.object({}),
    },
  );

  return [
    getFinancialSummary,
    getSpending,
    getBudgets,
    getGoals,
    getRecurringItems,
    getSplits,
  ];
}
