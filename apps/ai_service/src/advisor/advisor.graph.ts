import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

import { AdvisorEndReason } from './advisor.constants';
import type { AdvisorAction } from '@fintrack/types/interfaces/ai';

/**
 * The guardian node's verdict as stored in state. `relevant` drives routing;
 * `reason` is set only when `relevant` is false and tells the reject node which
 * terminal message to return. The LLM only produces `relevant` — the `reason`
 * (including the empty-input and classifier-error cases) is decided by the node.
 */
export interface GuardianVerdict {
  relevant: boolean;
  reason?: AdvisorEndReason;
}

export interface AdvisorActionResult {
  approved: boolean;
  status: 'rejected' | 'executed' | 'execution_failed';
  message: string;
}

/**
 * LangGraph state for the advisor agent loop.
 *
 * This is the conversation state persisted per `thread_id` by the checkpointer.
 * It currently holds only what the guardian gate needs; later phases extend it
 * (e.g. `proposedAction`/`actionResult` for human-in-the-loop, `attachments` for
 * multimodal input). Adding a channel here is backward-compatible — existing
 * checkpoints simply fall back to the channel's `default`.
 *
 * Note: request-scoped identity like `userId` is intentionally NOT in state — it
 * is passed per run as `AdvisorContext` and read via `runtime.context`.
 *
 * ## Channels
 * - `messages` — the conversation history. Uses `messagesStateReducer` (the
 *   canonical chat reducer) which appends by default and understands message IDs
 *   and `RemoveMessage`, so later compaction can drop or replace messages safely.
 * - `guardianResult` — the verdict from the guardian node; drives the
 *   conditional edge into either the advisor body or the reject path.
 */
export const AdvisorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  summary: Annotation<string>({
    reducer: (left, right) => (right?.trim() ? right : (left ?? '')),
    default: () => '',
  }),
  guardianResult: Annotation<GuardianVerdict | null>({
    value: (_current, update) => update,
    default: () => null,
  }),
  /**
   * Completed-turn counter, persisted across the thread. Drives the long-term
   * memory write cadence (extract every Nth turn) and survives compaction since
   * it is its own channel, independent of `messages`.
   */
  turnCount: Annotation<number>({
    value: (_current, update) => update,
    default: () => 0,
  }),
  proposedAction: Annotation<AdvisorAction | null>({
    value: (_current, update) => update,
    default: () => null,
  }),
  actionResult: Annotation<AdvisorActionResult | null>({
    value: (_current, update) => update,
    default: () => null,
  }),
});

/** Convenience alias for the materialised advisor state shape. */
export type AdvisorStateType = typeof AdvisorState.State;
