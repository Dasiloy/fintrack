// ── Advisor page — FE-only type definitions ───────────────────────────────────
// Only types that are specific to the frontend live here.
// Backend-mirrored types (InsightRecommendation, MacroContext, AiInsight) are
// imported from the shared packages directly.

import type { AdvisorAction } from '@fintrack/types/interfaces/ai';

export interface AdvisorTool {
  id: string;
  name: string;
  description: string;
  category: 'postgres' | 'oracle';
  enabled: boolean;
}

// ── Conversations (chat history) ──────────────────────────────────────────────
// Minimal by design — title + recency only. Preview/message-count are dropped:
// they go stale on every turn and aren't worth the sync cost.

export interface ConversationThread {
  id: string;
  title: string;
  updatedAt: Date;
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
// Unified with the AI service via the shared types package — single source of
// truth so the proposed-action shape never drifts between client and server.

export type { AdvisorAction };

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
