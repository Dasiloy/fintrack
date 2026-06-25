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
  | 'google:gemini-2.5-flash'
  // Google — 3 series
  | 'google:gemini-3-flash-preview'
  | 'google:gemini-3.5-flash';

// ─── Canonical Google model constants ────────────────────────────────────────
// Import these instead of inlining raw strings so every usage stays in sync.

/** Gemini 2.5 Pro — deep reasoning, structured output, tool use. */
export const GOOGLE_GEMINI_2_5_PRO = 'google:gemini-2.5-pro' as const;
/** Gemini 2.5 Flash — fast, cost-efficient text generation and summarisation. */
export const GOOGLE_GEMINI_2_5_FLASH = 'google:gemini-2.5-flash' as const;
/** Gemini 3 Flash (preview) — moderate reasoning at low cost (e.g. summarisation). */
export const GOOGLE_GEMINI_3_FLASH_PREVIEW = 'google:gemini-3-flash-preview' as const;
/** Gemini 3.5 Flash — deep reasoning for the main advisor responses. */
export const GOOGLE_GEMINI_3_5_FLASH = 'google:gemini-3.5-flash' as const;

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

/** One streamed chunk, mirroring the gateway/proto `AdvisorChunkRes`. */
export interface AdvisorChunk {
  /** 'token' | 'approval_required' | 'permission_required' | 'error' */
  type: string;
  /** Text delta (token) or error message. */
  content: string;
  /** JSON payload for structured (non-token) chunks; '' otherwise. */
  data: string;
}

/**
 * An agentic action the advisor proposes and the user must approve before it
 * executes (human-in-the-loop). Shared by the AI service (which proposes and,
 * on approval, executes it) and the web client (which renders the approval
 * card), so it carries both the identifiers needed to execute the action and
 * the human-readable fields the card displays.
 */
export type AdvisorAction =
  | {
      kind: 'adjust_budget';
      budgetId: string;
      categorySlug: string;
      currentLimit: number;
      proposedLimit: number;
      reason: string;
    }
  | {
      kind: 'create_budget';
      categorySlug: string;
      proposedLimit: number;
      reason: string;
    }
  | {
      kind: 'adjust_goal_contribution';
      goalId: string;
      goalName: string;
      currentAmount: number;
      proposedAmount: number;
      reason: string;
    }
  | {
      kind: 'suggest_recurring';
      name: string;
      amount: number;
      categorySlug: string;
      frequency: string;
      reason: string;
    }
  | {
      kind: 'flag_subscription';
      /** Recurring item id from `get_recurring_items`; required for real writes. */
      recurringId: string;
      operation: 'cancel' | 'adjust';
      name: string;
      currentAmount: number;
      proposedAmount?: number;
      reason: string;
    };

// ─── Advisor conversations & consent ─────────────────────────────────────────
// Shared shapes for the advisor's consent state and chat-history surfaces.
// `AdvisorScope` / `AdvisorChatRole` mirror the Prisma enums of the same name —
// kept as string unions here so this (lower-level) package needs no dependency
// on `@fintrack/database`. They are structurally identical, so values typed by
// the Prisma enums remain assignable to these and vice versa.

export type AdvisorScope =
  | 'TRANSACTIONS'
  | 'BUDGETS'
  | 'GOALS'
  | 'RECURRING'
  | 'SPLITS'
  | 'ANALYTICS';

export type AdvisorChatRole = 'USER' | 'ASSISTANT';

export type AdvisorActionState =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'failed';

/** Structured UI metadata stored alongside a durable advisor chat message. */
export interface AdvisorMessageMetadata {
  proposedAction?: AdvisorAction | null;
  actionState?: AdvisorActionState;
}

/** Minimal context required to execute a user-approved advisor action. */
export interface AdvisorActionExecutionContext {
  userId: string;
}

/** Result returned to the advisor graph after an approved action runs. */
export interface AdvisorActionExecutionResult {
  status: 'executed' | 'execution_failed';
  message: string;
}

/** Payload staged by the gateway before opening the advisor SSE stream. */
export type AdvisorPendingPayload =
  | {
      userId: string;
      conversationId: string;
      message: string;
    }
  | {
      userId: string;
      conversationId: string;
      resume: { approved: boolean };
    };

/** Staged payload after gateway ownership checks and scope resolution. */
export type ConsumedAdvisorPending = (
  | { conversationId: string; message: string }
  | { conversationId: string; resume: { approved: boolean } }
) & { grantedScopes: AdvisorScope[] };

/** Advisor consent state returned by the scope endpoints. */
export interface AdvisorConsent {
  enabled: boolean;
  grantedScopes: AdvisorScope[];
}

/**
 * One row in the conversation history sidebar. Intentionally minimal — title +
 * recency only. Preview/message-count are omitted: they go stale on every turn
 * and aren't worth the sync cost.
 */
export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: Date;
}

/** One persisted message in a conversation transcript. */
export interface ConversationHistoryMessage {
  id: string;
  role: AdvisorChatRole;
  content: string;
  createdAt: Date;
  metadata?: AdvisorMessageMetadata | null;
}

/** A cursor-paginated page of messages (oldest→newest), `nextCursor` = older page. */
export interface ConversationMessagePage {
  messages: ConversationHistoryMessage[];
  nextCursor: string | null;
}
