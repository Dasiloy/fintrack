// ── Advisor page — FE-only type definitions ───────────────────────────────────
// Only types that are specific to the frontend live here.
// Backend-mirrored types (InsightRecommendation, MacroContext, AiInsight) are
// imported from the shared packages directly.

// ── Conversations (chat history — no backend yet) ─────────────────────────────

export interface ConversationThread {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messageCount: number;
}

// ── Chat messages ─────────────────────────────────────────────────────────────

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  generatedFiles?: GeneratedFile[];
  proposedAction?: AdvisorAction | null;
  actionState?: 'pending' | 'approved' | 'rejected';
}

export interface GeneratedFile {
  name: string;
  type: 'pdf' | 'csv';
  sizeKb: number;
}

// ── Agentic actions (Human-in-the-Loop) ──────────────────────────────────────
// All 5 action kinds from AI-SERVICE.md Domain 3.

export type AdvisorAction =
  | {
      kind: 'adjust_budget';
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
      goalName: string;
      currentAmount: number;
      proposedAmount: number;
      reason: string;
    }
  | {
      kind: 'suggest_recurring';
      name: string;
      amount: number;
      frequency: string;
      reason: string;
    }
  | {
      kind: 'flag_subscription';
      name: string;
      amount: number;
      reason: string;
    };

// ── Context panel tools ────────────────────────────────────────────────────────

export interface AdvisorTool {
  id: string;
  name: string;
  description: string;
  /** postgres = queries user's own DB; oracle = external rate-limited APIs */
  category: 'postgres' | 'oracle';
  enabled: boolean;
}

// ── File attachments (user uploads pending send) ──────────────────────────────

export interface PendingAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  sizeKb: number;
}

// ── Object-based component states ─────────────────────────────────────────────

export interface AdvisorPageState {
  activeTab: 'insights' | 'advisor';
  activeConversationId: string | null;
  historySheetOpen: boolean;
  toolsSheetOpen: boolean;
}

export interface ChatState {
  messages: AdvisorMessage[];
  inputText: string;
  attachments: PendingAttachment[];
  isStreaming: boolean;
}

export interface InsightsPanelState {
  expandedSections: Record<string, boolean>;
  isRefreshing: boolean;
}
