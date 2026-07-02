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
  PLAN_LIMITS: {},
}));
jest.mock('@fintrack/types/interfaces/ai', () => ({
  AdvisorWorkflowActionBatchResult: undefined,
  AdvisorWorkflowExecutableCandidate: undefined,
  GOOGLE_GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GOOGLE_GEMINI_3_FLASH_PREVIEW: 'gemini-3-flash-preview',
  GOOGLE_GEMINI_3_5_FLASH: 'gemini-3.5-flash',
}));
jest.mock('@fintrack/utils/date', () => ({
  __esModule: true,
  default: jest.fn(() => ({ toISOString: () => '2026-06-25T00:00:00.000Z' })),
}));
jest.mock('@fintrack/utils/format', () => ({
  formatCurrency: (value: number) => `₦${value}`,
  slugToName: (slug: string) => slug,
}));
jest.mock('../registory/langchain.service', () => ({
  LangchainService: class LangchainService {},
}));
jest.mock('../registory/langraph.service', () => ({
  LangraphService: class LangraphService {},
}));
jest.mock('../registory/graph_persistence.service', () => ({
  GraphPersistenceService: class GraphPersistenceService {},
}));
jest.mock('../registory/repositories', () => ({
  ModelRessolver: class ModelRessolver {},
}));
jest.mock('@langchain/langgraph', () => {
  const actual = jest.requireActual('@langchain/langgraph');
  return {
    ...actual,
    interrupt: jest.fn(),
  };
});

import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { Command, interrupt } from '@langchain/langgraph';

import { AdvisorService } from './advisor.service';
import { ADVISOR_NODES, MEMORY_NAMESPACE } from './advisor.constants';
import { PROPOSE_ACTION_TOOL_NAME } from './advisor.tools';

