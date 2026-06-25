jest.mock('@fintrack/database/service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('@fintrack/database/types', () => ({
  AdvisorChatRole: {
    USER: 'USER',
    ASSISTANT: 'ASSISTANT',
  },
  AdvisorScope: {
    BUDGETS: 'BUDGETS',
  },
}));
jest.mock('@fintrack/types/constants/plan.constants', () => ({
  PLAN_LIMITS: {},
  Usage: {},
}));
jest.mock('@fintrack/types/constants/redis.costants', () => ({
  REDIS_CLIENT: 'REDIS_CLIENT',
  INSIGHTS_CACHE_PREFIX: 'insights',
  INSIGHTS_CACHE_TTL: 3600,
  INSIGHTS_UNREAD_CACHE_PREFIX: 'insights_unread',
  INSIGHTS_UNREAD_CACHE_TTL: 300,
  INSIGHTS_COOLDOWN: 'insights_cooldown',
  INSIGHTS_COOLDOWN_TTL: 600,
  ORACLE_MACRO_CACHE_KEY: 'oracle_macro',
  ORACLE_MACRO_CACHE_TTL: 3600,
  ADVISOR_SCOPES_CACHE_PREFIX: 'advisor_scopes',
  ADVISOR_SCOPES_CACHE_TTL: 300,
  ADVISOR_PENDING_PREFIX: 'advisor_pending',
  ADVISOR_PENDING_TTL: 60,
  ADVISOR_CONVERSATIONS_CACHE_PREFIX: 'advisor_conversations',
  ADVISOR_CONVERSATIONS_CACHE_TTL: 300,
}));
jest.mock('@fintrack/types/protos/ai/ai', () => ({
  AI_PACKAGE_NAME: 'ai',
  AI_SERVICE_NAME: 'AiService',
}));
jest.mock('@fintrack/types/constants/queus.constants', () => ({
  INSIGHTS_JOB: 'insights',
  INSIGHTS_QUEUE: 'insights',
}));
jest.mock('@fintrack/types/interfaces/insights', () => ({}));

import { of, toArray } from 'rxjs';

import { AdvisorService } from './advisor.service';

