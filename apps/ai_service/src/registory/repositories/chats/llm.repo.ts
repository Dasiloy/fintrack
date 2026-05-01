import { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { Injectable } from '@nestjs/common';

import { ModelConfig } from '@fintrack/types/interfaces/ai';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';

/**
 * Union of LangChain message types accepted by native provider `stream()` methods.
 *
 * `ToolMessage` is intentionally excluded. Each provider serialises tool results
 * in a completely different format (OpenAI requires `tool_call_id`, Anthropic
 * embeds results inside a `user` turn, Google uses `functionResponse` parts) — a
 * uniform role mapping cannot cover all three correctly.
 *
 * For conversations that include tool calls, use `getRunnable()` instead.
 * LangChain's `BaseChatModel.stream()` handles provider-specific tool message
 * serialisation internally.
 */
export type ChatMessage = AIMessage | HumanMessage | SystemMessage;

/**
 * Maps a LangChain message to the role string expected by provider APIs.
 * Uses `instanceof` checks — the correct approach since `getType()` is deprecated.
 * LangChain uses 'human' / 'ai' internally; provider APIs expect 'user' / 'assistant'.
 */
export function toApiRole(
  message: ChatMessage,
): 'user' | 'assistant' | 'system' {
  if (message instanceof HumanMessage) return 'user';
  if (message instanceof AIMessage) return 'assistant';
  return 'system';
}

/**
 * Abstract base class for all LLM provider repositories.
 *
 * Every provider (OpenAI, Anthropic, …) extends this class and must implement
 * the two core methods: `getRunnable` and `stream`. The optional helpers
 * (`transcribe`, `synthesize`, `summarize`) default to throwing so callers
 * know at runtime when a capability is absent rather than silently failing.
 *
 * ## Contract
 * - `getRunnable` — returns a LangChain `BaseChatModel` bound to the provider.
 *   Use this when integrating with LangChain chains or LangGraph nodes that
 *   expect a standard runnable interface.
 * - `stream` — yields raw text tokens one at a time as they arrive from the
 *   provider. Use this for real-time streaming to clients over SSE / WebSocket.
 *
 * ## Optional capabilities
 * Override `transcribe`, `synthesize`, or `summarize` if the underlying
 * provider SDK supports them. Leave them unoverridden to surface a clear
 * "not implemented" error instead of a silent no-op.
 */
@Injectable()
export abstract class LlmRepo {
  /**
   * Returns a LangChain `BaseChatModel` configured with the given options.
   * The model is ready to be used directly in `.invoke()`, `.stream()`,
   * or wired into a LangGraph `StateGraph` node.
   */
  abstract getRunnable(opts: ModelConfig): BaseChatModel;

  /**
   * Streams a chat completion token-by-token.
   *
   * Implemented as an async generator so callers can forward tokens
   * to the client incrementally via `for await`:
   * ```ts
   * for await (const token of repo.stream(messages, opts)) {
   *   res.write(token);
   * }
   * ```
   */
  abstract stream(
    messages: ChatMessage[],
    opts: ModelConfig,
  ): AsyncIterable<string>;

  /**
   * Transcribes audio bytes to text.
   * Override in provider repos that support speech-to-text (e.g. OpenAI Whisper).
   */
  async transcribe(_audio: Buffer, _mimeType: string): Promise<string> {
    throw new Error('transcribe not implemented by this provider');
  }

  /**
   * Synthesizes text to speech, returning raw audio bytes.
   * Override in provider repos that support TTS (e.g. OpenAI TTS-1).
   */
  async synthesize(_text: string): Promise<Buffer> {
    throw new Error('synthesize not implemented by this provider');
  }

  /**
   * Condenses a message history into a single summary string.
   * Useful for compressing long conversation context before re-injecting
   * it as a system message. Override in repos that support cheap summary models.
   */
  async summarize(_messages: ChatMessage[]): Promise<string> {
    throw new Error('summarize not implemented by this provider');
  }
}
