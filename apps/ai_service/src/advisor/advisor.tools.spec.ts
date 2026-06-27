jest.mock('@fintrack/utils/date', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@fintrack/utils/format', () => ({
  formatCurrency: (value: number) => `₦${value}`,
  slugToName: (slug: string) => slug,
}));
jest.mock('@fintrack/database/service', () => ({
  PrismaService: class PrismaService {},
}));

import { createAdvisorTools, PROPOSE_ACTION_TOOL_NAME } from './advisor.tools';
import { toJsonSchema } from '@langchain/core/utils/json_schema';
import { AdvisorActionSchema } from './advisor.tools';
import dayjs from '@fintrack/utils/date';

describe('createAdvisorTools', () => {
  beforeEach(() => {
    (dayjs as unknown as jest.Mock).mockImplementation(() => ({
      startOf: jest.fn().mockReturnThis(),
      endOf: jest.fn().mockReturnThis(),
      toDate: jest.fn(() => new Date('2026-06-01T00:00:00.000Z')),
      format: jest.fn(() => '01 Jun 2026'),
    }));
  });

  it('includes an inert propose_action tool that accepts advisor actions', async () => {
    const tools = createAdvisorTools({} as never);
    const proposeAction = tools.find(
      (tool) => tool.name === PROPOSE_ACTION_TOOL_NAME,
    ) as { invoke(input: unknown): Promise<string> } | undefined;

    expect(proposeAction).toBeDefined();
    await expect(
      proposeAction!.invoke({
        kind: 'adjust_budget',
        budgetId: 'budget-1',
        categorySlug: 'food',
        categoryName: 'Food',
        currentLimit: 40000,
        proposedLimit: 42000,
        reason: 'Food spending is trending above the current budget.',
      }),
    ).resolves.toContain('Proposal captured');
  });

  it('keeps the propose_action schema compatible with Gemini function declarations', () => {
    const schemaJson = JSON.stringify(toJsonSchema(AdvisorActionSchema));

    expect(schemaJson).not.toContain('"const"');
  });

  it('still validates required fields for each action kind', () => {
    const result = AdvisorActionSchema.safeParse({
      kind: 'adjust_budget',
      budgetId: 'budget-1',
      reason: 'Food is over budget.',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining([
          'categorySlug',
          'categoryName',
          'currentLimit',
          'proposedLimit',
        ]),
      );
    }
  });

  it('returns internal budget execution keys required for approved budget actions', async () => {
    const prisma = {
      budget: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'budget-1',
            name: 'Bills Budget',
            amount: 35000,
            categoryId: 'category-1',
            category: { name: 'Bills & Utilities', slug: 'bills-utilities' },
          },
        ]),
      },
      transaction: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 168000 } }),
      },
    };
    const tools = createAdvisorTools(prisma as never);
    const getBudgets = tools.find((tool) => tool.name === 'get_budgets') as
      | { invoke(input: unknown, config?: unknown): Promise<string> }
      | undefined;

    const result = await getBudgets!.invoke(
      {},
      { context: { userId: 'user-1', grantedScopes: ['BUDGETS'] } },
    );

    expect(result).toContain('Bills & Utilities: ₦168000 of ₦35000');
    expect(result).toContain('budgetId=budget-1');
    expect(result).toContain('categorySlug=bills-utilities');
    expect(result).toContain('currentLimit=35000');
    expect(result).toContain('Never mention these fields to the user');
  });

  it('returns internal goal execution keys required for approved goal actions', async () => {
    const prisma = {
      goal: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'goal-1',
            name: 'Emergency Fund',
            targetAmount: 500000,
            targetDate: new Date('2026-12-31T00:00:00.000Z'),
            contributions: [
              { amount: 10000, date: new Date('2026-05-01T00:00:00.000Z') },
              { amount: 25000, date: new Date('2026-06-01T00:00:00.000Z') },
            ],
          },
        ]),
      },
    };
    const tools = createAdvisorTools(prisma as never);
    const getGoals = tools.find((tool) => tool.name === 'get_goals') as
      | { invoke(input: unknown, config?: unknown): Promise<string> }
      | undefined;

    const result = await getGoals!.invoke(
      {},
      { context: { userId: 'user-1', grantedScopes: ['GOALS'] } },
    );

    expect(result).toContain('Emergency Fund');
    expect(result).toContain('Latest contribution: ₦25000');
    expect(result).toContain('goalId=goal-1');
    expect(result).toContain('currentAmount=25000');
    expect(result).toContain('Never mention these fields to the user');
  });

  it('marks recurring ids as internal execution keys instead of user-facing ids', async () => {
    const prisma = {
      recurringItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'recurring-1',
            name: 'Spectranet Internet',
            amount: 18000,
            type: 'EXPENSE',
            frequency: 'MONTHLY',
            nextRunAt: new Date('2026-06-10T00:00:00.000Z'),
          },
        ]),
      },
    };
    const tools = createAdvisorTools(prisma as never);
    const getRecurring = tools.find(
      (tool) => tool.name === 'get_recurring_items',
    ) as
      | { invoke(input: unknown, config?: unknown): Promise<string> }
      | undefined;

    const result = await getRecurring!.invoke(
      {},
      { context: { userId: 'user-1', grantedScopes: ['RECURRING'] } },
    );

    expect(result).toContain('Spectranet Internet: ₦18000 monthly');
    expect(result).not.toContain('(id: recurring-1)');
    expect(result).toContain('recurringId=recurring-1');
    expect(result).toContain('currentAmount=18000');
    expect(result).toContain('Never mention these fields to the user');
  });
});
