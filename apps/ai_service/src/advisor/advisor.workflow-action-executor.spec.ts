jest.mock('@fintrack/database/service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('@fintrack/database/types', () => ({}));
jest.mock('@fintrack/types/protos/ai/ai', () => ({}));
jest.mock('@fintrack/types/protos/finance/finance', () => ({
  FINANCE_PACKAGE_NAME: 'finance',
  FINANCE_SERVICE_NAME: 'FinanceService',
}));
jest.mock('@fintrack/types/constants/redis.costants', () => ({
  REDIS_CLIENT: 'REDIS_CLIENT',
}));
jest.mock('@fintrack/types/constants/plan.constants', () => ({
  PLAN_LIMITS: {
    FREE: {
      MAX_BUDGETS: 5,
      MAX_RECURRING_ITEMS: 5,
    },
    PRO: {
      MAX_BUDGETS: Infinity,
      MAX_RECURRING_ITEMS: Infinity,
    },
  },
}));
jest.mock('@fintrack/utils/date', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    month: () => 6,
    year: () => 2026,
    toISOString: () => '2026-06-25T00:00:00.000Z',
  })),
}));
jest.mock('@fintrack/utils/format', () => ({
  formatCurrency: (value: number) => `₦${value}`,
  slugToName: (slug: string) => slug,
}));

import { AdvisorWorkflowActionExecutor } from './advisor.workflow-action-executor';
import { of } from 'rxjs';

