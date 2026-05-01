import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';

import { Injectable } from '@nestjs/common';

import type {
  BuildChainOptions,
  BuildStructuredChainOptions,
} from './lang.types';
import { ModelRessolver } from './repositories';

/**
 * Factory service for building LangChain runnable pipelines.
 *
 * Wraps `ModelRessolver` to provide two chain-building helpers used across
 * feature modules:
 *
 * - **`buildChain`** — composes `prompt → model → parser` with an optional
 *   `StringOutputParser` as the default output stage.  Tool-binding is wired in
 *   when `tools` are supplied.  Returns an untyped runnable whose output type
 *   is determined by the parser generic.
 *
 * - **`buildStructuredChain`** — like `buildChain` but calls
 *   `model.withStructuredOutput(schema, { includeRaw: true, strict? })` so the
 *   chain returns `{ raw: BaseMessage, parsed: TOutput }`.  Callers should
 *   guard `result.parsed` for `null` — the model can truncate output under high
 *   load, which yields a null parsed value without throwing.
 *
 * Both methods accept an optional `prompt` runnable; when omitted the model is
 * called directly without a template.
 */
@Injectable()
export class LangchainService {
  constructor(private readonly modelRessolver: ModelRessolver) {}

  /**
   * Builds a plain LangChain runnable pipeline: `[prompt →] model → parser`.
   *
   * - When `opts.prompt` is provided the pipeline is `prompt.pipe(model).pipe(parser)`.
   * - When omitted the pipeline is just `model.pipe(parser)`.
   * - `opts.parser` defaults to `StringOutputParser` (returns raw text string).
   * - `opts.tools` binds function-calling tools to the model before piping.
   */
  buildChain<TInput = BaseMessage[], TOutput = string>(
    opts: BuildChainOptions<TInput, TOutput>,
  ) {
    const parser = (opts.parser ?? new StringOutputParser()) as Runnable<
      BaseMessage,
      TOutput
    >;
    const model = this.modelRessolver.getRunnable(opts.modelId);

    if (
      opts.tools &&
      opts.tools.length &&
      'bindTools' in model &&
      typeof model.bindTools === 'function'
    ) {
      model.bindTools(opts.tools);
    }

    if (opts.prompt) {
      return opts.prompt.pipe(model).pipe(parser);
    }

    return model.pipe(parser);
  }

  /**
   * Builds a structured-output LangChain pipeline using `model.withStructuredOutput`.
   *
   * Always passes `includeRaw: true` so the returned runnable yields
   * `{ raw: BaseMessage, parsed: TOutput | null }`.  Callers **must** guard
   * `result.parsed` for `null` — the model can produce a truncated response
   * that parses to null without throwing.
   *
   * Pass `structuredOutputOptions.strict = true` to enable JSON-mode on
   * providers that support it (Gemini, OpenAI), which eliminates most
   * schema-violation failures.
   */
  buildStructuredChain<TOutput extends Record<string, unknown>>(
    opts: BuildStructuredChainOptions<TOutput>,
  ) {
    const model = this.modelRessolver.getRunnable(opts.modelId);
    const structuredModel = model.withStructuredOutput<TOutput>(opts.schema, {
      includeRaw: true,
      method: opts.structuredOutputOptions?.method,
      name: opts.structuredOutputOptions?.name,
      strict: opts.structuredOutputOptions?.strict,
    });

    if (
      opts.tools &&
      opts.tools.length &&
      'bindTools' in model &&
      typeof model.bindTools === 'function'
    ) {
      model.bindTools(opts.tools);
    }

    if (opts.prompt) {
      return opts.prompt.pipe(structuredModel);
    }

    return structuredModel;
  }
}
