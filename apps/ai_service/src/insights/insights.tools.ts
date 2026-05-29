import { tool } from '@langchain/core/tools';
import { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';
import dayjs from '@fintrack/utils/date';
import { formatCurrency } from '@fintrack/utils/format';

import { PrismaService } from '@fintrack/database/service';

const FetchTransactionsSchema = z.object({
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .describe('Month number (1–12) to fetch transactions for'),
  year: z.number().int().describe('4-digit year'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .default(100)
    .describe('Maximum number of transactions to return (default 100)'),
  categorySlug: z
    .string()
    .optional()
    .describe('Filter to a specific spending category slug'),
});

function summariseTransactions(
  txs: Array<{
    amount: number;
    type: string;
    description: string | null;
    merchant: string | null;
    bankCategory: string | null;
    date: Date;
    categorySlug: string | null;
  }>,
): string {
  if (!txs.length) return 'No transactions found for the requested period.';

  const expenses = txs.filter((t) => t.type === 'EXPENSE');
  const incomes = txs.filter((t) => t.type === 'INCOME');

  const byCat = new Map<string, number>();
  for (const t of expenses) {
    const key = t.categorySlug ?? t.bankCategory ?? 'uncategorised';
    byCat.set(key, (byCat.get(key) ?? 0) + t.amount);
  }
  const sortedCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  const topExpenses = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(
      (t) =>
        `${dayjs(t.date).format('DD MMM')}: ${t.merchant ?? t.description ?? 'Unknown'} — ${formatCurrency(t.amount)}`,
    );

  return [
    `Total transactions: ${txs.length} (${expenses.length} expense, ${incomes.length} income)`,
    `Total expense: ${formatCurrency(expenses.reduce((s, t) => s + t.amount, 0))}`,
    `Total income: ${formatCurrency(incomes.reduce((s, t) => s + t.amount, 0))}`,
    '',
    'Spend by category:',
    ...sortedCats.map(([slug, total]) => `  ${slug}: ${formatCurrency(total)}`),
    '',
    'Top 10 individual expenses:',
    ...topExpenses,
  ].join('\n');
}

/**
 * Creates the transaction-fetching tool for the insights graph ToolNode.
 *
 * `prisma` is bound at graph-build time. `userId` is NOT a tool parameter —
 * it is read from `config.configurable.userId` at call time, which LangGraph
 * populates automatically from the graph invocation config.
 *
 * This ensures the tool can never be directed at another user's data even if
 * an LLM attempts to pass a different userId in the tool arguments.
 *
 * Usage in buildGraph():
 *   const txTool = createTransactionsTool(this.prisma);
 *   .addNode('tx_tools', new ToolNode([txTool]))
 *   // model nodes: decisionModel.bindTools([txTool])
 */
export function createTransactionsTool(prisma: PrismaService) {
  return tool(
    async (
      { month, year, limit = 100, categorySlug },
      config?: RunnableConfig,
    ) => {
      const userId = (config?.configurable as any)?.userId as
        | string
        | undefined;
      if (!userId)
        throw new Error(
          'fetch_transactions: userId missing from config.configurable',
        );

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

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: from, lte: to },
          ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        },
        orderBy: { date: 'desc' },
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          merchant: true,
          narration: true,
          bankCategory: true,
          date: true,
          source: true,
          category: { select: { slug: true, name: true } },
        },
      });

      const normalised = transactions.map((t) => ({
        ...t,
        categorySlug: t.category?.slug ?? null,
        amount: Number(t.amount),
      }));

      return summariseTransactions(normalised);
    },
    {
      name: 'fetch_transactions',
      description:
        "Fetches and summarises the user's transactions for a given month/year. " +
        'Returns spend totals by category and the top 10 individual expenses. ' +
        'Call this when you need raw transaction data to detect spending anomalies or patterns.',
      schema: FetchTransactionsSchema,
    },
  );
}
