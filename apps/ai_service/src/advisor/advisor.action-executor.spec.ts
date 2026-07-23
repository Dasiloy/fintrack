jest.mock('@fintrack/types/protos/finance/finance', () => ({
  FINANCE_PACKAGE_NAME: 'finance',
  FINANCE_SERVICE_NAME: 'FinanceService',
}));
jest.mock('@fintrack/utils/date', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    month: () => 5,
    year: () => 2026,
    toISOString: () => '2026-06-25T00:00:00.000Z',
  })),
}));
jest.mock('@fintrack/utils/format', () => ({
  genTransactionSourceId: jest.fn(() => 'TXN-260625-ABC123'),
}));
jest.mock('@fintrack/types/constants/plan.constants', () => ({
  PLAN_LIMITS: {
    FREE: {
      MAX_BUDGETS: 5,
      MAX_RECURRING_ITEMS: 5,
      MAX_GOALS: 3,
      MAX_ACTIVE_SPLITS: 3,
      MAX_PEOPLE_PER_SPLIT: 3,
    },
    PRO: {
      MAX_BUDGETS: Infinity,
      MAX_RECURRING_ITEMS: Infinity,
      MAX_GOALS: Infinity,
      MAX_ACTIVE_SPLITS: Infinity,
      MAX_PEOPLE_PER_SPLIT: Infinity,
    },
  },
}));
jest.mock('@fintrack/database/service', () => ({
  PrismaService: class PrismaService {},
}));

import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { PLAN_LIMITS } from '@fintrack/types/constants/plan.constants';

import { AdvisorActionExecutor } from './advisor.action-executor';

