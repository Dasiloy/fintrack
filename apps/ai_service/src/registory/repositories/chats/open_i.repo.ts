import OpenAI, { toFile } from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ModelConfig } from '@fintrack/types/interfaces/ai';

import { ChatMessage, LlmRepo, toApiRole } from './llm.repo';

/**
 * OpenAI provider repository.
 *
 * Wraps two separate clients:
 * - **`ChatOpenAI`** (LangChain) — returned by `getRunnable()` for use in
 *   LangChain chains and LangGraph nodes.
 * - **`OpenAI`** (native SDK) — used directly in `stream()`, `transcribe()`,
 *   `synthesize()`, and `summarize()` for capabilities not exposed by LangChain.
 *
 * Both clients are lazily instantiated and reused across calls.
 *
 * ## Supported capabilities
 * | Method       | Model used          | Notes                              |
 * |--------------|---------------------|------------------------------------|
 * | getRunnable  | caller-supplied     | Returns LangChain BaseChatModel    |
 * | stream       | caller-supplied     | SSE token stream via native SDK    |
 * | transcribe   | whisper-1           | Audio → text                       |
 * | synthesize   | tts-1 (alloy voice) | Text → audio bytes                 |
 * | summarize    | gpt-4o-mini         | Cheap compression of long history  |
 *
 * ## Required env vars
 * `OPENAI_API_KEY` — throws at startup if absent.
 */
@Injectable()
export class OpenAiRepo extends LlmRepo {
  private _openai: OpenAI | null = null;
  protected readonly logger = new Logger(OpenAiRepo.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  /**
   * Returns a LangChain `ChatOpenAI` instance bound to the given model config.
   * Suitable for `.invoke()`, `.stream()`, `.withStructuredOutput()`, and
   * direct wiring into LangGraph nodes.
   */
  getRunnable(opts: ModelConfig): BaseChatModel {
    return new ChatOpenAI({
      model: opts.model,
      cache: opts.cache,
      timeout: opts.timeout,
      maxTokens: opts.maxTokens,
      streaming: opts.streaming,
      temperature: opts.temperature,
      apiKey: this.configService.getOrThrow('OPENAI_API_KEY'),
    });
  }

  /**
   * Streams chat completion tokens using the native OpenAI SDK.
   *
   * OpenAI SSE chunks arrive as `choices[0].delta.content` — empty deltas
   * (role announcements, finish signals) are filtered out so only text tokens
   * are yielded.
   *
   * @param tools - Optional function-calling tools to attach to the request.
   */
  async *stream(
    messages: ChatMessage[],
    opts: ModelConfig,
    tools?: OpenAI.Chat.Completions.ChatCompletionTool[],
  ): AsyncIterable<string> {
    const completions = await this.openai.chat.completions.create({
      stream: true,
      model: opts.model,
      temperature: opts.temperature,
      max_completion_tokens: opts.maxTokens,
      messages: messages.map((m) => ({
        role: toApiRole(m),
        content: m.content as string,
      })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      tools,
    });

    for await (const chunk of completions) {
      const token = chunk.choices[0].delta?.content;
      if (token) yield token;
    }
  }

  /**
   * Transcribes audio to text using OpenAI Whisper (`whisper-1`).
   * The audio buffer is wrapped in a `File` object before sending because
   * the Whisper API requires a named file with a MIME type.
   */
  async transcribe(audio: Buffer, mimeType: string): Promise<string> {
    const file = await toFile(audio, 'audio.webm', { type: mimeType });
    const result = await this.openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
      prompt: 'Clear transacription required as much as possible',
    });
    return result.text;
  }

  /**
   * Synthesizes text to speech using OpenAI TTS-1 (`alloy` voice).
   * Returns raw audio as a `Buffer` — the caller is responsible for
   * setting the correct `Content-Type` (typically `audio/mpeg`) when
   * forwarding to clients.
   */
  async synthesize(text: string): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Summarizes a conversation history into a single string using `gpt-4o-mini`.
   * Intended for compressing long chat histories before re-injecting them as
   * a condensed system message — keeps token costs low on subsequent turns.
   */
  async summarize(messages: ChatMessage[]): Promise<string> {
    const result = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Summarize this conversation preserving names, decisions, and key facts.',
        },
        ...(messages.map((m) => ({
          role: toApiRole(m),
          content: m.content as string,
        })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
      ],
    });
    return result.choices[0]?.message?.content ?? '';
  }

  /** Lazily instantiates and reuses the native OpenAI SDK client. */
  private get openai(): OpenAI {
    if (!this._openai) {
      this._openai = new OpenAI({
        apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      });
    }
    return this._openai;
  }
}
