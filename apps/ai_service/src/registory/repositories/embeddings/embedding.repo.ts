import { Embeddings } from '@langchain/core/embeddings';

import { Injectable } from '@nestjs/common';

import { ModelConfig } from '@fintrack/types/interfaces/ai';

/**
 * Abstract base class for all embedding provider repositories.
 *
 * Embedding and chat are orthogonal capabilities — not every LLM provider
 * supports both. This class is intentionally separate from `LlmRepo` so
 * providers that only support chat (e.g. Anthropic) are never forced to
 * implement an embedding interface.
 *
 * ## Contract
 * - `getEmbeddings` — returns a LangChain `Embeddings` instance for integration
 *   with vector stores (PGVector, Pinecone, etc.). Use this when wiring
 *   embeddings into LangGraph retrieval nodes.
 * - `embed` — raw batch embed. Use this for direct pgvector inserts
 *   (e.g. storing transaction embeddings on write).
 * - `embedOne` — convenience wrapper around `embed` for single-text use.
 *   Provided by the base class; subclasses do not need to override it.
 *
 * ## Adding a new provider
 * 1. Create a class that extends `EmbeddingRepo` (e.g. `CohereEmbeddingRepo`)
 * 2. Implement `getEmbeddings` and `embed`
 * 3. Add the provider to `EmbeddingRepoFor` in `model.resolver.ts`
 * 4. Inject and register in `RegistoryModule`
 */
@Injectable()
export abstract class EmbeddingRepo {
  /**
   * Returns a LangChain `Embeddings` instance configured for the given model.
   * Pass this directly to LangChain vector store constructors:
   * ```ts
   * const store = await PGVectorStore.initialize(repo.getEmbeddings(opts), pgConfig);
   * ```
   */
  abstract getEmbeddings(opts: ModelConfig): Embeddings;

  /**
   * Embeds a batch of texts, returning one vector per input string.
   * Prefer batching over calling `embedOne` in a loop — providers charge
   * the same per token regardless of batch size, and batching reduces
   * round-trip overhead significantly.
   */
  abstract embed(texts: string[], opts: ModelConfig): Promise<number[][]>;

  /**
   * Convenience wrapper: embeds a single text and returns its vector.
   * Delegates to `embed` internally.
   */
  async embedOne(text: string, opts: ModelConfig): Promise<number[]> {
    const [vector] = await this.embed([text], opts);
    return vector;
  }
}
