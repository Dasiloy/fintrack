import { GoogleGenAI } from '@google/genai';
import { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ModelConfig } from '@fintrack/types/interfaces/ai';

import { EmbeddingRepo } from './embedding.repo';

/**
 * Google Generative AI embedding repository.
 *
 * Two clients are maintained:
 * - **`GoogleGenerativeAIEmbeddings`** (LangChain) — returned by `getEmbeddings()`
 *   for use with LangChain vector stores (PGVector, Chroma, etc.).
 * - **`GoogleGenAI`** (new SDK) — used in `embed()` for direct pgvector writes,
 *   bypassing the LangChain abstraction for lower overhead.
 *
 * ## Supported models
 * | Model ID               | Default dims | Notes                             |
 * |------------------------|--------------|-----------------------------------|
 * | gemini-embedding-2     | 3072         | Matryoshka — truncatable to 1536  |
 * | text-embedding-004     | 768          | General-purpose                   |
 *
 * Pass `dimensions` in `ModelConfig` to set `outputDimensionality` on the request.
 *
 * ## Required env vars
 * `GOOGLE_GEN_AI_API_KEY` — Google AI Studio API key. Throws at startup if absent.
 */
@Injectable()
export class GoogleEmbeddingRepo extends EmbeddingRepo {
  private _genai: GoogleGenAI | null = null;
  protected readonly logger = new Logger(GoogleEmbeddingRepo.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  /**
   * Returns a `GoogleGenerativeAIEmbeddings` LangChain instance for vector
   * store integration (PGVector, Chroma, etc.).
   */
  getEmbeddings(opts: ModelConfig): Embeddings {
    return new GoogleGenerativeAIEmbeddings({
      model: opts.model,
      apiKey: this.configService.getOrThrow('GOOGLE_GEN_AI_API_KEY'),
    });
  }

  /**
   * Embeds a batch of texts using the `@google/genai` SDK.
   *
   * **Important:** `gemini-embedding-2` aggregates multiple inputs into one
   * embedding when passed as an array — so each text is embedded in its own
   * request, parallelised with Promise.all.
   *
   * Passes `outputDimensionality` when `opts.dimensions` is set — required to
   * truncate gemini-embedding-2's default 3072 dims to the target vector size.
   */
  async embed(texts: string[], opts: ModelConfig): Promise<number[][]> {
    const responses = await Promise.all(
      texts.map((text) =>
        this.genai.models.embedContent({
          model: opts.model,
          contents: text,
          config: {
            taskType: 'SEMANTIC_SIMILARITY',
            outputDimensionality: opts.dimensions,
          },
        }),
      ),
    );

    return responses.map((r) => r.embeddings?.[0]?.values ?? []);
  }

  /** Lazily instantiates and reuses the Google GenAI client. */
  private get genai(): GoogleGenAI {
    if (!this._genai) {
      this._genai = new GoogleGenAI({
        apiKey: this.configService.getOrThrow('GOOGLE_GEN_AI_API_KEY'),
      });
    }
    return this._genai;
  }
}