describe('AdvisorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeService = (
    langGraph: unknown = {},
    actionExecutor: unknown = {},
    workflowActionExecutor: unknown = {
      executeAtomicBatch: jest.fn(),
    },
  ) =>
    new AdvisorService(
      {} as never,
      langGraph as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      actionExecutor as never,
      workflowActionExecutor as never,
    );

  const action = {
    kind: 'adjust_budget' as const,
    budgetId: 'budget-1',
    categorySlug: 'food',
    categoryName: 'Food',
    currentLimit: 40000,
    proposedLimit: 42000,
    reason: 'Food spending is trending above the current budget.',
  };

  const actionMessage = new AIMessage({
    content: '',
    tool_calls: [
      {
        name: PROPOSE_ACTION_TOOL_NAME,
        id: 'call-1',
        type: 'tool_call',
        args: action,
      },
    ],
  });

  describe('routeAfterRespond', () => {
    it('routes propose_action tool calls to the action node', () => {
      const service = makeService();
      const routeAfterRespond = (
        service as unknown as {
          routeAfterRespond: (state: { messages: AIMessage[] }) => string;
        }
      ).routeAfterRespond;

      const route = routeAfterRespond({
        messages: [actionMessage],
      });

      expect(route).toBe(ADVISOR_NODES.ACTION);
    });
  });

  describe('action node', () => {
    it('executes the proposed action when approval resumes true', async () => {
      (interrupt as jest.Mock).mockReturnValueOnce(true);
      const execute = jest.fn().mockResolvedValue({
        status: 'executed',
        message: 'Food budget updated to ₦42,000.',
      });
      const service = makeService({}, { execute });
      const actionNode = (
        service as unknown as {
          buildActionNode: () => (
            state: { messages: AIMessage[] },
            runtime: { context: { userId: string } },
          ) => Promise<{
            actionResult: {
              approved: boolean;
              status: string;
              message: string;
            };
            messages: ToolMessage[];
          }>;
        }
      ).buildActionNode();

      const result = await actionNode(
        { messages: [actionMessage] },
        { context: { userId: 'user-1' } },
      );

      expect(execute).toHaveBeenCalledWith(action, {
        userId: 'user-1',
      });
      expect(result.actionResult).toEqual({
        approved: true,
        status: 'executed',
        message: 'Food budget updated to ₦42,000.',
      });
      expect(result.messages[0].tool_call_id).toBe('call-1');
      expect(result.messages[0].content).toBe(
        'Food budget updated to ₦42,000.',
      );
    });

    it('stores rejected proposals in long-term memory', async () => {
      (interrupt as jest.Mock).mockReturnValueOnce({ approved: false });
      const execute = jest.fn();
      const store = { put: jest.fn() };
      const service = makeService({}, { execute });
      const actionNode = (
        service as unknown as {
          buildActionNode: () => (
            state: { messages: AIMessage[] },
            runtime: {
              context: { userId: string };
              store: typeof store;
            },
          ) => Promise<{
            actionResult: {
              approved: boolean;
              status: string;
              message: string;
            };
            messages: ToolMessage[];
          }>;
        }
      ).buildActionNode();

      const result = await actionNode(
        { messages: [actionMessage] },
        { context: { userId: 'user-1' }, store },
      );

      expect(execute).not.toHaveBeenCalled();
      expect(store.put).toHaveBeenCalledWith(
        ['user', 'user-1', MEMORY_NAMESPACE.REJECTIONS],
        expect.any(String),
        expect.objectContaining({
          kind: 'adjust_budget',
          action,
          rejectedAt: expect.any(String),
        }),
      );
      expect(result.actionResult.status).toBe('rejected');
      expect(result.messages[0].tool_call_id).toBe('call-1');
    });

    it('does not interrupt for invalid proposed action args', async () => {
      const execute = jest.fn();
      const service = makeService({}, { execute });
      const invalidActionMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: PROPOSE_ACTION_TOOL_NAME,
            id: 'call-invalid',
            type: 'tool_call',
            args: {
              kind: 'flag_subscription',
              recurringId: 'recurring-1',
              operation: 'adjust',
              name: 'Rent',
              reason: 'Potential duplicate yearly rent bill.',
            },
          },
        ],
      });
      const actionNode = (
        service as unknown as {
          buildActionNode: () => (
            state: { messages: AIMessage[] },
            runtime: { context: { userId: string } },
          ) => Promise<{
            actionResult: {
              approved: boolean;
              status: string;
              message: string;
            };
            messages: ToolMessage[];
            proposedAction?: unknown;
          }>;
        }
      ).buildActionNode();

      const result = await actionNode(
        { messages: [invalidActionMessage] },
        { context: { userId: 'user-1' } },
      );

      expect(interrupt).not.toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
      expect(result.proposedAction).toBeUndefined();
      expect(result.actionResult.status).toBe('execution_failed');
      expect(result.messages[0].tool_call_id).toBe('call-invalid');
      expect(result.messages[0].content).toContain(
        'The proposed action was missing internal execution details',
      );
      expect(result.messages[0].content).toContain(
        'Do not mention internal ids',
      );
    });
  });

  describe('respond node', () => {
    it('injects rejected actions into the system prompt so they are not re-proposed', async () => {
      const invoke = jest.fn().mockResolvedValue(new AIMessage('Okay.'));
      const bindTools = jest.fn(() => ({ invoke }));
      const service = makeService();
      (
        service as unknown as { respondModel: { bindTools: typeof bindTools } }
      ).respondModel = { bindTools };
      (service as unknown as { tools: [] }).tools = [];

      const store = {
        get: jest.fn().mockResolvedValue(undefined),
        search: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              value: {
                kind: 'adjust_budget',
                action,
                rejectedAt: '2026-06-25T00:00:00.000Z',
              },
            },
          ]),
      };
      const respondNode = (
        service as unknown as {
          buildRespondNode: () => (
            state: { messages: HumanMessage[]; summary?: string },
            runtime: {
              context: { userId: string; grantedScopes: never[] };
              store: typeof store;
            },
          ) => Promise<{ messages: AIMessage[] }>;
        }
      ).buildRespondNode();

      await respondNode(
        { messages: [new HumanMessage('Raise my food budget again')] },
        {
          context: { userId: 'user-1', grantedScopes: [] },
          store,
        },
      );

      expect(store.search).toHaveBeenCalledWith(
        ['user', 'user-1', MEMORY_NAMESPACE.REJECTIONS],
        { query: 'Raise my food budget again', limit: expect.any(Number) },
      );
      const [messages] = invoke.mock.calls[0];
      const systemText = messages[0].content as string;
      expect(systemText).toContain('Previously rejected action proposals');
      expect(systemText).toContain('Do not re-propose');
      expect(systemText).toContain('adjust_budget');
      expect(systemText).toContain('food');
      expect(systemText).toContain('42000');
    });

    it('does not bind propose_action after an action has already resolved', async () => {
      const invoke = jest.fn().mockResolvedValue(new AIMessage('Done.'));
      const bindTools = jest.fn(() => ({ invoke }));
      const service = makeService();
      (
        service as unknown as { respondModel: { bindTools: typeof bindTools } }
      ).respondModel = { bindTools };
      (service as unknown as { tools: Array<{ name: string }> }).tools = [
        { name: PROPOSE_ACTION_TOOL_NAME },
        { name: 'get_recurring_items' },
      ];
      const store = {
        get: jest.fn().mockResolvedValue(undefined),
        search: jest.fn().mockResolvedValue([]),
      };
      const respondNode = (
        service as unknown as {
          buildRespondNode: () => (
            state: {
              messages: Array<HumanMessage | ToolMessage>;
              actionResult?: {
                approved: boolean;
                status: string;
                message: string;
              };
            },
            runtime: {
              context: { userId: string; grantedScopes: never[] };
              store: typeof store;
            },
          ) => Promise<{ messages: AIMessage[] }>;
        }
      ).buildRespondNode();

      await respondNode(
        {
          messages: [
            new HumanMessage('check anomalies'),
            new ToolMessage({
              content: 'Rent subscription cancelled.',
              tool_call_id: 'call-1',
            }),
          ],
          actionResult: {
            approved: true,
            status: 'executed',
            message: 'Rent subscription cancelled.',
          },
        },
        {
          context: { userId: 'user-1', grantedScopes: [] },
          store,
        },
      );

      expect(bindTools).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({ name: PROPOSE_ACTION_TOOL_NAME }),
        ]),
      );
      const [messages] = invoke.mock.calls[0];
      expect(messages[0].content).toContain(
        'Do not call propose_action again in this turn',
      );
    });

    it('passes graph history through without stale attachment sanitization', async () => {
      const invoke = jest.fn().mockResolvedValue(new AIMessage('Done.'));
      const bindTools = jest.fn(() => ({ invoke }));
      const service = makeService();
      (
        service as unknown as { respondModel: { bindTools: typeof bindTools } }
      ).respondModel = { bindTools };
      (service as unknown as { tools: [] }).tools = [];
      const store = {
        get: jest.fn().mockResolvedValue(undefined),
        search: jest.fn().mockResolvedValue([]),
      };
      const respondNode = (
        service as unknown as {
          buildRespondNode: () => (
            state: { messages: HumanMessage[] },
            runtime: {
              context: { userId: string; grantedScopes: never[] };
              store: typeof store;
            },
          ) => Promise<{ messages: AIMessage[] }>;
        }
      ).buildRespondNode();

      await respondNode(
        {
          messages: [
            new HumanMessage({
              content: [
                { type: 'text', text: 'Analyze this file' },
                {
                  type: 'image_url',
                  image_url: {
                    url: 'https://res.cloudinary.com/demo/image/upload/old.jpg',
                  },
                },
              ],
            }),
          ],
        },
        {
          context: { userId: 'user-1', grantedScopes: [] },
          store,
        },
      );

      const [messages] = invoke.mock.calls[0];
      const userMessage = messages[1] as HumanMessage;
      expect(userMessage.content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'image_url',
            image_url: {
              url: 'https://res.cloudinary.com/demo/image/upload/old.jpg',
            },
          }),
        ]),
      );
    });
  });

  describe('resumeResponse', () => {
    it('streams a rejection resume with the existing thread id', async () => {
      const streamEvents = jest.fn(async function* (
        _graph: unknown,
        _input: unknown,
        _opts: unknown,
      ) {
        yield { type: 'token', content: 'Done', node: ADVISOR_NODES.RESPOND };
      });
      const service = makeService({ streamEvents });
      (service as unknown as { graph: unknown }).graph = 'compiled-graph';

      const events: unknown[] = [];
      for await (const event of (
        service as unknown as {
          resumeResponse(input: {
            userId: string;
            conversationId: string;
            approved: boolean;
            grantedScopes: never[];
          }): AsyncGenerator<unknown>;
        }
      ).resumeResponse({
        userId: 'user-1',
        conversationId: 'conversation-1',
        approved: false,
        grantedScopes: ['BUDGETS' as never],
      })) {
        events.push(event);
      }

      expect(events).toEqual([
        { type: 'token', content: 'Done', node: ADVISOR_NODES.RESPOND },
      ]);
      expect(streamEvents).toHaveBeenCalledTimes(1);
      const [graph, input, opts] = streamEvents.mock.calls[0];
      expect(graph).toBe('compiled-graph');
      expect(input).toBeInstanceOf(Command);
      expect((input as Command).resume).toEqual({ approved: false });
      expect(opts).toMatchObject({
        context: {
          userId: 'user-1',
          grantedScopes: ['BUDGETS'],
        },
        configurable: {
          thread_id: 'conversation-1',
        },
      });
    });
  });

  describe('streamResponse attachments', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('adds uploaded advisor attachments to the human message content', async () => {
      const streamEvents = jest.fn(async function* (
        _graph: unknown,
        _input: unknown,
        _opts: unknown,
      ) {
        yield { type: 'token', content: 'Done', node: ADVISOR_NODES.RESPOND };
      });
      const service = makeService({ streamEvents });
      (service as unknown as { graph: unknown }).graph = 'compiled-graph';

      const events: unknown[] = [];
      for await (const event of (
        service as unknown as {
          streamResponse(input: {
            userId: string;
            conversationId: string;
            message: string;
            grantedScopes: never[];
            attachments: Array<{
              name: string;
              mimeType: string;
              url: string;
              extractedText?: string;
            }>;
          }): AsyncGenerator<unknown>;
        }
      ).streamResponse({
        userId: 'user-1',
        conversationId: 'conversation-1',
        message: 'Please review this statement.',
        grantedScopes: ['TRANSACTIONS' as never],
        attachments: [
          {
            name: 'statement.csv',
            mimeType: 'text/csv',
            url: 'https://res.cloudinary.com/demo/raw/upload/statement.csv',
            extractedText: 'date,amount\n2026-06-26,1000',
          },
        ],
      })) {
        events.push(event);
      }

      expect(events).toEqual([
        { type: 'token', content: 'Done', node: ADVISOR_NODES.RESPOND },
      ]);
      const [, input] = streamEvents.mock.calls[0] as unknown[];
      const human = (input as { messages: HumanMessage[] }).messages[0];
      expect(human.content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('Please review this statement.'),
          }),
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('statement.csv'),
          }),
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('date,amount'),
          }),
        ]),
      );
    });

    it('extracts image attachments once and stores only text in the graph input', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from('fake-image-bytes').buffer),
      }) as never;
      const streamEvents = jest.fn(async function* (
        _graph: unknown,
        _input: unknown,
        _opts: unknown,
      ) {
        yield { type: 'token', content: 'Done', node: ADVISOR_NODES.RESPOND };
      });
      const service = makeService({ streamEvents });
      (service as unknown as { graph: unknown }).graph = 'compiled-graph';
      (
        service as unknown as {
          respondModel: { invoke: jest.Mock };
        }
      ).respondModel = {
        invoke: jest
          .fn()
          .mockResolvedValue(new AIMessage('Visible receipt text')),
      };

      for await (const _event of (
        service as unknown as {
          streamResponse(input: {
            userId: string;
            conversationId: string;
            message: string;
            grantedScopes: never[];
            attachments: Array<{
              name: string;
              mimeType: string;
              url: string;
              sizeBytes: number;
              kind: 'image';
            }>;
          }): AsyncGenerator<unknown>;
        }
      ).streamResponse({
        userId: 'user-1',
        conversationId: 'conversation-1',
        message: 'What is in this receipt?',
        grantedScopes: ['TRANSACTIONS' as never],
        attachments: [
          {
            name: 'receipt.png',
            mimeType: 'image/png',
            url: 'https://res.cloudinary.com/demo/image/upload/receipt.png',
            sizeBytes: 16,
            kind: 'image',
          },
        ],
      })) {
        // drain
      }

      const [, input] = streamEvents.mock.calls[0] as unknown[];
      const human = (input as { messages: HumanMessage[] }).messages[0];
      expect(human.content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('Visible receipt text'),
          }),
        ]),
      );
      expect(JSON.stringify(human.content)).not.toContain('"image_url"');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('streamResponse workflow mode', () => {
    it('emits workflow lifecycle events and suppresses approval-required proposals', async () => {
      const streamEvents = jest.fn(async function* (
        _graph: unknown,
        _input: unknown,
        _opts: unknown,
      ) {
        yield {
          type: 'approval_required',
          action,
        };
        yield {
          type: 'token',
          content: 'Workflow result',
          node: ADVISOR_NODES.RESPOND,
        };
      });
      const service = makeService({ streamEvents });
      (service as unknown as { graph: unknown }).graph = 'compiled-graph';

      const events: unknown[] = [];
      for await (const event of (
        service as unknown as {
          streamResponse(input: {
            userId: string;
            conversationId: string;
            message: string;
            grantedScopes: never[];
          }): AsyncGenerator<unknown>;
        }
      ).streamResponse({
        userId: 'user-1',
        conversationId: 'conversation-1',
        message:
          'This is a workflow run. Do not directly propose actions or trigger approval_required. Run a cash flow forecast.',
        grantedScopes: ['BUDGETS' as never],
      })) {
        events.push(event);
      }

      expect(events).toEqual([
        expect.objectContaining({
          type: 'workflow_started',
          status: 'started',
        }),
        expect.objectContaining({
          type: 'workflow_progress',
          status: 'loading_context',
        }),
        expect.objectContaining({
          type: 'workflow_progress',
          status: 'fetching_records',
        }),
        expect.objectContaining({
          type: 'workflow_response_started',
          status: 'response_started',
        }),
        {
          type: 'token',
          content: 'Workflow result',
          node: ADVISOR_NODES.RESPOND,
        },
        expect.objectContaining({
          type: 'workflow_completed',
          status: 'completed',
        }),
      ]);
      expect(events).not.toContainEqual(
        expect.objectContaining({ type: 'approval_required' }),
      );
    });

    it('delegates approved workflow action batches without running the graph', async () => {
      const executeAtomicBatch = jest.fn().mockResolvedValue({
        status: 'executed',
        atomic: true,
        message: 'Food budget updated to ₦55,000.',
        candidateResults: [
          {
            candidateId: 'workflow-run-1-candidate-1',
            status: 'approved',
            message: 'Food budget updated to ₦55,000.',
          },
        ],
      });
      const streamEvents = jest.fn();
      const service = makeService({ streamEvents }, {}, { executeAtomicBatch });
      (service as unknown as { graph: unknown }).graph = 'compiled-graph';

      const events: unknown[] = [];
      for await (const event of (
        service as unknown as {
          streamResponse(input: {
            userId: string;
            conversationId: string;
            message: string;
            grantedScopes: never[];
          }): AsyncGenerator<unknown>;
        }
      ).streamResponse({
        userId: 'user-1',
        conversationId: 'conversation-1',
        message:
          'WORKFLOW_APPROVED_ACTIONS_JSON:' +
          JSON.stringify([
            {
              candidateId: 'workflow-run-1-candidate-1',
              action: {
                kind: 'adjust_budget',
                budgetId: 'budget-1',
                categorySlug: 'food',
                categoryName: 'Food',
                currentLimit: 40000,
                proposedLimit: 55000,
                reason: 'Workflow candidate approved by the user.',
              },
            },
          ]),
        grantedScopes: ['BUDGETS' as never],
      })) {
        events.push(event);
      }

      expect(streamEvents).not.toHaveBeenCalled();
      expect(executeAtomicBatch).toHaveBeenCalledWith(
        [
          {
            candidateId: 'workflow-run-1-candidate-1',
            action: expect.objectContaining({
              kind: 'adjust_budget',
              budgetId: 'budget-1',
              proposedLimit: 55000,
            }),
          },
        ],
        { userId: 'user-1' },
      );
      expect(events).toEqual([
        {
          type: 'workflow_action_batch_result',
          result: {
            status: 'executed',
            atomic: true,
            message: 'Food budget updated to ₦55,000.',
            candidateResults: [
              {
                candidateId: 'workflow-run-1-candidate-1',
                status: 'approved',
                message: 'Food budget updated to ₦55,000.',
              },
            ],
          },
        },
        {
          type: 'token',
          content: 'Food budget updated to ₦55,000.',
          node: ADVISOR_NODES.RESPOND,
        },
      ]);
    });

    it('streams workflow batch failures returned by the workflow executor', async () => {
      const executeAtomicBatch = jest.fn().mockResolvedValue({
        status: 'execution_failed',
        atomic: true,
        message:
          'I could not apply those workflow changes because they span multiple execution areas. No financial changes were made.',
        candidateResults: [
          {
            candidateId: 'workflow-run-1-candidate-1',
            status: 'failed',
            message:
              'This selected change was not applied because the workflow batch must stay in one execution area.',
          },
          {
            candidateId: 'workflow-run-1-candidate-2',
            status: 'failed',
            message:
              'This selected change was not applied because the workflow batch must stay in one execution area.',
          },
        ],
      });
      const streamEvents = jest.fn();
      const service = makeService({ streamEvents }, {}, { executeAtomicBatch });
      (service as unknown as { graph: unknown }).graph = 'compiled-graph';

      const events: unknown[] = [];
      for await (const event of (
        service as unknown as {
          streamResponse(input: {
            userId: string;
            conversationId: string;
            message: string;
            grantedScopes: never[];
          }): AsyncGenerator<unknown>;
        }
      ).streamResponse({
        userId: 'user-1',
        conversationId: 'conversation-1',
        message:
          'WORKFLOW_APPROVED_ACTIONS_JSON:' +
          JSON.stringify([
            {
              candidateId: 'workflow-run-1-candidate-1',
              action: {
                kind: 'adjust_budget',
                budgetId: 'budget-1',
                categorySlug: 'food',
                categoryName: 'Food',
                currentLimit: 40000,
                proposedLimit: 55000,
                reason: 'Workflow candidate approved by the user.',
              },
            },
            {
              candidateId: 'workflow-run-1-candidate-2',
              action: {
                kind: 'suggest_recurring',
                name: 'Spectranet',
                amount: 18000,
                categorySlug: 'bills-utilities',
                frequency: 'MONTHLY',
                reason: 'Workflow candidate approved by the user.',
              },
            },
          ]),
        grantedScopes: ['BUDGETS' as never],
      })) {
        events.push(event);
      }

      expect(streamEvents).not.toHaveBeenCalled();
      expect(executeAtomicBatch).toHaveBeenCalledTimes(1);
      expect(events).toEqual([
        {
          type: 'workflow_action_batch_result',
          result: {
            status: 'execution_failed',
            atomic: true,
            message:
              'I could not apply those workflow changes because they span multiple execution areas. No financial changes were made.',
            candidateResults: [
              {
                candidateId: 'workflow-run-1-candidate-1',
                status: 'failed',
                message:
                  'This selected change was not applied because the workflow batch must stay in one execution area.',
              },
              {
                candidateId: 'workflow-run-1-candidate-2',
                status: 'failed',
                message:
                  'This selected change was not applied because the workflow batch must stay in one execution area.',
              },
            ],
          },
        },
        {
          type: 'token',
          content:
            'I could not apply those workflow changes because they span multiple execution areas. No financial changes were made.',
          node: ADVISOR_NODES.RESPOND,
        },
      ]);
    });
  });

  describe('memory node', () => {
    it('schedules extraction in the background without blocking graph completion', async () => {
      let resolveExtraction: (value: unknown) => void = () => {};
      const extractionPromise = new Promise((resolve) => {
        resolveExtraction = resolve;
      });
      const invoke = jest.fn(() => extractionPromise);
      const langChain = {
        buildStructuredChain: jest.fn(() => ({ invoke })),
      };
      const service = makeService();
      (service as unknown as { langChain: typeof langChain }).langChain =
        langChain;
      const store = {
        get: jest.fn().mockResolvedValue(undefined),
        put: jest.fn().mockResolvedValue(undefined),
      };
      const memoryNode = (
        service as unknown as {
          buildMemoryNode: () => (
            state: {
              messages: Array<HumanMessage | AIMessage>;
              turnCount?: number;
            },
            runtime: {
              context: { userId: string };
              store: typeof store;
            },
          ) => Promise<{ turnCount: number }>;
        }
      ).buildMemoryNode();

      await expect(
        memoryNode(
          {
            turnCount: 2,
            messages: [
              new HumanMessage('I prefer a cautious savings plan.'),
              new AIMessage('Got it.'),
            ],
          },
          {
            context: { userId: 'user-1' },
            store,
          },
        ),
      ).resolves.toEqual({ turnCount: 3 });
      expect(invoke).toHaveBeenCalledTimes(1);
      expect(store.put).not.toHaveBeenCalled();

      resolveExtraction({
        parsed: {
          currency: 'NGN',
          tone: 'concise',
          context: [],
          patterns: [],
        },
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(store.put).toHaveBeenCalledWith(
        ['user', 'user-1', MEMORY_NAMESPACE.PREFERENCES],
        'profile',
        expect.objectContaining({
          currency: 'NGN',
          tone: 'concise',
        }),
        false,
      );
    });
  });

  describe('toChunk', () => {
    it('maps workflow lifecycle events to workflow chunks', () => {
      const service = makeService();

      const chunk = service.toChunk({
        type: 'workflow_progress',
        status: 'analyzing',
        stageIndex: 3,
        stageLabel: 'Analyzing your finances',
        message: 'Analyzing your finances',
      } as never);

      expect(chunk).toEqual({
        type: 'workflow_progress',
        content: 'Analyzing your finances',
        data: JSON.stringify({
          status: 'analyzing',
          stageIndex: 3,
          stageLabel: 'Analyzing your finances',
          message: 'Analyzing your finances',
        }),
      });
    });

    it('maps direct workflow action batch results to workflow_action_batch_result chunks', () => {
      const service = makeService();

      const chunk = service.toChunk({
        type: 'workflow_action_batch_result',
        result: {
          status: 'executed',
          atomic: true,
          message: 'Food budget updated to ₦55,000.',
          candidateResults: [
            {
              candidateId: 'workflow-run-1-candidate-1',
              status: 'approved',
              message: 'Food budget updated to ₦55,000.',
            },
          ],
        },
      } as never);

      expect(chunk).toEqual({
        type: 'workflow_action_batch_result',
        content: '',
        data: JSON.stringify({
          status: 'executed',
          atomic: true,
          message: 'Food budget updated to ₦55,000.',
          candidateResults: [
            {
              candidateId: 'workflow-run-1-candidate-1',
              status: 'approved',
              message: 'Food budget updated to ₦55,000.',
            },
          ],
        }),
      });
    });

    it('emits action_result chunks when the action node updates execution status', () => {
      const service = makeService();

      const chunk = service.toChunk({
        type: 'state',
        node: ADVISOR_NODES.ACTION,
        state: {
          messages: [],
          actionResult: {
            approved: true,
            status: 'execution_failed',
            message:
              'I could not create that recurring item just now. No financial changes were made.',
          },
        },
      } as never);

      expect(chunk).toEqual({
        type: 'action_result',
        content: '',
        data: JSON.stringify({
          approved: true,
          status: 'execution_failed',
          message:
            'I could not create that recurring item just now. No financial changes were made.',
        }),
      });
    });
  });
});
