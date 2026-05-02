import OpenAI from 'openai';
import { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ModelConfig } from '@fintrack/types/interfaces/ai';

import { EmbeddingRepo } from './embedding.repo';

/**
 * OpenAI embedding repository.
 *
 * Two clients are maintained:
 * - **`OpenAIEmbeddings`** (LangChain) — returned by `getEmbeddings()` for use
 *   with LangChain vector stores (PGVector, Chroma, etc.).
 * - **`OpenAI`** (native SDK) — used in `embed()` for direct pgvector writes,
 *   bypassing the LangChain abstraction layer for lower overhead.
 *
 * ## Supported models
 * | Model ID                          | Dimensions | Notes                   |
 * |-----------------------------------|------------|-------------------------|
 * | openai:text-embedding-3-small     | 1536       | Best cost/quality ratio |
 * | openai:text-embedding-3-large     | 3072       | Highest accuracy        |
 * | openai:text-embedding-ada-002     | 1536       | Legacy, kept for compat |
 *
 * ## Required env vars
 * `OPENAI_API_KEY` — throws at startup if absent.
 */
@Injectable()
export class OpenAiEmbeddingRepo extends EmbeddingRepo {
  private _openai: OpenAI | null = null;
  protected readonly logger = new Logger(OpenAiEmbeddingRepo.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  /**
   * Returns an `OpenAIEmbeddings` LangChain instance for vector store integration.
   *
   * Pass `opts.dimensions` to request reduced-dimension output from
   * `text-embedding-3-*` models — useful when your pgvector column is
   * narrower than the model's full output size.
   */
  getEmbeddings(opts: ModelConfig): Embeddings {
    return new OpenAIEmbeddings({
      model: opts.model,
      dimensions: opts.dimensions,
      apiKey: this.configService.getOrThrow('OPENAI_API_KEY'),
    });
  }

  /**
   * Embeds a batch of texts using the native OpenAI SDK.
   *
   * Sends a single `/v1/embeddings` request for the entire batch. OpenAI
   * accepts up to 2048 inputs per request; callers are responsible for
   * chunking larger batches.
   */
  async embed(texts: string[], opts: ModelConfig): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      input: texts,
      ...(opts || {}),
    });

    return response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }

  /** Lazily instantiates and reuses the native OpenAI SDK client. */
  private get openai(): OpenAI {
    if (!this._openai) {
      this._openai = new OpenAI({
        apiKey: this.configService.getOrThrow('OPENAI_API_KEY'),
      });
    }
    return this._openai;
  }
}
