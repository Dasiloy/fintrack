import Anthropic from '@anthropic-ai/sdk';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ModelConfig } from '@fintrack/types/interfaces/ai';

import { SystemMessage } from '@langchain/core/messages';

import { ChatMessage, LlmRepo, toApiRole } from './llm.repo';

/**
 * Anthropic provider repository.
 *
 * Wraps two separate clients:
 * - **`ChatAnthropic`** (LangChain) — returned by `getRunnable()` for use in
 *   LangChain chains and LangGraph nodes.
 * - **`Anthropic`** (native SDK) — used directly in `stream()` to access the
 *   raw SSE event stream that the LangChain wrapper does not expose.
 *
 * Both clients are lazily instantiated and reused across calls.
 *
 * ## Supported capabilities
 * | Method      | Notes                                                      |
 * |-------------|------------------------------------------------------------|
 * | getRunnable | Returns LangChain `BaseChatModel` (chains / graph nodes)   |
 * | stream      | Token-by-token SSE stream via native Anthropic SDK         |
 *
 * `transcribe`, `synthesize`, and `summarize` are not supported — calls to
 * those methods will throw (inherited default from `LlmRepo`).
 *
 * ## Streaming event filtering
 * The Anthropic SDK emits several event types over the stream
 * (`message_start`, `content_block_start`, `content_block_delta`,
 * `content_block_stop`, `message_delta`, `message_stop`).
 * Only `content_block_delta` events with `delta.type === 'text_delta'`
 * carry actual text — all other events are discarded.
 *
 * ## Required env vars
 * `ANTHROPIC_API_KEY` — throws at startup if absent.
 */
@Injectable()
export class AnthropicRepo extends LlmRepo {
  private _anthropic: Anthropic | null = null;
  protected readonly logger = new Logger(AnthropicRepo.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  /**
   * Returns a LangChain `ChatAnthropic` instance bound to the given model config.
   * Suitable for `.invoke()`, `.stream()`, `.withStructuredOutput()`, and
   * direct wiring into LangGraph nodes.
   */
  getRunnable(opts: ModelConfig): BaseChatModel {
    return new ChatAnthropic({
      model: opts.model,
      cache: opts.cache,
      maxTokens: opts.maxTokens,
      streaming: opts.streaming,
      temperature: opts.temperature,
      apiKey: this.configService.getOrThrow('ANTHROPIC_API_KEY'),
    });
  }

  /**
   * Streams chat completion tokens using the native Anthropic SDK.
   *
   * Anthropic's stream emits many event types — only `content_block_delta`
   * with `delta.type === 'text_delta'` carries text. All other events
   * (start/stop markers, usage stats) are filtered out so only raw text
   * tokens are yielded to the caller.
   *
   * Falls back to `DEFAULT_CHAT_MAX_TOKENS` when `opts.maxTokens` is unset
   * because `max_tokens` is a required field in the Anthropic API.
   */
  async *stream(
    messages: ChatMessage[],
    opts: ModelConfig,
  ): AsyncIterable<string> {
    const systemMessage = messages.find((m) => m instanceof SystemMessage);
    const chatMessages = messages.filter((m) => !(m instanceof SystemMessage));

    const completions = await this.anthropic.messages.create({
      stream: true,
      model: opts.model,
      max_tokens: opts.maxTokens ?? 4096,
      ...(systemMessage && { system: systemMessage.content as string }),
      messages: chatMessages.map((m) => ({
        role: toApiRole(m) as 'user' | 'assistant',
        content: m.content as string,
      })),
    });

    for await (const chunk of completions) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }
  }

  /** Lazily instantiates and reuses the native Anthropic SDK client. */
  private get anthropic() {
    if (!this._anthropic) {
      this._anthropic = new Anthropic({
        apiKey: this.configService.getOrThrow('ANTHROPIC_API_KEY'),
      });
    }
    return this._anthropic;
  }
}
