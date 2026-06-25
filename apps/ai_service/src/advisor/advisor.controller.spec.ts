jest.mock('@fintrack/common/decorators/rpc_user.decorator', () => ({
  RpcUser: () => () => undefined,
}));
jest.mock('@fintrack/common/guards/rpc.guard', () => ({
  RpcAuthGuard: class RpcAuthGuard {},
}));
jest.mock('@fintrack/database/types', () => ({}));
jest.mock('@fintrack/types/protos/ai/ai', () => ({
  AI_SERVICE_NAME: 'AiService',
}));
jest.mock('./advisor.service', () => ({
  AdvisorService: class AdvisorService {},
}));

import { toArray } from 'rxjs';

import { AdvisorController } from './advisor.controller';

describe('AdvisorController', () => {
  describe('resumeAdvisor', () => {
    it('streams resumeResponse events as advisor chunks', async () => {
      const advisorService = {
        resumeResponse: jest.fn(async function* () {
          yield { type: 'token', content: 'Done', node: 'respond' };
        }),
        toChunk: jest.fn(() => ({ type: 'token', content: 'Done', data: '' })),
      };
      const controller = new AdvisorController(advisorService as never);

      const chunks = await new Promise((resolve, reject) => {
        controller
          .resumeAdvisor(
            {
              conversationId: 'conversation-1',
              userId: 'ignored-body-user',
              approved: false,
              grantedScopes: ['BUDGETS'],
            },
            { id: 'user-1' } as never,
          )
          .pipe(toArray())
          .subscribe({ next: resolve, error: reject });
      });

      expect(chunks).toEqual([{ type: 'token', content: 'Done', data: '' }]);
      expect(advisorService.resumeResponse).toHaveBeenCalledWith({
        userId: 'user-1',
        conversationId: 'conversation-1',
        approved: false,
        grantedScopes: ['BUDGETS'],
        signal: expect.any(AbortSignal),
      });
    });
  });
});
