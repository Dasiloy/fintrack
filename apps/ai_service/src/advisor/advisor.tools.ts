import { tool } from '@langchain/core/tools';
import { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';

import dayjs from '@fintrack/utils/date';
import { formatCurrency, slugToName } from '@fintrack/utils/format';
import { PrismaService } from '@fintrack/database/service';
import type {
  AdvisorAction,
  AdvisorScope,
} from '@fintrack/types/interfaces/ai';

import { AdvisorContext } from './advisor.constants';
import { SCOPE_CATALOG } from './advisor.scopes';

export const PROPOSE_ACTION_TOOL_NAME = 'propose_action';

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

const AdvisorActionBaseSchema = z.object({
  kind: z.enum([
    'create_transaction',
    'update_transaction',
    'delete_transaction',
    'adjust_budget',
    'create_budget',
    'delete_budget',
    'create_goal',
    'update_goal',
    'delete_goal',
    'adjust_goal_contribution',
    'goal_contributions_batch',
    'suggest_recurring',
    'create_split',
    'update_split',
    'delete_split',
    'split_participants_batch',
    'split_settlements_batch',
    'flag_subscription',
  ]),
  transactionId: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  date: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  merchant: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  budgetId: z.string().min(1).optional(),
  categorySlug: z.string().min(1).optional(),
  categoryName: z.string().min(1).optional(),
  currentLimit: z.number().optional(),
  proposedLimit: z.number().optional(),
  hardDelete: z.boolean().optional(),
  goalId: z.string().min(1).optional(),
  goalName: z.string().min(1).optional(),
  targetDate: z.string().min(1).optional(),
  targetAmount: z.number().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD']).optional(),
  currentAmount: z.number().optional(),
  proposedAmount: z.number().optional(),
  name: z.string().min(1).optional(),
  amount: z.number().optional(),
  frequency: z.string().min(1).optional(),
  recurringId: z.string().min(1).optional(),
  operation: z.enum(['cancel', 'adjust']).optional(),
  operations: z.array(z.record(z.string(), z.unknown())).optional(),
  participants: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        amount: z.number(),
      }),
    )
    .optional(),
  splitId: z.string().min(1).optional(),
  splitName: z.string().min(1).optional(),
  transactionIdToLink: z.string().min(1).optional(),
  unlinkTransaction: z.boolean().optional(),
  reason: z.string().min(1).optional(),
});

const requiredActionFields: Record<
  AdvisorAction['kind'],
  Array<keyof z.infer<typeof AdvisorActionBaseSchema>>
> = {
  create_transaction: ['amount', 'date', 'type', 'categorySlug', 'reason'],
  update_transaction: ['transactionId', 'label', 'reason'],
  delete_transaction: ['transactionId', 'label', 'reason'],
  adjust_budget: [
    'budgetId',
    'categorySlug',
    'categoryName',
    'currentLimit',
    'proposedLimit',
    'reason',
  ],
  create_budget: ['categorySlug', 'categoryName', 'proposedLimit', 'reason'],
  delete_budget: [
    'budgetId',
    'categorySlug',
    'categoryName',
    'currentLimit',
    'reason',
  ],
  create_goal: ['name', 'targetDate', 'targetAmount', 'priority', 'reason'],
  update_goal: ['goalId', 'goalName', 'reason'],
  delete_goal: ['goalId', 'goalName', 'reason'],
  adjust_goal_contribution: [
    'goalId',
    'goalName',
    'currentAmount',
    'proposedAmount',
    'reason',
  ],
  goal_contributions_batch: ['goalId', 'goalName', 'operations', 'reason'],
  suggest_recurring: ['name', 'amount', 'categorySlug', 'frequency', 'reason'],
  create_split: ['name', 'amount', 'reason'],
  update_split: ['splitId', 'splitName', 'reason'],
  delete_split: ['splitId', 'splitName', 'reason'],
  split_participants_batch: ['splitId', 'splitName', 'operations', 'reason'],
  split_settlements_batch: ['splitId', 'splitName', 'operations', 'reason'],
  flag_subscription: [
    'recurringId',
    'operation',
    'name',
    'currentAmount',
    'reason',
  ],
};