describe('Gateway AdvisorService', () => {
  const flushPromises = () =>
    new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

  function makeService() {
    const prisma = {
      advisorConversation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      advisorChatMessage: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (ops) => Promise.all(ops)),
    };
    const redis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    };
    const aiServiceClient = {
      sendAdvisorMessage: jest.fn(() =>
        of({ type: 'token', content: 'send', data: '' }),
      ),
      resumeAdvisor: jest.fn(() =>
        of({ type: 'token', content: 'resumed', data: '' }),
      ),
    };
    const aiClient = {
      getService: jest.fn(() => aiServiceClient),
    };
    const service = new AdvisorService(
      prisma as never,
      redis as never,
      {} as never,
      aiClient as never,
    );
    service.onModuleInit();
    return { service, prisma, redis, aiServiceClient };
  }

  describe('stageMessage', () => {
    it('stages resume payloads on the shared advisor message endpoint', async () => {
      const { service, redis } = makeService();
      redis.setex.mockResolvedValue('OK');

      await expect(
        service.stageMessage('user-1', {
          conversationId: 'conversation-1',
          resume: { approved: false },
        }),
      ).resolves.toEqual({ streamToken: expect.any(String) });

      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^advisor_pending:/),
        60,
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          resume: { approved: false },
        }),
      );
    });
  });

  describe('streamMessage', () => {
    const proposedAction = {
      kind: 'flag_subscription',
      recurringId: 'recurring-1',
      operation: 'cancel',
      name: 'Spectranet Internet',
      currentAmount: 18000,
      reason: 'Duplicate monthly internet subscription',
    };

    it('routes staged resume payloads to ResumeAdvisor without persisting a user turn', async () => {
      const { service, prisma, redis, aiServiceClient } = makeService();
      redis.get.mockResolvedValue(
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          resume: { approved: true },
        }),
      );
      redis.del.mockResolvedValue(1);
      redis.get.mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          resume: { approved: true },
        }),
      );
      redis.get.mockResolvedValueOnce(JSON.stringify(['BUDGETS']));
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });

      const events = await new Promise((resolve, reject) => {
        service
          .streamMessage('user-1', 'stream-token')
          .pipe(toArray())
          .subscribe({ next: resolve, error: reject });
      });

      expect(events).toEqual([
        { data: { type: 'token', content: 'resumed', data: '' } },
      ]);
      expect(aiServiceClient.resumeAdvisor).toHaveBeenCalledWith(
        {
          conversationId: 'conversation-1',
          userId: 'user-1',
          approved: true,
          grantedScopes: ['BUDGETS'],
        },
        expect.anything(),
      );
      expect(aiServiceClient.sendAdvisorMessage).not.toHaveBeenCalled();
      expect(prisma.advisorConversation.create).not.toHaveBeenCalled();
      expect(prisma.advisorChatMessage.create).toHaveBeenCalledTimes(1);
      expect(prisma.advisorChatMessage.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conversation-1',
          role: 'ASSISTANT',
          content: 'resumed',
        },
      });
    });

    it('persists approval-required cards as assistant metadata even when no text is streamed', async () => {
      const { service, prisma, redis, aiServiceClient } = makeService();
      aiServiceClient.sendAdvisorMessage.mockReturnValue(
        of({
          type: 'approval_required',
          content: '',
          data: JSON.stringify(proposedAction),
        }),
      );
      redis.get.mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          message: 'Do this recommendation',
        }),
      );
      redis.get.mockResolvedValueOnce(JSON.stringify(['BUDGETS']));
      redis.del.mockResolvedValue(1);
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });

      const events = await new Promise((resolve, reject) => {
        service
          .streamMessage('user-1', 'stream-token')
          .pipe(toArray())
          .subscribe({ next: resolve, error: reject });
      });

      expect(events).toEqual([
        {
          data: {
            type: 'approval_required',
            content: '',
            data: JSON.stringify(proposedAction),
          },
        },
      ]);
      expect(prisma.advisorChatMessage.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conversation-1',
          role: 'ASSISTANT',
          content: '',
          metadata: {
            proposedAction,
            actionState: 'pending',
          },
        },
      });
    });

    it('moves approval cards through processing before the final resume state', async () => {
      const { service, prisma, redis } = makeService();
      redis.get.mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          resume: { approved: false },
        }),
      );
      redis.get.mockResolvedValueOnce(JSON.stringify(['BUDGETS']));
      redis.del.mockResolvedValue(1);
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });
      prisma.advisorChatMessage.findMany.mockResolvedValueOnce([
        {
          id: 'message-1',
          metadata: {
            proposedAction,
            actionState: 'pending',
          },
        },
      ]);
      prisma.advisorChatMessage.findMany.mockResolvedValueOnce([
        {
          id: 'message-1',
          metadata: {
            proposedAction,
            actionState: 'processing',
          },
        },
      ]);

      await new Promise((resolve, reject) => {
        service
          .streamMessage('user-1', 'stream-token')
          .pipe(toArray())
          .subscribe({ next: resolve, error: reject });
      });
      await flushPromises();

      expect(prisma.advisorChatMessage.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'message-1' },
        data: {
          metadata: {
            proposedAction,
            actionState: 'processing',
          },
        },
      });
      expect(prisma.advisorChatMessage.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'message-1' },
        data: {
          metadata: {
            proposedAction,
            actionState: 'rejected',
          },
        },
      });
    });

    it('marks processing approval cards as failed when resume returns an error chunk', async () => {
      const { service, prisma, redis, aiServiceClient } = makeService();
      aiServiceClient.resumeAdvisor.mockReturnValue(
        of({
          type: 'error',
          content: 'Resume failed',
          data: '',
        }),
      );
      redis.get.mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          resume: { approved: true },
        }),
      );
      redis.get.mockResolvedValueOnce(JSON.stringify(['BUDGETS']));
      redis.del.mockResolvedValue(1);
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });
      prisma.advisorChatMessage.findMany.mockResolvedValueOnce([
        {
          id: 'message-1',
          metadata: {
            proposedAction,
            actionState: 'pending',
          },
        },
      ]);
      prisma.advisorChatMessage.findMany.mockResolvedValueOnce([
        {
          id: 'message-1',
          metadata: {
            proposedAction,
            actionState: 'processing',
          },
        },
      ]);

      const events = await new Promise((resolve, reject) => {
        service
          .streamMessage('user-1', 'stream-token')
          .pipe(toArray())
          .subscribe({ next: resolve, error: reject });
      });
      await flushPromises();

      expect(events).toEqual([
        { data: { type: 'error', content: 'Resume failed', data: '' } },
      ]);
      expect(prisma.advisorChatMessage.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'message-1' },
        data: {
          metadata: {
            proposedAction,
            actionState: 'processing',
          },
        },
      });
      expect(prisma.advisorChatMessage.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'message-1' },
        data: {
          metadata: {
            proposedAction,
            actionState: 'failed',
          },
        },
      });
    });
  });

  describe('getConversationMessages', () => {
    it('returns persisted approval metadata with history rows', async () => {
      const { service, prisma } = makeService();
      const proposedAction = {
        kind: 'flag_subscription',
        recurringId: 'recurring-1',
        operation: 'cancel',
        name: 'Spectranet Internet',
        currentAmount: 18000,
        reason: 'Duplicate monthly internet subscription',
      };
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });
      prisma.advisorChatMessage.findMany.mockResolvedValue([
        {
          id: 'message-1',
          role: 'ASSISTANT',
          content: '',
          createdAt: new Date('2026-06-25T18:00:00.000Z'),
          metadata: {
            proposedAction,
            actionState: 'approved',
          },
        },
      ]);

      await expect(
        service.getConversationMessages('user-1', 'conversation-1', {
          limit: 30,
        }),
      ).resolves.toEqual({
        messages: [
          {
            id: 'message-1',
            role: 'ASSISTANT',
            content: '',
            createdAt: new Date('2026-06-25T18:00:00.000Z'),
            metadata: {
              proposedAction,
              actionState: 'approved',
            },
          },
        ],
        nextCursor: null,
      });
    });
  });
});
