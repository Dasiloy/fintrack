import { Global, Module } from '@nestjs/common';

import {
  OpenAiRepo,
  AnthropicRepo,
  GoogleRepo,
  OpenAiEmbeddingRepo,
  GoogleEmbeddingRepo,
  ModelRessolver,
} from './repositories';
import { LangchainService } from './langchain.service';
import { LangraphService } from './langraph.service';
import { GraphPersistenceService } from './graph_persistence.service';

/**
 * Global infrastructure module that registers all LLM provider repos and
 * exposes the three services that feature modules consume.
 *
 * Marked `@Global()` so every feature module can inject `ModelRessolver`,
 * `LangchainService`, and `LangraphService` without re-importing this module.
 *
 * ## Provided & exported
 * | Token                 | Role                                                        |
 * |-----------------------|-------------------------------------------------------------|
 * | `OpenAiRepo`          | OpenAI chat + TTS/Whisper provider (internal only)          |
 * | `AnthropicRepo`       | Anthropic Claude chat provider (internal only)              |
 * | `GoogleRepo`          | Gemini chat provider via `@google/genai` (internal only)    |
 * | `OpenAiEmbeddingRepo` | OpenAI text-embedding provider (internal only)              |
 * | `GoogleEmbeddingRepo` | Gemini embedding provider via `@google/genai` (internal only)|
 * | `ModelRessolver`      | Routes `ModelId` → correct repo at compile + runtime        |
 * | `LangchainService`    | Factory for LangChain chains and structured-output runnables|
 * | `LangraphService`     | Compile/invoke/stream helpers for LangGraph `StateGraph`s   |
 * | `GraphPersistenceService` | Postgres-backed checkpointer + store for stateful graphs|
 *
 * Provider repos are internal — inject `ModelRessolver` instead.
 */
@Global()
@Module({
  providers: [
    // Chat providers
    OpenAiRepo,
    AnthropicRepo,
    GoogleRepo,
    // Embedding providers
    OpenAiEmbeddingRepo,
    GoogleEmbeddingRepo,
    // Resolver — the single injection point for feature modules
    ModelRessolver,
    // Langchain Service
    LangchainService,
    LangraphService,
    // Durable LangGraph persistence (Postgres checkpointer + store)
    GraphPersistenceService,
  ],
  exports: [
    ModelRessolver,
    LangchainService,
    LangraphService,
    GraphPersistenceService,
  ],
})
export class RegistoryModule {}
