jest.mock('@fintrack/database/service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('@fintrack/database/types', () => ({
  GoalPriority: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  },
  Goalstatus: {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    ON_HOLD: 'ON_HOLD',
  },
  TransactionType: {
    INCOME: 'INCOME',
  },
  Prisma: {
    TransactionIsolationLevel: {
      Serializable: 'Serializable',
    },
  },
}));
jest.mock('@fintrack/types/constants/queus.constants', () => ({
  ACTIVITY_NOTIFICATION_JOB: 'activity-notification',
  ACTIVITY_NOTIFICATION_QUEUE: 'activity-notification',
}));
jest.mock('@fintrack/utils/date', () => ({
  format: jest.fn(() => '2099-12'),
}));
jest.mock('../transaction/transaction.service', () => ({
  TransactionService: class TransactionService {},
}));

import { GoalService } from './goal.service';

describe('GoalService', () => {
  function makeService() {
    const prismaService = {
      goal: {
        create: jest.fn(),
      },
    };
    const activityQueue = {
      add: jest.fn(),
    };
    const service = new GoalService(
      prismaService as never,
      {} as never,
      activityQueue as never,
    );

    return { service, prismaService, activityQueue };
  }

  it('persists the priority supplied by createGoal requests', async () => {
    const { service, prismaService } = makeService();
    const now = new Date('2026-06-30T00:00:00.000Z');
    prismaService.goal.create.mockResolvedValue({
      id: 'goal-1',
      userId: 'user-1',
      name: 'Emergency Fund',
      targetAmount: 500000,
      targetDate: new Date('2099-12-31T00:00:00.000Z'),
      priority: 'HIGH',
      status: 'ACTIVE',
      description: 'Build a stronger buffer.',
      createdAt: now,
      updatedAt: now,
    });

    await service.createGoal('user-1', {
      name: 'Emergency Fund',
      targetAmount: 500000,
      targetDate: '2099-12-31',
      priority: 'HIGH',
      description: 'Build a stronger buffer.',
    });

    expect(prismaService.goal.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        name: 'Emergency Fund',
        targetAmount: 500000,
        targetDate: new Date('2099-12-31'),
        priority: 'HIGH',
        description: 'Build a stronger buffer.',
      },
    });
  });
});
