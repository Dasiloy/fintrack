import { Runnable } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { InteropZodType } from '@langchain/core/utils/types';
import { ToolInterface } from '@langchain/core/tools';
import { StructuredOutputMethodOptions } from '@langchain/core/language_models/base';
import {
  BaseCheckpointSaver,
  BaseStore,
  StreamMode,
} from '@langchain/langgraph';

import { ChatModelId } from '@fintrack/types/interfaces/ai';

export interface BuildChainOptions<TInput = BaseMessage[], TOutput = string> {
  modelId: ChatModelId;
  tools?: ToolInterface[] | null;
  prompt?: Runnable<TInput, BaseMessage[]> | null;
  parser?: Runnable<BaseMessage, TOutput> | null;
}

export interface BuildStructuredChainOptions<
  TOutput extends Record<string, unknown>,
> {
  modelId: ChatModelId;
  schema: InteropZodType<TOutput>;
  tools?: ToolInterface[] | null;
  prompt?: Runnable<BaseMessage[], BaseMessage[]> | null;
  structuredOutputOptions?: Pick<
    StructuredOutputMethodOptions<false>,
    'name' | 'method' | 'strict'
  >;
}

export interface CompileGraphOptions {
  // 'memory' → new MemorySaver()  |  BaseCheckpointSaver → passed through  |  false → stateless
  checkpointer?: BaseCheckpointSaver | 'memory' | false;
  // 'memory' → new InMemoryStore()  |  BaseStore → passed through (e.g. PostgresStore-backed)  |  false → none
  store?: BaseStore | 'memory' | false;
}

export interface InvokeGraphOptions<
  TConfig = Record<string, unknown>,
  TContext = Record<string, unknown>,
> {
  threadId?: string;
  configurable?: TConfig;
  context?: TContext;
}

export interface StreamGraphOptions<
  TConfig = Record<string, unknown>,
  TContext = Record<string, unknown>,
> extends InvokeGraphOptions<TConfig, TContext> {
  streamMode?: StreamMode | StreamMode[];
}

// Discriminated union yielded by LangGraphService.streamEvents()
export type GraphStreamEvent<TState> =
  | { type: 'token'; content: string }
  | { type: 'state'; node: string; state: Partial<TState> }
  | { type: 'approval_required'; action: AdvisorAction }; // human-in-the-loop pause

// Advisor action types — proposals requiring explicit user approval before execution
export type AdvisorAction =
  | {
      kind: 'adjust_budget';
      budgetId: string;
      categorySlug: string;
      currentLimit: number;
      proposedLimit: number;
      reason: string;
    }
  | {
      kind: 'create_budget';
      categorySlug: string;
      proposedLimit: number;
      reason: string;
    }
  | {
      kind: 'adjust_goal_contribution';
      goalId: string;
      currentAmount: number;
      proposedAmount: number;
      reason: string;
    }
  | {
      kind: 'suggest_recurring';
      name: string;
      amount: number;
      categorySlug: string;
      frequency: string;
      reason: string;
    }
  | {
      kind: 'flag_subscription';
      name: string;
      amount: number;
      categorySlug: string;
      reason: string;
    };
