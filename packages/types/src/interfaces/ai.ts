export type ModleProvider = 'openai' | 'anthropic' | 'google';

export enum ModelProviderEnum {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
}

// ─── Chat / reasoning model IDs ──────────────────────────────────────────────

export type ChatModelId =
  // OpenAI
  | 'openai:gpt-4o'
  | 'openai:gpt-4-turbo'
  | 'openai:gpt-3.5-turbo'
  | 'openai:gpt-5'
  | 'openai:gpt-5.4'
  | 'openai:gpt-5.4-mini'
  | 'openai:gpt-5.4-nano'
  | 'openai:gpt-5-mini'
  | 'openai:o3-mini'
  | 'openai:o4-mini'
  // Anthropic
  | 'anthropic:claude-3-5-sonnet'
  | 'anthropic:claude-3-opus'
  | 'anthropic:claude-sonnet-4.6'
  | 'anthropic:claude-opus-4.6'
  // Google — 2.5 series (current stable)
  | 'google:gemini-2.5-pro'
  | 'google:gemini-2.5-flash';

// ─── Canonical Google model constants ────────────────────────────────────────
// Import these instead of inlining raw strings so every usage stays in sync.

/** Gemini 2.5 Pro — deep reasoning, structured output, tool use. */
export const GOOGLE_GEMINI_2_5_PRO = 'google:gemini-2.5-pro' as const;
/** Gemini 2.5 Flash — fast, cost-efficient text generation and summarisation. */
export const GOOGLE_GEMINI_2_5_FLASH = 'google:gemini-2.5-flash' as const;

// ─── Embedding model IDs ──────────────────────────────────────────────────────

export type EmbeddingModelId =
  // OpenAI
  | 'openai:text-embedding-3-small'
  | 'openai:text-embedding-3-large'
  | 'openai:text-embedding-ada-002'
  // Google
  | 'google:gemini-embedding-2';

/** Union of all model IDs — use `ChatModelId` or `EmbeddingModelId` for narrowed paths. */
export type ModelId = ChatModelId | EmbeddingModelId;

// ─── Config interfaces ────────────────────────────────────────────────────────

export interface ModelConfig {
  model: string;
  cache?: boolean;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  streaming?: boolean;
  /** Output dimensionality — only relevant for embedding models. */
  dimensions?: number;
}

export interface ModelProviderConfig extends ModelConfig {
  provider: ModleProvider;
}