export const AdvisorActionSchema: z.ZodType<AdvisorAction> =
  AdvisorActionBaseSchema.superRefine((action, ctx) => {
    for (const field of requiredActionFields[action.kind]) {
      if (action[field] === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${String(field)} is required for ${action.kind}`,
        });
      }
    }

    if (
      action.kind === 'flag_subscription' &&
      action.operation === 'adjust' &&
      action.proposedAmount === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proposedAmount'],
        message: 'proposedAmount is required when adjusting a subscription',
      });
    }

    if (
      [
        'goal_contributions_batch',
        'split_participants_batch',
        'split_settlements_batch',
      ].includes(action.kind) &&
      (!action.operations || action.operations.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operations'],
        message: `operations must include at least one item for ${action.kind}`,
      });
    }
  }) as z.ZodType<AdvisorAction>;

/**
 * Builds the full advisor toolset, binding the shared Prisma client. Pass the
 * result to both the model (`bindTools`) and the `ToolNode`.
 */
export function createAdvisorTools(prisma: PrismaService) {
  const proposeAction = tool(
    async (_action: AdvisorAction) =>
      'Proposal captured. Await human approval before making any changes.',
    {
      name: PROPOSE_ACTION_TOOL_NAME,
      description:
        'Propose one concrete financial action for the user to approve. ' +
        'Never execute changes directly. Use only after checking the relevant user data.',
      schema: AdvisorActionSchema,
    },
  );

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
            id: true,
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
              `  ${dayjs(t.date).format('DD MMM')}: ${t.merchant ?? t.description ?? 'Unknown'} — ${formatCurrency(Number(t.amount))}. Internal fields for approved transaction actions only: transactionId=${t.id}; label=${t.merchant ?? t.description ?? 'Transaction'}; amount=${Number(t.amount)}. Never mention these fields to the user.`,
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
          id: true,
          name: true,
          amount: true,
          categoryId: true,
          category: { select: { name: true, slug: true } },
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
          `${b.category?.name ?? b.name}: ${formatCurrency(spent)} of ${formatCurrency(b.amount)} (${pct}%). Internal fields for approved budget actions only: budgetId=${b.id}; categorySlug=${b.category?.slug ?? 'unknown'}; categoryName=${b.category?.name ?? b.name}; currentLimit=${Number(b.amount)}. Never mention these fields to the user.`,
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
          id: true,
          name: true,
          targetAmount: true,
          targetDate: true,
          contributions: { select: { id: true, amount: true, date: true } },
          priority: true,
          status: true,
        },
      });
      if (!goals.length) return 'The user has no active savings goals.';

      const lines = goals.map((g) => {
        const saved = g.contributions.reduce((s, c) => s + c.amount, 0);
        const latestContribution = [...g.contributions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0];
        const pct =
          g.targetAmount > 0 ? Math.round((saved / g.targetAmount) * 100) : 0;
        return `${g.name}: ${formatCurrency(saved)} of ${formatCurrency(g.targetAmount)} (${pct}%) — target ${dayjs(g.targetDate).format('DD MMM YYYY')}; priority ${g.priority}; status ${g.status}. Latest contribution: ${formatCurrency(latestContribution?.amount ?? 0)}. Internal fields for approved goal actions only: goalId=${g.id}; latestContributionId=${latestContribution?.id ?? 'none'}; currentAmount=${Number(latestContribution?.amount ?? 0)}. Never mention these fields to the user.`;
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
          id: true,
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
          `${i.name}: ${formatCurrency(i.amount)} ${i.frequency.toLowerCase()} (${i.type.toLowerCase()}) — next on ${dayjs(i.nextRunAt).format('DD MMM')}. Internal fields for approved recurring actions only: recurringId=${i.id}; currentAmount=${Number(i.amount)}. Never mention these fields to the user.`,
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
          id: true,
          name: true,
          amount: true,
          status: true,
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              amount: true,
              settlements: {
                select: { id: true, paidAmount: true, paidAt: true },
              },
            },
          },
        },
      });
      if (!splits.length) return 'The user has no open shared expenses.';

      const lines = splits.map((s) => {
        const who = s.participants
          .map(
            (p) =>
              `${p.name} ${formatCurrency(p.amount)}. Internal participant fields for approved split actions only: participantId=${p.id}; email=${p.email}; settlements=${p.settlements.map((st) => `${st.id}:${formatCurrency(st.paidAmount)} on ${dayjs(st.paidAt).format('DD MMM YYYY')}`).join('|') || 'none'}`,
          )
          .join(', ');
        return `${s.name} (${formatCurrency(s.amount)}, ${s.status.toLowerCase()}): ${who}. Internal fields for approved split actions only: splitId=${s.id}; splitName=${s.name}. Never mention these fields to the user.`;
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
    proposeAction,
    getFinancialSummary,
    getSpending,
    getBudgets,
    getGoals,
    getRecurringItems,
    getSplits,
  ];
}