describe('AdvisorActionExecutor', () => {
  function makePrismaUserFindUniqueResult(
    overrides: {
      subscription?: { plan: 'FREE' | 'PRO'; status: string } | null;
      count?: Record<string, number>;
    } = {},
  ) {
    return {
      subscription: overrides.subscription ?? {
        plan: 'PRO',
        status: 'ACTIVE',
      },
      _count: overrides.count ?? {},
    };
  }

  function makePrisma(
    result = makePrismaUserFindUniqueResult(),
    splitResult: unknown = null,
  ): {
    user: { findUnique: jest.Mock };
    split: { findFirst: jest.Mock };
  } {
    return {
      user: {
        findUnique: jest.fn(() => Promise.resolve(result)),
      },
      split: {
        findFirst: jest.fn(() => Promise.resolve(splitResult)),
      },
    };
  }

  function makeExecutor(
    financeService: Record<string, jest.Mock>,
    prisma = makePrisma(),
  ) {
    const financeClient = {
      getService: jest.fn(() => financeService),
    };
    const executor = new AdvisorActionExecutor(
      prisma as never,
      financeClient as never,
    );
    executor.onModuleInit();
    return { executor, financeClient, prisma };
  }

  it('updates an existing budget for adjust_budget actions', async () => {
    const financeService = {
      updateBudget: jest.fn(() =>
        of({
          id: 'budget-1',
          amount: 42000,
          name: 'Food',
        }),
      ),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'adjust_budget',
        budgetId: 'budget-1',
        categorySlug: 'food',
        categoryName: 'Food',
        currentLimit: 40000,
        proposedLimit: 42000,
        reason: 'Food spending is trending above the current budget.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Food budget updated to ₦42,000.',
    });
    expect(financeService.updateBudget).toHaveBeenCalledTimes(1);
    const [request, metadata] = financeService.updateBudget.mock
      .calls[0] as unknown as [unknown, Metadata];
    expect(request).toEqual({
      id: 'budget-1',
      amount: 42000,
      month: 5,
      year: 2026,
    });
    expect(metadata.get('x-user-id')).toEqual(['user-1']);
  });

  it('creates a manual transaction for create_transaction actions', async () => {
    const financeService = {
      createTransaction: jest.fn(() =>
        of({
          id: 'transaction-1',
          amount: '12000',
        }),
      ),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'create_transaction',
        amount: 12000,
        date: '2026-06-25',
        type: 'EXPENSE',
        categorySlug: 'food',
        categoryName: 'Food',
        merchant: 'Chicken Republic',
        reason: 'User asked to record lunch.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message:
        'Expense transaction created for ₦12,000 in Fintrack. This is a manual Fintrack record, so it does not change your bank account.',
    });
    expect(financeService.createTransaction).toHaveBeenCalledTimes(1);
    const [request, metadata] = financeService.createTransaction.mock
      .calls[0] as unknown as [Record<string, unknown>, Metadata];
    expect(request).toMatchObject({
      amount: '12000',
      date: '2026-06-25',
      type: 1,
      categorySlug: 'cat-food',
      source: 0,
      merchant: 'Chicken Republic',
      description: 'User asked to record lunch.',
    });
    expect(request.sourceId).toEqual(
      expect.stringMatching(/^TXN-260625-[0-9A-Z]{6}$/),
    );
    expect(metadata.get('x-user-id')).toEqual(['user-1']);
  });

  it('creates a new budget for create_budget actions', async () => {
    const financeService = {
      createBudget: jest.fn(() =>
        of({
          id: 'budget-2',
          amount: 42000,
          name: 'Food Budget',
        }),
      ),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'create_budget',
        categorySlug: 'food',
        categoryName: 'Food',
        proposedLimit: 42000,
        reason: 'Food spending needs its own guardrail.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Food budget created at ₦42,000.',
    });
    expect(financeService.createBudget).toHaveBeenCalledTimes(1);
    const [request, metadata] = financeService.createBudget.mock
      .calls[0] as unknown as [unknown, Metadata];
    expect(request).toEqual({
      name: 'Food Budget',
      amount: 42000,
      categorySlug: 'cat-food',
      description: 'Food spending needs its own guardrail.',
      month: 5,
      year: 2026,
    });
    expect(metadata.get('x-user-id')).toEqual(['user-1']);
  });

  it('blocks free users from creating budgets after reaching the budget limit', async () => {
    const financeService = {
      createBudget: jest.fn(),
    };
    const prisma = makePrisma(
      makePrismaUserFindUniqueResult({
        subscription: { plan: 'FREE', status: 'ACTIVE' },
        count: { budgets: PLAN_LIMITS.FREE.MAX_BUDGETS as number },
      }),
    );
    const { executor } = makeExecutor(financeService, prisma);

    await expect(
      executor.execute(
        {
          kind: 'create_budget',
          categorySlug: 'food',
          categoryName: 'Food',
          proposedLimit: 42000,
          reason: 'Food spending needs its own guardrail.',
        },
        { userId: 'user-1' },
      ),
    ).resolves.toEqual({
      status: 'execution_failed',
      message:
        'You cannot create a new budget because your Free plan budget limit has been reached. Please upgrade to Pro to add more.',
    });
    expect(financeService.createBudget).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { budgets: true } },
        }),
      }),
    );
  });

  it('removes a budget for delete_budget actions', async () => {
    const financeService = {
      deleteBudget: jest.fn(() => of({})),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'delete_budget',
        budgetId: 'budget-1',
        categorySlug: 'transport',
        categoryName: 'Transport',
        currentLimit: 40000,
        reason: 'User no longer tracks this budget.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Transport budget removed.',
    });
    expect(financeService.deleteBudget).toHaveBeenCalledWith(
      { id: 'budget-1', hardDelete: false },
      expect.any(Metadata),
    );
  });

  it('creates a savings goal with the approved priority', async () => {
    const financeService = {
      createGoal: jest.fn(() =>
        of({
          id: 'goal-1',
          name: 'Emergency Fund',
          targetAmount: 500000,
          priority: 'HIGH',
        }),
      ),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'create_goal',
        name: 'Emergency Fund',
        targetDate: '2026-12-31',
        targetAmount: 500000,
        priority: 'HIGH',
        reason: 'User wants to save aggressively.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Emergency Fund goal created with a ₦500,000 target.',
    });
    expect(financeService.createGoal).toHaveBeenCalledWith(
      {
        name: 'Emergency Fund',
        targetDate: '2026-12-31',
        targetAmount: 500000,
        priority: 'HIGH',
        description: 'User wants to save aggressively.',
      },
      expect.any(Metadata),
    );
  });

  it('checks only the goal count before creating a savings goal', async () => {
    const financeService = {
      createGoal: jest.fn(() =>
        of({
          id: 'goal-1',
          name: 'Emergency Fund',
          targetAmount: 500000,
          priority: 'HIGH',
        }),
      ),
    };
    const prisma = makePrisma(
      makePrismaUserFindUniqueResult({
        subscription: { plan: 'FREE', status: 'ACTIVE' },
        count: { goals: 0 },
      }),
    );
    const { executor } = makeExecutor(financeService, prisma);

    await executor.execute(
      {
        kind: 'create_goal',
        name: 'Emergency Fund',
        targetDate: '2026-12-31',
        targetAmount: 500000,
        priority: 'HIGH',
        reason: 'User wants to save aggressively.',
      },
      { userId: 'user-1' },
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { goals: true } },
        }),
      }),
    );
    expect(financeService.createGoal).toHaveBeenCalledTimes(1);
  });

  it('updates the latest contribution for adjust_goal_contribution actions', async () => {
    const financeService = {
      getGoal: jest.fn(() =>
        of({
          id: 'goal-1',
          name: 'Emergency Fund',
          contributions: [
            { id: 'contribution-old', amount: 10000, date: '2026-05-01' },
            { id: 'contribution-latest', amount: 15000, date: '2026-06-20' },
          ],
        }),
      ),
      updateGoalContribution: jest.fn(() =>
        of({
          id: 'contribution-latest',
          amount: 25000,
          date: '2026-06-20',
        }),
      ),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'adjust_goal_contribution',
        goalId: 'goal-1',
        goalName: 'Emergency Fund',
        currentAmount: 15000,
        proposedAmount: 25000,
        reason: 'Increase this month’s savings pace.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Emergency Fund contribution updated to ₦25,000.',
    });
    expect(financeService.getGoal).toHaveBeenCalledTimes(1);
    const [getGoalRequest, getGoalMetadata] = financeService.getGoal.mock
      .calls[0] as unknown as [unknown, Metadata];
    expect(getGoalRequest).toEqual({ id: 'goal-1' });
    expect(getGoalMetadata.get('x-user-id')).toEqual(['user-1']);

    expect(financeService.updateGoalContribution).toHaveBeenCalledTimes(1);
    const [updateRequest, updateMetadata] = financeService
      .updateGoalContribution.mock.calls[0] as unknown as [unknown, Metadata];
    expect(updateRequest).toEqual({
      goalId: 'goal-1',
      goalContributionId: 'contribution-latest',
      amount: 25000,
      description: 'Increase this month’s savings pace.',
    });
    expect(updateMetadata.get('x-user-id')).toEqual(['user-1']);
  });

  it('applies a batch of goal contribution changes', async () => {
    const financeService = {
      contributeToGoal: jest.fn(() => of({ id: 'contribution-new' })),
      deleteContribution: jest.fn(() => of({})),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'goal_contributions_batch',
        goalId: 'goal-1',
        goalName: 'Emergency Fund',
        operations: [
          {
            operation: 'add',
            amount: 10000,
            date: '2026-06-25',
            description: 'Extra savings',
          },
          { operation: 'delete', contributionId: 'contribution-old' },
        ],
        reason: 'Clean up this month’s goal progress.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Emergency Fund goal contributions updated (2 changes).',
    });
    expect(financeService.contributeToGoal).toHaveBeenCalledWith(
      {
        goalId: 'goal-1',
        amount: 10000,
        date: '2026-06-25',
        description: 'Extra savings',
        transactionId: undefined,
      },
      expect.any(Metadata),
    );
    expect(financeService.deleteContribution).toHaveBeenCalledWith(
      {
        goalId: 'goal-1',
        goalContributionId: 'contribution-old',
      },
      expect.any(Metadata),
    );
  });

  it('creates an expense recurring item for suggest_recurring actions', async () => {
    const financeService = {
      createRecurring: jest.fn(() =>
        of({
          id: 'recurring-1',
          name: 'Netflix',
          amount: 5500,
          frequency: 'MONTHLY',
        }),
      ),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'suggest_recurring',
        name: 'Netflix',
        amount: 5500,
        categorySlug: 'entertainment',
        frequency: 'MONTHLY',
        reason: 'This looks like a repeating subscription.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Netflix recurring expense created at ₦5,500.',
    });
    expect(financeService.createRecurring).toHaveBeenCalledTimes(1);
    const [request, metadata] = financeService.createRecurring.mock
      .calls[0] as unknown as [unknown, Metadata];
    expect(request).toEqual({
      name: 'Netflix',
      amount: 5500,
      categorySlug: 'cat-entertainment',
      frequency: 'MONTHLY',
      type: 'EXPENSE',
      startDate: '2026-06-25T00:00:00.000Z',
      description: 'This looks like a repeating subscription.',
    });
    expect(metadata.get('x-user-id')).toEqual(['user-1']);
  });

  it('blocks free users from creating recurring items after reaching the recurring limit', async () => {
    const financeService = {
      createRecurring: jest.fn(),
    };
    const prisma = makePrisma(
      makePrismaUserFindUniqueResult({
        subscription: { plan: 'FREE', status: 'ACTIVE' },
        count: {
          recurringItems: PLAN_LIMITS.FREE.MAX_RECURRING_ITEMS as number,
        },
      }),
    );
    const { executor } = makeExecutor(financeService, prisma);

    await expect(
      executor.execute(
        {
          kind: 'suggest_recurring',
          name: 'Netflix',
          amount: 5500,
          categorySlug: 'entertainment',
          frequency: 'MONTHLY',
          reason: 'This looks like a repeating subscription.',
        },
        { userId: 'user-1' },
      ),
    ).resolves.toEqual({
      status: 'execution_failed',
      message:
        'You cannot create a new recurring item because your Free plan recurring item limit has been reached. Please upgrade to Pro to add more.',
    });
    expect(financeService.createRecurring).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { recurringItems: true } },
        }),
      }),
    );
  });

  it('normalizes recurring frequency before calling finance service', async () => {
    const financeService = {
      createRecurring: jest.fn(() =>
        of({
          id: 'recurring-1',
          name: 'Spectranet',
          amount: 18000,
          frequency: 'MONTHLY',
        }),
      ),
    };
    const { executor } = makeExecutor(financeService);

    await executor.execute(
      {
        kind: 'suggest_recurring',
        name: 'Spectranet',
        amount: 18000,
        categorySlug: 'bills-utilities',
        frequency: 'monthly',
        reason: 'This looks like a repeating internet bill.',
      },
      { userId: 'user-1' },
    );

    expect(financeService.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({
        categorySlug: 'cat-bills-utilities',
        frequency: 'MONTHLY',
      }),
      expect.any(Metadata),
    );
  });

  it('applies a batch of split participant changes', async () => {
    const financeService = {
      addParticipant: jest.fn(() => of({ id: 'participant-new' })),
      updateParticipant: jest.fn(() => of({ id: 'participant-1' })),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'split_participants_batch',
        splitId: 'split-1',
        splitName: 'Weekend Trip',
        operations: [
          {
            operation: 'add',
            name: 'Ada',
            email: 'ada@example.com',
            amount: 20000,
          },
          {
            operation: 'update',
            participantId: 'participant-1',
            amount: 25000,
          },
        ],
        reason: 'Adjust trip balances.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Weekend Trip participants updated (2 changes).',
    });
    expect(financeService.addParticipant).toHaveBeenCalledWith(
      {
        splitId: 'split-1',
        name: 'Ada',
        email: 'ada@example.com',
        amount: 20000,
      },
      expect.any(Metadata),
    );
    expect(financeService.updateParticipant).toHaveBeenCalledWith(
      {
        splitId: 'split-1',
        participantId: 'participant-1',
        name: undefined,
        email: undefined,
        amount: 25000,
      },
      expect.any(Metadata),
    );
  });

  it('blocks free users from adding split participants above the per-split limit', async () => {
    const financeService = {
      addParticipant: jest.fn(),
      updateParticipant: jest.fn(),
    };
    const prisma = makePrisma(
      makePrismaUserFindUniqueResult({
        subscription: { plan: 'FREE', status: 'ACTIVE' },
      }),
      {
        _count: {
          participants: (PLAN_LIMITS.FREE.MAX_PEOPLE_PER_SPLIT as number) - 1,
        },
      },
    );
    const { executor } = makeExecutor(financeService, prisma);

    await expect(
      executor.execute(
        {
          kind: 'split_participants_batch',
          splitId: 'split-1',
          splitName: 'Weekend Trip',
          operations: [
            {
              operation: 'update',
              participantId: 'participant-1',
              amount: 25000,
            },
            {
              operation: 'add',
              name: 'Ada',
              email: 'ada@example.com',
              amount: 20000,
            },
            {
              operation: 'add',
              name: 'Bola',
              email: 'bola@example.com',
              amount: 15000,
            },
          ],
          reason: 'Add two people to the trip.',
        },
        { userId: 'user-1' },
      ),
    ).resolves.toEqual({
      status: 'execution_failed',
      message:
        'You cannot add 2 participants to Weekend Trip because your Free plan allows 3 people per split. Please upgrade to Pro to add more.',
    });
    expect(prisma.split.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'split-1',
        userId: 'user-1',
      },
      select: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });
    expect(financeService.updateParticipant).not.toHaveBeenCalled();
    expect(financeService.addParticipant).not.toHaveBeenCalled();
  });

  it('adjusts an existing subscription for flag_subscription adjust actions', async () => {
    const financeService = {
      getRecurring: jest.fn(() =>
        of({
          id: 'recurring-1',
          name: 'Netflix',
          amount: 5500,
        }),
      ),
      updateRecurring: jest.fn(() =>
        of({
          id: 'recurring-1',
          name: 'Netflix',
          amount: 6500,
        }),
      ),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'flag_subscription',
        recurringId: 'recurring-1',
        operation: 'adjust',
        name: 'Netflix',
        currentAmount: 5500,
        proposedAmount: 6500,
        reason: 'The latest charge increased.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Netflix subscription updated to ₦6,500.',
    });
    expect(financeService.getRecurring).toHaveBeenCalledWith(
      { id: 'recurring-1' },
      expect.any(Metadata),
    );
    expect(financeService.updateRecurring).toHaveBeenCalledTimes(1);
    const [request, metadata] = financeService.updateRecurring.mock
      .calls[0] as unknown as [unknown, Metadata];
    expect(request).toEqual({
      id: 'recurring-1',
      amount: 6500,
      description: 'The latest charge increased.',
    });
    expect(metadata.get('x-user-id')).toEqual(['user-1']);
  });

  it('cancels an existing subscription for flag_subscription cancel actions', async () => {
    const financeService = {
      getRecurring: jest.fn(() =>
        of({
          id: 'recurring-1',
          name: 'Netflix',
          amount: 5500,
        }),
      ),
      deleteRecurring: jest.fn(() => of({})),
    };
    const { executor } = makeExecutor(financeService);

    const result = await executor.execute(
      {
        kind: 'flag_subscription',
        recurringId: 'recurring-1',
        operation: 'cancel',
        name: 'Netflix',
        currentAmount: 5500,
        reason: 'User wants to stop tracking this subscription.',
      },
      { userId: 'user-1' },
    );

    expect(result).toEqual({
      status: 'executed',
      message: 'Netflix subscription cancelled.',
    });
    expect(financeService.getRecurring).toHaveBeenCalledWith(
      { id: 'recurring-1' },
      expect.any(Metadata),
    );
    expect(financeService.deleteRecurring).toHaveBeenCalledTimes(1);
    const [request, metadata] = financeService.deleteRecurring.mock
      .calls[0] as unknown as [unknown, Metadata];
    expect(request).toEqual({ id: 'recurring-1' });
    expect(metadata.get('x-user-id')).toEqual(['user-1']);
  });

  it('does not update a subscription when the recurring id is stale', async () => {
    const financeService = {
      getRecurring: jest.fn(() =>
        throwError(() => new Error('Recurring item not found')),
      ),
      updateRecurring: jest.fn(),
    };
    const { executor } = makeExecutor(financeService);

    await expect(
      executor.execute(
        {
          kind: 'flag_subscription',
          recurringId: 'recurring-missing',
          operation: 'adjust',
          name: 'Netflix',
          currentAmount: 5500,
          proposedAmount: 6500,
          reason: 'The latest charge increased.',
        },
        { userId: 'user-1' },
      ),
    ).resolves.toEqual({
      status: 'execution_failed',
      message:
        'I could not find that recurring item anymore. No financial changes were made.',
    });
    expect(financeService.updateRecurring).not.toHaveBeenCalled();
  });

  it('returns execution_failed when the finance update fails', async () => {
    const loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const financeService = {
      updateBudget: jest.fn(() =>
        throwError(() => new Error('finance unavailable')),
      ),
    };
    const { executor } = makeExecutor(financeService);

    await expect(
      executor.execute(
        {
          kind: 'adjust_budget',
          budgetId: 'budget-1',
          categorySlug: 'food',
          categoryName: 'Food',
          currentLimit: 40000,
          proposedLimit: 42000,
          reason: 'Food spending is trending above the current budget.',
        },
        { userId: 'user-1' },
      ),
    ).resolves.toEqual({
      status: 'execution_failed',
      message:
        'I could not update that budget just now. No financial changes were made.',
    });
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ADV-ACTION] adjust_budget failed'),
      expect.any(String),
    );
    loggerErrorSpy.mockRestore();
  });
});
