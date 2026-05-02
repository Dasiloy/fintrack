import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage } from '@langchain/core/messages';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ModelConfig } from '@fintrack/types/interfaces/ai';

import { ChatMessage, LlmRepo, toApiRole } from './llm.repo';

/**
 * Google Generative AI (Gemini) chat provider repository.
 *
 * Two clients are maintained:
 * - **`ChatGoogleGenerativeAI`** (LangChain) — returned by `getRunnable()` for
 *   use in LangChain chains and LangGraph nodes.
 * - **`GoogleGenAI`** (new `@google/genai` SDK) — used in `stream()` for direct
 *   SSE access via the `chats` API, consistent with how `OpenAiRepo` and
 *   `AnthropicRepo` work.
 *
 * ## Streaming message conversion
 * LangChain `ChatMessage[]` are converted to the new SDK's `Content[]` format:
 * - `SystemMessage` → `systemInstruction` in the chat `config`
 * - All prior messages → `history: Content[]` (role `'user'` | `'model'`)
 * - Last message → `chat.sendMessageStream({ message })`
 *
 * ## Supported capabilities
 * | Method      | Client used  | Notes                                            |
 * |-------------|--------------|--------------------------------------------------|
 * | getRunnable | LangChain    | Returns `BaseChatModel` for chains / graph nodes |
 * | stream      | Native SDK   | Token-by-token SSE via `sendMessageStream`       |
 *
 * ## Required env vars
 * `GOOGLE_GEN_AI_API_KEY` — Google AI Studio API key. Throws at startup if absent.
 */
@Injectable()
export class GoogleRepo extends LlmRepo {
  private _genai: GoogleGenAI | null = null;
  protected readonly logger = new Logger(GoogleRepo.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  /**
   * Returns a `ChatGoogleGenerativeAI` LangChain instance configured with the
   * given model options. Suitable for `.invoke()`, `.stream()`,
   * `.withStructuredOutput()`, and direct wiring into LangGraph nodes.
   */
  getRunnable(opts: ModelConfig): BaseChatModel {
    return new ChatGoogleGenerativeAI({
      model: opts.model,
      maxOutputTokens: opts.maxTokens,
      temperature: opts.temperature,
      streaming: opts.streaming,
      apiKey: this.configService.getOrThrow('GOOGLE_GEN_AI_API_KEY'),
    });
  }

  /**
   * Streams chat completion tokens using the native `@google/genai` SDK.
   *
   * System messages are extracted and passed as `systemInstruction` in the
   * chat config. Prior messages become the `history` array; the last message
   * is sent as the current turn via `sendMessageStream`. Each chunk exposes a
   * `.text` getter that concatenates all text parts — empty chunks are skipped.
   */
  async *stream(
    messages: ChatMessage[],
    opts: ModelConfig,
  ): AsyncIterable<string> {
    const systemMessage = messages.find((m) => m instanceof SystemMessage);
    const chatMessages = messages.filter((m) => !(m instanceof SystemMessage));

    const history: Content[] = chatMessages.slice(0, -1).map((m) => ({
      role: toApiRole(m) === 'user' ? 'user' : 'model',
      parts: [{ text: m.content as string }],
    }));

    const chat = this.genai.chats.create({
      model: opts.model,
      config: {
        ...(systemMessage && {
          systemInstruction: systemMessage.content as string,
        }),
        maxOutputTokens: opts.maxTokens,
        temperature: opts.temperature,
      },
      history,
    });

    const currentTurn = chatMessages[chatMessages.length - 1];
    const stream = await chat.sendMessageStream({
      message: currentTurn.content as string,
    });

    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  }

  /** Lazily instantiates and reuses the native Google GenAI client. */
  private get genai(): GoogleGenAI {
    if (!this._genai) {
      this._genai = new GoogleGenAI({
        apiKey: this.configService.getOrThrow('GOOGLE_GEN_AI_API_KEY'),
      });
    }
    return this._genai;
  }
}
