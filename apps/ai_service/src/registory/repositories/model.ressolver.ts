import { status } from '@grpc/grpc-js';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { MODEL_CONFIGS } from '@fintrack/types/constants/ai.constants';
import {
  ChatModelId,
  EmbeddingModelId,
  ModelConfig,
  ModelId,
  ModelProviderEnum,
  ModelProviderConfig,
  ModleProvider,
} from '@fintrack/types/interfaces/ai';

import { AnthropicRepo, GoogleRepo, OpenAiRepo } from './chats';
import { GoogleEmbeddingRepo, OpenAiEmbeddingRepo } from './embeddings';

// ─── Chat conditional types ───────────────────────────────────────────────────

/**
 * Extracts the provider from a `ChatModelId` string literal at compile time.
 * Falls through to ANTHROPIC for any non-OpenAI, non-Google prefix.
 */
type ProviderOf<T extends ChatModelId> =
  T extends `${ModelProviderEnum.OPENAI}:${string}`
    ? ModelProviderEnum.OPENAI
    : T extends `${ModelProviderEnum.GOOGLE}:${string}`
      ? ModelProviderEnum.GOOGLE
      : ModelProviderEnum.ANTHROPIC;

/**
 * Maps a provider enum value to its concrete chat repository class.
 */
type RepoFor<P extends ModleProvider> = P extends ModelProviderEnum.OPENAI
  ? OpenAiRepo
  : P extends ModelProviderEnum.GOOGLE
    ? GoogleRepo
    : AnthropicRepo;

// ─── Embedding conditional types ─────────────────────────────────────────────

/**
 * Extracts the provider from an `EmbeddingModelId` string literal at compile time.
 * Only OpenAI and Google support embeddings; the type union reflects that.
 */
type EmbeddingProviderOf<T extends EmbeddingModelId> =
  T extends `${ModelProviderEnum.OPENAI}:${string}`
    ? ModelProviderEnum.OPENAI
    : ModelProviderEnum.GOOGLE;

/**
 * Maps a provider enum value to its concrete embedding repository class.
 */
type EmbeddingRepoFor<P extends ModleProvider> =
  P extends ModelProviderEnum.OPENAI
    ? OpenAiEmbeddingRepo
    : GoogleEmbeddingRepo;

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Platform-agnostic resolver that maps a `ModelId` to the correct provider
 * repository at both runtime and compile time.
 *
 * Consumers never import individual repo classes — they inject `ModelRessolver`
 * and call the appropriate method to get a fully-typed instance back.
 *
 * Two separate resolution paths exist to enforce the chat/embedding split:
 * - `getRunnable` / `getRepo` — for chat and reasoning models (`ChatModelId`)
 * - `getEmbeddingRepo` — for embedding models (`EmbeddingModelId`)
 *
 * Passing an embedding ID to a chat method (or vice versa) is a **compile-time
 * type error** — it cannot happen at runtime.
 *
 * ---
 *
 * ## Adding a new provider (e.g. Cohere)
 *
 * **1. Create the repo classes**
 * ```
 * registory/repositories/cohere.repo.ts          (extends LlmRepo, if chat)
 * registory/repositories/cohere-embedding.repo.ts (extends EmbeddingRepo)
 * ```
 *
 * **2. Add the provider to `ModleProvider` and `ModelProviderEnum`**
 * ```ts
 * export type ModleProvider = '...' | 'cohere';
 * export enum ModelProviderEnum { ..., COHERE = 'cohere' }
 * ```
 *
 * **3. Add model IDs to `ChatModelId` and/or `EmbeddingModelId`**
 * ```ts
 * | 'cohere:command-r-plus'
 * | 'cohere:embed-english-v3.0'
 * ```
 *
 * **4. Add configs to `MODEL_CONFIGS`**
 *
 * **5. Extend the conditional types in this file**
 * ```ts
 * type ProviderOf<T extends ChatModelId> =
 *   ...
 *   : T extends `${ModelProviderEnum.COHERE}:${string}` ? ModelProviderEnum.COHERE
 *   : ModelProviderEnum.ANTHROPIC;
 *
 * type RepoFor<P> = ... : P extends ModelProviderEnum.COHERE ? CohereRepo : AnthropicRepo;
 *
 * type EmbeddingProviderOf<T extends EmbeddingModelId> =
 *   ...
 *   : T extends `${ModelProviderEnum.COHERE}:${string}` ? ModelProviderEnum.COHERE
 *   : ModelProviderEnum.GOOGLE;
 *
 * type EmbeddingRepoFor<P> = ... : P extends ModelProviderEnum.COHERE ? CohereEmbeddingRepo : GoogleEmbeddingRepo;
 * ```
 *
 * **6. Inject the new repo(s) and add switch cases below**
 *
 * **7. Register in `RegistoryModule` providers array**
 */
