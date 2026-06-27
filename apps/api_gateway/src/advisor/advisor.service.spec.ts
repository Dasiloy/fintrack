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
jest.mock('@fintrack/types/constants/file.constants', () => ({
  ADVISOR_FILES_MAX_TOTAL_SIZE: 10 * 1024 * 1024,
  ADVISOR_FILE_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'application/pdf',
    'text/csv',
    'application/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
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
  ADVISOR_ATTACHMENT_CLEANUP_JOB: 'advisor-attachment-cleanup',
  ADVISOR_ATTACHMENT_CLEANUP_QUEUE: 'advisor-attachment-cleanup',
  INSIGHTS_JOB: 'insights',
  INSIGHTS_QUEUE: 'insights',
}));
jest.mock('@fintrack/types/interfaces/insights', () => ({}));
jest.mock('../upload/upload.service', () => ({
  UploadService: class UploadService {},
}));

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
        delete: jest.fn(),
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
      $executeRawUnsafe: jest.fn().mockResolvedValue(0),
      $transaction: jest.fn(async (ops) => Promise.all(ops)),
    };
    const redis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
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
    const insightsQueue = {
      add: jest.fn(),
    };
    const attachmentCleanupQueue = {
      add: jest.fn(),
    };
    const uploadService = {
      getAdvisorFileUrlForUser: jest.fn(
        (_userId: string, publicId: string, format: string) =>
          `https://signed.example/${publicId}.${format}`,
      ),
    };
    const service = new AdvisorService(
      prisma as never,
      redis as never,
      insightsQueue as never,
      attachmentCleanupQueue as never,
      uploadService as never,
      aiClient as never,
    );
    service.onModuleInit();
    return {
      service,
      prisma,
      redis,
      aiServiceClient,
      insightsQueue,
      attachmentCleanupQueue,
      uploadService,
    };
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

    it('rejects advisor attachments with unsupported file types before staging', async () => {
      const { service } = makeService();

      await expect(
        service.stageMessage('user-1', {
          conversationId: 'conversation-1',
          message: 'review this file',
          attachments: [
            {
              url: 'https://res.cloudinary.com/demo/raw/upload/file.exe',
              publicId: 'fintrack/advisor/user-1/file.exe',
              name: 'file.exe',
              mimeType: 'application/x-msdownload',
              sizeBytes: 100,
              kind: 'file',
            },
          ],
        } as never),
      ).rejects.toThrow('Unsupported advisor attachment type');
    });

    it('rejects advisor attachment collections over 10 MB before staging', async () => {
      const { service } = makeService();

      await expect(
        service.stageMessage('user-1', {
          conversationId: 'conversation-1',
          message: 'review these files',
          attachments: [
            {
              url: 'https://res.cloudinary.com/demo/raw/upload/a.csv',
              publicId: 'fintrack/advisor/user-1/a.csv',
              name: 'a.csv',
              mimeType: 'text/csv',
              sizeBytes: 10 * 1024 * 1024 + 1,
              kind: 'csv',
            },
          ],
        } as never),
      ).rejects.toThrow('Advisor attachments cannot exceed 10 MB total');
    });

    it('stages advisor attachments without signed URLs in Redis', async () => {
      const { service, redis } = makeService();
      redis.setex.mockResolvedValue('OK');

      await service.stageMessage('user-1', {
        conversationId: 'conversation-1',
        message: 'review this',
        attachments: [
          {
            url: 'https://old-signed.example/file.png',
            publicId: 'fintrack/advisor/user-1/file',
            name: 'file.png',
            mimeType: 'image/png',
            sizeBytes: 100,
            format: 'png',
            kind: 'image',
          },
        ],
      });

      const staged = JSON.parse(redis.setex.mock.calls[0][2]);
      expect(staged.attachments[0]).toEqual({
        publicId: 'fintrack/advisor/user-1/file',
        name: 'file.png',
        mimeType: 'image/png',
        sizeBytes: 100,
        format: 'png',
        kind: 'image',
      });
      expect(staged.attachments[0]).not.toHaveProperty('url');
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

    it('mints transient model URLs for attachments without persisting them', async () => {
      const { service, prisma, redis, aiServiceClient, uploadService } =
        makeService();
      redis.get.mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          message: 'review this image',
          attachments: [
            {
              publicId: 'fintrack/advisor/user-1/receipt',
              name: 'receipt.png',
              mimeType: 'image/png',
              sizeBytes: 100,
              format: 'png',
              kind: 'image',
            },
          ],
        }),
      );
      redis.get.mockResolvedValueOnce(JSON.stringify(['BUDGETS']));
      redis.del.mockResolvedValue(1);
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });

      await new Promise((resolve, reject) => {
        service
          .streamMessage('user-1', 'stream-token')
          .pipe(toArray())
          .subscribe({ next: resolve, error: reject });
      });

      expect(uploadService.getAdvisorFileUrlForUser).toHaveBeenCalledWith(
        'user-1',
        'fintrack/advisor/user-1/receipt',
        'png',
        'model',
      );
      expect(aiServiceClient.sendAdvisorMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            expect.objectContaining({
              publicId: 'fintrack/advisor/user-1/receipt',
              url: 'https://signed.example/fintrack/advisor/user-1/receipt.png',
            }),
          ],
        }),
        expect.anything(),
      );
      expect(prisma.advisorChatMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: {
            attachments: [
              {
                publicId: 'fintrack/advisor/user-1/receipt',
                name: 'receipt.png',
                mimeType: 'image/png',
                sizeBytes: 100,
                format: 'png',
                kind: 'image',
              },
            ],
          },
        }),
      });
    });

    it('creates document-only conversations with a filename title and persists the assistant turn', async () => {
      const { service, prisma, redis } = makeService();
      redis.get.mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          message: '',
          attachments: [
            {
              publicId: 'fintrack/advisor/user-1/customer-statement',
              name: 'Customer Statement.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 304590,
              format: 'pdf',
              kind: 'pdf',
            },
          ],
        }),
      );
      redis.get.mockResolvedValueOnce(JSON.stringify(['BUDGETS']));
      redis.del.mockResolvedValue(1);
      prisma.advisorConversation.findUnique.mockResolvedValue(null);

      const events = await new Promise((resolve, reject) => {
        service
          .streamMessage('user-1', 'stream-token')
          .pipe(toArray())
          .subscribe({ next: resolve, error: reject });
      });

      expect(events).toEqual([
        { data: { type: 'token', content: 'send', data: '' } },
      ]);
      expect(prisma.advisorConversation.create).toHaveBeenCalledWith({
        data: {
          id: 'conversation-1',
          userId: 'user-1',
          title: 'Documents: Customer Statement.pdf',
        },
      });
      expect(prisma.advisorChatMessage.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conversation-1',
          role: 'USER',
          content: '',
          metadata: {
            attachments: [
              {
                publicId: 'fintrack/advisor/user-1/customer-statement',
                name: 'Customer Statement.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 304590,
                format: 'pdf',
                kind: 'pdf',
              },
            ],
          },
        },
      });
      expect(prisma.advisorChatMessage.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conversation-1',
          role: 'ASSISTANT',
          content: 'send',
        },
      });
    });

    it('waits for assistant persistence before completing the stream', async () => {
      const { service, prisma, redis } = makeService();
      let resolveTransaction!: () => void;
      const transactionDone = new Promise<unknown[]>((resolve) => {
        resolveTransaction = () => resolve([]);
      });
      prisma.$transaction.mockReturnValue(transactionDone);
      redis.get.mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          conversationId: 'conversation-1',
          message: 'review this',
        }),
      );
      redis.get.mockResolvedValueOnce(JSON.stringify(['BUDGETS']));
      redis.del.mockResolvedValue(1);
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });

      let completed = false;
      const streamPromise = new Promise<void>((resolve, reject) => {
        service
          .streamMessage('user-1', 'stream-token')
          .pipe(toArray())
          .subscribe({
            error: reject,
            complete: () => {
              completed = true;
              resolve();
            },
          });
      });

      await flushPromises();
      expect(completed).toBe(false);

      resolveTransaction();
      await streamPromise;

      expect(completed).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
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

  describe('deleteConversation', () => {
    it('queues persisted advisor attachment cleanup after deleting the conversation', async () => {
      const { service, prisma, redis, attachmentCleanupQueue } = makeService();
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });
      prisma.advisorConversation.delete.mockResolvedValue({
        id: 'conversation-1',
      });
      prisma.advisorChatMessage.findMany.mockResolvedValue([
        {
          metadata: {
            attachments: [
              {
                publicId: 'fintrack/advisor/user-1/file-1',
                kind: 'image',
                name: 'receipt.png',
              },
              {
                publicId: 'fintrack/advisor/user-1/file-1',
                kind: 'image',
                name: 'receipt.png',
              },
            ],
          },
        },
        {
          metadata: {
            attachments: [
              {
                publicId: 'fintrack/advisor/user-1/file-2',
                kind: 'pdf',
                name: 'statement.pdf',
              },
            ],
          },
        },
      ]);

      await service.deleteConversation('user-1', 'conversation-1');

      expect(prisma.advisorConversation.delete).toHaveBeenCalledWith({
        where: { id: 'conversation-1' },
      });
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(3);
      expect(attachmentCleanupQueue.add).toHaveBeenCalledWith(
        'advisor-attachment-cleanup',
        {
          userId: 'user-1',
          conversationId: 'conversation-1',
          attachments: [
            {
              publicId: 'fintrack/advisor/user-1/file-1',
              kind: 'image',
              name: 'receipt.png',
            },
            {
              publicId: 'fintrack/advisor/user-1/file-2',
              kind: 'pdf',
              name: 'statement.pdf',
            },
          ],
        },
        expect.objectContaining({ attempts: 3 }),
      );
      expect(redis.del).toHaveBeenCalledWith('advisor_conversations:user-1');
    });

    it('still deletes the conversation when attachment cleanup enqueueing fails', async () => {
      const { service, prisma, attachmentCleanupQueue } = makeService();
      prisma.advisorConversation.findUnique.mockResolvedValue({
        userId: 'user-1',
      });
      prisma.advisorConversation.delete.mockResolvedValue({
        id: 'conversation-1',
      });
      prisma.advisorChatMessage.findMany.mockResolvedValue([
        {
          metadata: {
            attachments: [
              {
                publicId: 'fintrack/advisor/user-1/file-1',
                kind: 'csv',
                name: 'budget.csv',
              },
            ],
          },
        },
      ]);
      attachmentCleanupQueue.add.mockRejectedValue(new Error('redis down'));

      await expect(
        service.deleteConversation('user-1', 'conversation-1'),
      ).resolves.toBeUndefined();

      expect(prisma.advisorConversation.delete).toHaveBeenCalledWith({
        where: { id: 'conversation-1' },
      });
    });
  });
});
