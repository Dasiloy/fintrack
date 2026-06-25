import {
  GOOGLE_GEMINI_2_5_FLASH,
  GOOGLE_GEMINI_3_FLASH_PREVIEW,
  GOOGLE_GEMINI_3_5_FLASH,
} from '@fintrack/types/interfaces/ai';
import type { AdvisorScope } from '@fintrack/types/interfaces/ai';

// ─── Models (chosen by reasoning depth to control cost) ───────────────────────

/**
 * Guardian relevance gate — the cheapest, fastest model. It only emits a single
 * boolean, so a ~200-token call here saves a full advisor round-trip on every
 * off-topic message.
 */
export const GUARDIAN_MODEL = GOOGLE_GEMINI_2_5_FLASH;

/**
 * Conversation compaction — moderate reasoning at low cost. Summarising old
 * turns does not need the deep model, so it runs on the cheaper tier.
 */
export const COMPACTION_MODEL = GOOGLE_GEMINI_3_FLASH_PREVIEW;

/**
 * Main advisor responses — deep reasoning. This is where grounded advice and
 * (from Phase 6) tool selection happen, so it gets the strongest model.
 */
export const RESPOND_MODEL = GOOGLE_GEMINI_3_5_FLASH;

// ─── Compaction thresholds ────────────────────────────────────────────────────

/** Summarise the conversation once it grows beyond this many messages. */
export const COMPACTION_THRESHOLD = 20;

/** Number of most-recent messages always kept verbatim after compaction. */
export const MESSAGES_TO_KEEP = 6;

/**
 * Static per-run context passed alongside each graph invocation. This is NOT
 * part of {@link AdvisorState} and is never persisted in checkpoints — it is
 * supplied fresh on every run via LangGraph's `context` option and read by nodes
 * through `runtime.context`. Keep request-scoped data (identity, resolved grants)
 * here, not in graph state.
 */
export interface AdvisorContext {
  userId: string;
  /** Data-access scopes the user has granted; gates tools and prompt sections. */
  grantedScopes: AdvisorScope[];
}

/**
 * Why the advisor ended a turn at the guardian gate without running the full
 * advisor body. Drives which terminal message the reject node returns.
 *
 * - `off_topic` — the message is not about the user's finances.
 * - `empty`     — the message had no usable text.
 * - `error`     — the relevance classifier failed; we stop rather than spend an
 *   advisor round-trip on an unclassified message.
 */
export type AdvisorEndReason = 'off_topic' | 'empty' | 'error';

/**
 * Terminal replies, one per {@link AdvisorEndReason}. Each ends the turn at the
 * guardian without a model call, so off-topic, empty, and errored messages never
 * cost an advisor round-trip. Kept short and warm to stay in character.
 */
export const ADVISOR_END_MESSAGES: Record<AdvisorEndReason, string> = {
  off_topic:
    "I'm your financial advisor, so I can only help with money matters like spending, budgets, savings, goals, and bills. Ask me anything about your finances and I'll dig right in.",
  empty:
    'It looks like your message came through empty. What would you like to know about your money?',
  error: 'Something went wrong on my end just now. Mind sending that again?',
};

/**
 * Graph node names. Centralised so edges and routing read consistently and a
 * rename never drifts between `addNode` and `addEdge` call sites.
 */
export const ADVISOR_NODES = {
  GUARDIAN: 'guardian',
  REJECT: 'reject',
  COMPACT: 'compact',
  RESPOND: 'respond',
  TOOLS: 'tools',
  ACTION: 'action',
  MEMORY: 'memory',
} as const;

// ─── Long-term memory ─────────────────────────────────────────────────────────

/**
 * Model used to distil durable facts (preferences, life context, spending
 * patterns) from a conversation into long-term store memory. Cheap tier — this
 * is a background extraction, not the user-facing reply.
 */
export const MEMORY_MODEL = COMPACTION_MODEL;

/**
 * Run memory extraction only every Nth completed turn. Extraction is an extra
 * LLM call, so we amortise it rather than running on every turn.
 */
export const MEMORY_EXTRACTION_EVERY = 3;

/** How many of the most-recent messages feed the memory extractor. */
export const MEMORY_SOURCE_MESSAGES = 12;

/** Max items written per namespace per extraction (guards runaway growth). */
export const MEMORY_WRITE_MAX = 6;

/** Max items read back per namespace when recalling memory into the prompt. */
export const MEMORY_READ_LIMIT = 6;

/**
 * Long-term store namespaces, all scoped under `['user', userId, …]`.
 * - `preferences` — single `profile` item (currency, tone); not embedded.
 * - `context`     — durable life-situation facts; embedded + semantically recalled.
 * - `patterns`    — durable spending patterns; embedded + semantically recalled.
 * - `rejections`  — proposals the user rejected (written by the HITL action node).
 */
export const MEMORY_NAMESPACE = {
  PREFERENCES: 'preferences',
  CONTEXT: 'context',
  PATTERNS: 'patterns',
  REJECTIONS: 'rejections',
} as const;

/** Fixed key for the single preferences item in the preferences namespace. */
export const MEMORY_PREFERENCES_KEY = 'profile';
