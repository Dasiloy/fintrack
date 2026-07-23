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

export const ADVISOR_ATTACHMENT_KINDS = ['image', 'pdf', 'csv', 'excel'] as const;

export type AdvisorAttachmentKind = (typeof ADVISOR_ATTACHMENT_KINDS)[number];

export interface AdvisorAttachment {
  /** Short-lived signed URL. Present only while sending/viewing, never required for persisted metadata. */
  url?: string;
  publicId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  format: string;
  kind: AdvisorAttachmentKind;
  extractedText?: string;
}

export interface AdvisorAttachmentUploadFailure {
  index: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  reason: string;
}

export interface AdvisorAttachmentUploadResult {
  uploaded: AdvisorAttachment[];
  failed: AdvisorAttachmentUploadFailure[];
}

export interface AdvisorAttachmentCleanupItem {
  publicId: string;
  kind: AdvisorAttachmentKind;
  name?: string;
}

export interface AdvisorAttachmentCleanupJob {
  userId: string;
  conversationId: string;
  attachments: AdvisorAttachmentCleanupItem[];
}

export const ADVISOR_WORKFLOW_STATUSES = [
  'started',
  'loading_context',
  'fetching_records',
  'analyzing',
  'checking_recommendations',
  'generating_response',
  'response_started',
  'completed',
  'failed',
] as const;

export type AdvisorWorkflowStatus = (typeof ADVISOR_WORKFLOW_STATUSES)[number];

export type AdvisorWorkflowEventType =
  | 'workflow_started'
  | 'workflow_progress'
  | 'workflow_response_started'
  | 'workflow_completed'
  | 'workflow_failed';

export const ADVISOR_WORKFLOW_IDS = [
  'bill-subscription-auditor',
  'cash-flow-forecast',
  'budget-rebalancer',
  'monthly-money-review',
] as const;

export type AdvisorWorkflowId = (typeof ADVISOR_WORKFLOW_IDS)[number];

export interface AdvisorWorkflowEventPayload {
  workflowRunId?: string;
  status?: AdvisorWorkflowStatus;
  stageIndex?: number;
  stageLabel?: string;
  message?: string;
}

