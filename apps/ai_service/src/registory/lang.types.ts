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

import { AdvisorAction, ChatModelId } from '@fintrack/types/interfaces/ai';

// Re-exported so existing imports from this module keep resolving.
export type { AdvisorAction };

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
  configurable?: TConfig;
  context?: TContext;
  /** Aborts the run when triggered — wired to the client/stream disconnect so a
   *  cancelled request stops the graph instead of running on. */
  signal?: AbortSignal;
}

export interface StreamGraphOptions<
  TConfig = Record<string, unknown>,
  TContext = Record<string, unknown>,
> extends InvokeGraphOptions<TConfig, TContext> {
  streamMode?: StreamMode | StreamMode[];
}

// Discriminated union yielded by LangGraphService.streamEvents()
export type GraphStreamEvent<TState> =
  // `node` is the graph node that produced the token (e.g. only stream `respond`).
  | { type: 'token'; content: string; node?: string }
  | { type: 'state'; node: string; state: Partial<TState> }
  // Human-in-the-loop pauses (surfaced from a graph `interrupt()`):
  | { type: 'approval_required'; action: AdvisorAction }; // an action awaiting Approve/Reject
