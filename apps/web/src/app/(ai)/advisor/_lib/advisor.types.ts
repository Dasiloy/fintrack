// ── Advisor page type definitions ───────────────────────────────────────────
// Mirrors the data shapes defined in docs/AI-SERVICE.md (Domain 2 & Domain 3).
// All stub data uses these types so the real API layer can drop in later.

// ── Insights ─────────────────────────────────────────────────────────────────

export interface AdvisorInsight {
  id: string;
  generatedAt: Date;
  /** What triggered this insight run */
  trigger: 'daily' | 'post_sync' | 'month_end' | 'budget_breach';
  /** 3–5 sentence prose summary of the user's current financial position */
  summary: string;
  /** Spending anomalies detected (prose strings) */
  anomalies: string[];
  /** Goal pacing alerts (prose strings) */
  goalAlerts: string[];
  /** Cash flow forecast sentence, e.g. "₦28,500 available after the 15th" */
  cashFlowForecast: string | null;
  recommendations: InsightRecommendation[];
  macroContext: MacroContext;
}

export interface InsightRecommendation {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: 'budget' | 'goal' | 'spending' | 'saving' | 'cashflow';
  /** True if the recommendation maps to a concrete advisor action */
  actionable: boolean;
}

export interface MacroContext {
  /** Current USD → NGN exchange rate */
  ngnUsdRate: number;
  /** Nigerian food CPI year-over-year % change */
  foodCpiYoY: number;
  /** CBN monetary policy rate */
  cbnPolicyRate: number;
  fetchedAt: string;
}

// ── Conversations ─────────────────────────────────────────────────────────────

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
  /** Files the advisor generated as part of this response */
  generatedFiles?: GeneratedFile[];
  /** Agentic action the advisor is proposing (HITL flow) */
  proposedAction?: AdvisorAction | null;
  /** Current state of the HITL approval card */
  actionState?: 'pending' | 'approved' | 'rejected';
}

export interface GeneratedFile {
  name: string;
  type: 'pdf' | 'csv';
  sizeKb: number;
}

// ── Agentic actions (Human-in-the-Loop) ──────────────────────────────────────
// All 5 kinds from AI-SERVICE.md Domain 3 — Financial Advisor.
// Each kind carries exactly the fields needed to render an approval card and
// execute the action via financeClient (when real API is wired in).

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

// ── Tools ─────────────────────────────────────────────────────────────────────

export interface AdvisorTool {
  id: string;
  name: string;
  description: string;
  /** postgres = queries user's Neon DB; oracle = external free APIs */
  category: 'postgres' | 'oracle';
  enabled: boolean;
}

// ── File attachments (user uploads) ──────────────────────────────────────────

export interface PendingAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  sizeKb: number;
}

// ── Object-based component states ────────────────────────────────────────────
// Using single state objects instead of scattered useState primitives keeps
// updates atomic and prevents subtle stale-closure bugs in async handlers.

export interface AdvisorPageState {
  activeTab: 'insights' | 'advisor';
  activeConversationId: string | null;
  /** Controls the left history Sheet on mobile/tablet */
  historySheetOpen: boolean;
  /** Controls the right tools Sheet on mobile/tablet */
  toolsSheetOpen: boolean;
}

export interface ChatState {
  messages: AdvisorMessage[];
  inputText: string;
  attachments: PendingAttachment[];
  /** True while the simulated streaming interval is running */
  isStreaming: boolean;
}

export interface InsightsPanelState {
  /** Map of section id → expanded. All sections start expanded. */
  expandedSections: Record<string, boolean>;
  /** True for 1.5s after "Refresh" is tapped */
  isRefreshing: boolean;
}