@Injectable()
export class ModelRessolver {
  constructor(
    private readonly openaiRepo: OpenAiRepo,
    private readonly anthropicRepo: AnthropicRepo,
    private readonly googleRepo: GoogleRepo,
    private readonly openaiEmbeddingRepo: OpenAiEmbeddingRepo,
    private readonly googleEmbeddingRepo: GoogleEmbeddingRepo,
  ) {}

  /**
   * Returns a LangChain `BaseChatModel` for the given chat model ID.
   * Use this when you need a runnable for a LangChain chain or LangGraph node
   * and don't need provider-specific capabilities.
   */
  getRunnable(modelId: ChatModelId): BaseChatModel {
    const [provider, config] = this.getModelConfig(modelId);
    switch (provider) {
      case ModelProviderEnum.OPENAI:
        return this.openaiRepo.getRunnable(config);
      case ModelProviderEnum.ANTHROPIC:
        return this.anthropicRepo.getRunnable(config);
      case ModelProviderEnum.GOOGLE:
        return this.googleRepo.getRunnable(config);
      default:
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Provider not supported',
        });
    }
  }

  /**
   * Returns the concrete chat provider repo for the given model ID.
   * The return type is narrowed at compile time — no casting needed on the
   * caller side. Use this to access provider-specific methods like `stream`,
   * `transcribe`, `synthesize`, or `summarize`.
   */
  getRepo<T extends ChatModelId>(modelId: T): RepoFor<ProviderOf<T>> {
    const [provider] = this.getModelConfig(modelId);
    switch (provider) {
      case ModelProviderEnum.ANTHROPIC:
        return this.anthropicRepo as RepoFor<ProviderOf<T>>;
      case ModelProviderEnum.OPENAI:
        return this.openaiRepo as RepoFor<ProviderOf<T>>;
      case ModelProviderEnum.GOOGLE:
        return this.googleRepo as RepoFor<ProviderOf<T>>;
      default:
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Provider not supported',
        });
    }
  }

  /**
   * Returns the concrete embedding repo for the given embedding model ID.
   * The return type is narrowed at compile time — `openai:*` IDs return
   * `OpenAiEmbeddingRepo`, `google:*` IDs return `GoogleEmbeddingRepo`.
   *
   * Use `getEmbeddings(opts)` on the returned repo for LangChain vector
   * store integration, or `embed(texts, opts)` for raw pgvector writes.
   */
  getEmbeddingRepo<T extends EmbeddingModelId>(
    modelId: T,
  ): EmbeddingRepoFor<EmbeddingProviderOf<T>> {
    const [provider] = this.getModelConfig(modelId);
    switch (provider) {
      case ModelProviderEnum.OPENAI:
        return this.openaiEmbeddingRepo as EmbeddingRepoFor<
          EmbeddingProviderOf<T>
        >;
      case ModelProviderEnum.GOOGLE:
        return this.googleEmbeddingRepo as EmbeddingRepoFor<
          EmbeddingProviderOf<T>
        >;
      default:
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: `Provider '${provider}' does not support embeddings`,
        });
    }
  }

  /**
   * Looks up the `ModelProviderConfig` for the given ID and splits it into
   * `[provider, modelConfig]`. Throws a gRPC `FAILED_PRECONDITION` if the ID
   * is missing or not registered in `MODEL_CONFIGS`.
   */
  private getModelConfig(modelId: ModelId): [ModleProvider, ModelConfig] {
    if (!modelId)
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Model ID required',
      });

    const modelProviderConfig: ModelProviderConfig = MODEL_CONFIGS[modelId];
    if (!modelProviderConfig)
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Model '${modelId}' is not supported`,
      });

    const { provider, ...modelConfig } = modelProviderConfig;
    return [provider, modelConfig];
  }
}