describe('AdvisorWorkflowActionExecutor', () => {
  const budgetCandidate = {
    candidateId: 'workflow-run-1-candidate-1',
    action: {
      kind: 'adjust_budget' as const,
      budgetId: 'budget-1',
      categorySlug: 'food',
      categoryName: 'Food',
      currentLimit: 40000,
      proposedLimit: 55000,
      reason: 'Workflow candidate approved by the user.',
    },
  };

  const createBudgetCandidate = {
    candidateId: 'workflow-run-1-candidate-4',
    action: {
      kind: 'create_budget' as const,
      categorySlug: 'transport',
      categoryName: 'Transport',
      proposedLimit: 80000,
      reason: 'Workflow candidate approved by the user.',
    },
  };

  const recurringCandidate = {
    candidateId: 'workflow-run-1-candidate-2',
    action: {
      kind: 'suggest_recurring' as const,
      name: 'Spectranet',
      amount: 18000,
      categorySlug: 'bills-utilities',
      frequency: 'MONTHLY',
      reason: 'Workflow candidate approved by the user.',
    },
  };

  const makeExecutor = (
    userUsage: {
      subscription?: { plan: 'FREE' | 'PRO'; status: string } | null;
      count?: { budgets?: number; recurringItems?: number };
    } = {},
  ) => {
    const financeService = {
      batchBudgetWorkflowActions: jest.fn(),
      batchRecurringWorkflowActions: jest.fn(),
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          subscription: userUsage.subscription ?? {
            plan: 'PRO',
            status: 'ACTIVE',
          },
          _count: {
            budgets: userUsage.count?.budgets ?? 0,
            recurringItems: userUsage.count?.recurringItems ?? 0,
          },
        }),
      },
    };
    const executor = new AdvisorWorkflowActionExecutor(
      prisma as never,
      {
        getService: jest.fn(() => financeService),
      } as never,
    );
    executor.onModuleInit();
    return { executor, financeService, prisma };
  };

  it('executes budget candidates through the finance atomic batch endpoint', async () => {
    const { executor, financeService } = makeExecutor();
    financeService.batchBudgetWorkflowActions.mockReturnValue(
      of({
        status: 'executed',
        atomic: true,
        message: 'Applied 2 budget workflow changes.',
        candidateResults: [
          {
            candidateId: 'workflow-run-1-candidate-1',
            status: 'approved',
            message: 'Budget workflow change applied.',
          },
          {
            candidateId: 'workflow-run-1-candidate-3',
            status: 'approved',
            message: 'Budget workflow change applied.',
          },
        ],
      }),
    );

    const secondBudgetCandidate = {
      candidateId: 'workflow-run-1-candidate-3',
      action: {
        ...budgetCandidate.action,
        budgetId: 'budget-2',
        categorySlug: 'transport',
        categoryName: 'Transport',
      },
    };
    const result = await executor.executeAtomicBatch(
      [budgetCandidate, secondBudgetCandidate],
      { userId: 'user-1' },
    );

    expect(financeService.batchBudgetWorkflowActions).toHaveBeenCalledWith(
      {
        operations: [
          {
            candidateId: 'workflow-run-1-candidate-1',
            kind: 'adjust_budget',
            updateBudget: {
              id: 'budget-1',
              amount: 55000,
              month: 6,
              year: 2026,
            },
          },
          {
            candidateId: 'workflow-run-1-candidate-3',
            kind: 'adjust_budget',
            updateBudget: {
              id: 'budget-2',
              amount: 55000,
              month: 6,
              year: 2026,
            },
          },
        ],
      },
      expect.objectContaining({}),
    );
    expect(result).toEqual({
      status: 'executed',
      atomic: true,
      message: 'Applied 2 budget workflow changes.',
      candidateResults: [
        {
          candidateId: 'workflow-run-1-candidate-1',
          status: 'approved',
          message: 'Budget workflow change applied.',
        },
        {
          candidateId: 'workflow-run-1-candidate-3',
          status: 'approved',
          message: 'Budget workflow change applied.',
        },
      ],
    });
  });

  it('rejects mixed-domain batches before any write executes', async () => {
    const { executor, financeService } = makeExecutor();

    const result = await executor.executeAtomicBatch(
      [budgetCandidate, recurringCandidate],
      { userId: 'user-1' },
    );

    expect(financeService.batchBudgetWorkflowActions).not.toHaveBeenCalled();
    expect(financeService.batchRecurringWorkflowActions).not.toHaveBeenCalled();
    expect(result.status).toBe('execution_failed');
    expect(result.candidateResults).toEqual([
      expect.objectContaining({
        candidateId: 'workflow-run-1-candidate-1',
        status: 'failed',
      }),
      expect.objectContaining({
        candidateId: 'workflow-run-1-candidate-2',
        status: 'failed',
      }),
    ]);
  });

  it('executes recurring candidates through the finance atomic batch endpoint', async () => {
    const { executor, financeService } = makeExecutor();
    financeService.batchRecurringWorkflowActions.mockReturnValue(
      of({
        status: 'executed',
        atomic: true,
        message: 'Applied 1 recurring workflow change.',
        candidateResults: [
          {
            candidateId: 'workflow-run-1-candidate-2',
            status: 'approved',
            message: 'Recurring workflow change applied.',
          },
        ],
      }),
    );

    const result = await executor.executeAtomicBatch([recurringCandidate], {
      userId: 'user-1',
    });

    expect(financeService.batchRecurringWorkflowActions).toHaveBeenCalledWith(
      {
        operations: [
          {
            candidateId: 'workflow-run-1-candidate-2',
            kind: 'suggest_recurring',
            createRecurring: {
              name: 'Spectranet',
              amount: 18000,
              frequency: 'MONTHLY',
              type: 'EXPENSE',
              startDate: '2026-06-25T00:00:00.000Z',
              categorySlug: 'cat-bills-utilities',
              description: 'Workflow candidate approved by the user.',
            },
          },
        ],
      },
      expect.objectContaining({}),
    );
    expect(result).toEqual({
      status: 'executed',
      atomic: true,
      message: 'Applied 1 recurring workflow change.',
      candidateResults: [
        {
          candidateId: 'workflow-run-1-candidate-2',
          status: 'approved',
          message: 'Recurring workflow change applied.',
        },
      ],
    });
  });

  it('blocks workflow budget creates when the free plan budget limit would be exceeded', async () => {
    const { executor, financeService } = makeExecutor({
      subscription: { plan: 'FREE', status: 'ACTIVE' },
      count: { budgets: 5 },
    });

    const result = await executor.executeAtomicBatch([createBudgetCandidate], {
      userId: 'user-1',
    });

    expect(financeService.batchBudgetWorkflowActions).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'execution_failed',
      atomic: true,
      message:
        'You cannot approve these workflow changes because your Free plan budget limit has been reached. Please upgrade to Pro to add more.',
      candidateResults: [
        {
          candidateId: 'workflow-run-1-candidate-4',
          status: 'failed',
          message:
            'You cannot approve these workflow changes because your Free plan budget limit has been reached. Please upgrade to Pro to add more.',
        },
      ],
    });
  });

  it('blocks workflow recurring creates when selected candidates exceed remaining free slots', async () => {
    const { executor, financeService } = makeExecutor({
      subscription: { plan: 'FREE', status: 'ACTIVE' },
      count: { recurringItems: 4 },
    });
    const secondRecurringCandidate = {
      candidateId: 'workflow-run-1-candidate-5',
      action: {
        ...recurringCandidate.action,
        name: 'DSTV',
      },
    };

    const result = await executor.executeAtomicBatch(
      [recurringCandidate, secondRecurringCandidate],
      { userId: 'user-1' },
    );

    expect(financeService.batchRecurringWorkflowActions).not.toHaveBeenCalled();
    expect(result.status).toBe('execution_failed');
    expect(result.message).toBe(
      'You can only approve 1 new recurring item on your Free plan, but this workflow selected 2. Please reduce the selection or upgrade to Pro.',
    );
    expect(result.candidateResults).toEqual([
      {
        candidateId: 'workflow-run-1-candidate-2',
        status: 'failed',
        message:
          'You can only approve 1 new recurring item on your Free plan, but this workflow selected 2. Please reduce the selection or upgrade to Pro.',
      },
      {
        candidateId: 'workflow-run-1-candidate-5',
        status: 'failed',
        message:
          'You can only approve 1 new recurring item on your Free plan, but this workflow selected 2. Please reduce the selection or upgrade to Pro.',
      },
    ]);
  });

  it('rejects batches without a user context before any write executes', async () => {
    const { executor, financeService } = makeExecutor();

    const result = await executor.executeAtomicBatch([budgetCandidate], {
      userId: '',
    });

    expect(financeService.batchBudgetWorkflowActions).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'execution_failed',
      atomic: true,
      message:
        'I could not apply those workflow changes because the user context was missing. No financial changes were made.',
      candidateResults: [
        {
          candidateId: 'workflow-run-1-candidate-1',
          status: 'failed',
          message:
            'This selected change was not applied because the user context was missing.',
        },
      ],
    });
  });
});