export interface AdvisorWorkflowRun {
  id: string;
  workflowId: AdvisorWorkflowId;
  title: string;
  description: string;
  summaryItems: Array<{ label: string; value: string }>;
  focusItems: string[];
  stages: string[];
  status: AdvisorWorkflowStatus;
  activeStageIndex: number;
  statusLabel: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AdvisorWorkflowOptions {
  horizonDays?: number;
  reviewDepth?: 'quick' | 'standard' | 'deep';
  monthLabel?: string;
  month?: number;
  year?: number;
  strictness?: number;
  includeRecurring?: boolean;
  includeSpending?: boolean;
  includeBudgets?: boolean;
  includeGoals?: boolean;
  includeSplits?: boolean;
  focusDuplicates?: boolean;
  focusRisingCosts?: boolean;
  focusStaleBills?: boolean;
  overspentOnly?: boolean;
}

export interface AdvisorWorkflowRequest {
  workflowId: AdvisorWorkflowId;
  runId?: string;
  options: AdvisorWorkflowOptions;
}

export interface AdvisorWorkflowResponseMetric {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
}

export interface AdvisorWorkflowResponseSection {
  title: string;
  items: string[];
}

export interface AdvisorWorkflowChangeCandidate {
  id: string;
  title: string;
  detail: string;
  selected: boolean;
  state?: 'pending' | 'processing' | 'approved' | 'failed';
  action?: AdvisorAction;
}

export type AdvisorWorkflowExecutionDomain = 'budget' | 'recurring' | 'analysis';

export interface AdvisorWorkflowExecutableCandidate {
  candidateId: string;
  action: AdvisorAction;
}

export interface AdvisorWorkflowActionCandidateResult {
  candidateId: string;
  status: 'approved' | 'failed';
  message: string;
}

export interface AdvisorWorkflowActionBatchResult {
  status: 'executed' | 'execution_failed';
  atomic: true;
  message: string;
  candidateResults: AdvisorWorkflowActionCandidateResult[];
}

export interface AdvisorWorkflowResponse {
  workflowRunId: string;
  workflowId: AdvisorWorkflowId;
  executionDomain?: AdvisorWorkflowExecutionDomain;
  title: string;
  summary: string;
  metrics: AdvisorWorkflowResponseMetric[];
  sections: AdvisorWorkflowResponseSection[];
  candidates?: AdvisorWorkflowChangeCandidate[];
  recommendation?: {
    title: string;
    detail: string;
  };
  generatedAt: string;
}

export interface AdvisorWorkflowCandidateApproval {
  responseMessageId: string;
  selectedCandidateIds: string[];
}

export interface AdvisorWorkflowRunHistoryFilter {
  workflowId?: AdvisorWorkflowId;
  status?: AdvisorWorkflowStatus;
  limit?: number;
}

export interface AdvisorWorkflowRunHistoryItem {
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  content: string;
  createdAt: Date;
  workflowRun: AdvisorWorkflowRun;
}

/** One streamed chunk, mirroring the gateway/proto `AdvisorChunkRes`. */
export interface AdvisorChunk {
  /** token, HITL/action events, workflow_* events, or error. */
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
      kind: 'create_transaction';
      amount: number;
      date: string;
      type: 'INCOME' | 'EXPENSE';
      categorySlug: string;
      categoryName?: string;
      description?: string;
      merchant?: string;
      notes?: string;
      reason: string;
    }
  | {
      kind: 'update_transaction';
      transactionId: string;
      label: string;
      amount?: number;
      date?: string;
      type?: 'INCOME' | 'EXPENSE';
      categorySlug?: string;
      categoryName?: string;
      description?: string;
      merchant?: string;
      notes?: string;
      reason: string;
    }
  | {
      kind: 'delete_transaction';
      transactionId: string;
      label: string;
      amount?: number;
      reason: string;
    }
  | {
      kind: 'adjust_budget';
      budgetId: string;
      categorySlug: string;
      categoryName: string;
      currentLimit: number;
      proposedLimit: number;
      reason: string;
    }
  | {
      kind: 'create_budget';
      categorySlug: string;
      categoryName: string;
      proposedLimit: number;
      reason: string;
    }
  | {
      kind: 'delete_budget';
      budgetId: string;
      categorySlug: string;
      categoryName: string;
      currentLimit: number;
      hardDelete?: boolean;
      reason: string;
    }
  | {
      kind: 'create_goal';
      name: string;
      targetDate: string;
      targetAmount: number;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      description?: string;
      reason: string;
    }
  | {
      kind: 'update_goal';
      goalId: string;
      goalName: string;
      name?: string;
      targetDate?: string;
      targetAmount?: number;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
      status?: 'ACTIVE' | 'ON_HOLD';
      description?: string;
      reason: string;
    }
  | {
      kind: 'delete_goal';
      goalId: string;
      goalName: string;
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
      kind: 'goal_contributions_batch';
      goalId: string;
      goalName: string;
      operations: AdvisorGoalContributionOperation[];
      reason: string;
    }
  | {
      kind: 'suggest_recurring';
      name: string;
      amount: number;
      categorySlug: string;
      categoryName?: string;
      frequency: string;
      reason: string;
    }
  | {
      kind: 'create_split';
      name: string;
      amount: number;
      transactionId?: string;
      participants?: AdvisorSplitParticipantInput[];
      reason: string;
    }
  | {
      kind: 'update_split';
      splitId: string;
      splitName: string;
      name?: string;
      amount?: number;
      transactionId?: string;
      unlinkTransaction?: boolean;
      reason: string;
    }
  | {
      kind: 'delete_split';
      splitId: string;
      splitName: string;
      reason: string;
    }
  | {
      kind: 'split_participants_batch';
      splitId: string;
      splitName: string;
      operations: AdvisorSplitParticipantOperation[];
      reason: string;
    }
  | {
      kind: 'split_settlements_batch';
      splitId: string;
      splitName: string;
      operations: AdvisorSplitSettlementOperation[];
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

export type AdvisorGoalContributionOperation =
  | {
      operation: 'add';
      amount: number;
      date: string;
      description?: string;
      transactionId?: string;
    }
  | {
      operation: 'update';
      contributionId: string;
      amount?: number;
      date?: string;
      description?: string;
      transactionId?: string;
    }
  | {
      operation: 'delete';
      contributionId: string;
    };

export interface AdvisorSplitParticipantInput {
  name: string;
  email: string;
  amount: number;
}

export type AdvisorSplitParticipantOperation =
  | {
      operation: 'add';
      name: string;
      email: string;
      amount: number;
    }
  | {
      operation: 'update';
      participantId: string;
      name?: string;
      email?: string;
      amount?: number;
    }
  | {
      operation: 'delete';
      participantId: string;
    };

export type AdvisorSplitSettlementOperation =
  | {
      operation: 'add';
      participantId: string;
      participantName?: string;
      paidAmount: number;
      paidAt: string;
      transactionId?: string;
    }
  | {
      operation: 'delete';
      settlementId: string;
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
  | 'failed'
  | 'expired';

/** Structured UI metadata stored alongside a durable advisor chat message. */
export interface AdvisorMessageMetadata {
  proposedAction?: AdvisorAction | null;
  actionState?: AdvisorActionState;
  attachments?: AdvisorAttachment[];
  workflowRun?: AdvisorWorkflowRun;
  workflowResponse?: AdvisorWorkflowResponse;
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
      attachments?: AdvisorAttachment[];
      workflowRun?: AdvisorWorkflowRun;
      workflow?: AdvisorWorkflowRequest;
    }
  | {
      userId: string;
      conversationId: string;
      workflowApproval: AdvisorWorkflowCandidateApproval;
    }
  | {
      userId: string;
      conversationId: string;
      resume: { approved: boolean; actionMessageId: string };
    };

/** Staged payload after gateway ownership checks and scope resolution. */
export type ConsumedAdvisorPending = (
  | {
      conversationId: string;
      message: string;
      attachments: AdvisorAttachment[];
      workflowRun?: AdvisorWorkflowRun;
      workflowRunMessageId?: string;
    }
  | {
      conversationId: string;
      message: string;
      workflowApproval: AdvisorWorkflowCandidateApproval;
    }
  | { conversationId: string; resume: { approved: boolean; actionMessageId: string } }
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
  attachments?: AdvisorAttachment[];
}

/** A cursor-paginated page of messages (oldest→newest), `nextCursor` = older page. */
export interface ConversationMessagePage {
  messages: ConversationHistoryMessage[];
  nextCursor: string | null;
}
