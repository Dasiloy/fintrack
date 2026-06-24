// ── Advisor page constants ────────────────────────────────────────────────────
// Static configuration: tool definitions, insight section ids, suggested prompts.

import type { AdvisorTool } from './advisor.types';

// ── Insight section IDs ───────────────────────────────────────────────────────
// Used as keys in InsightsPanelState.expandedSections.

export const INSIGHT_SECTION_IDS = {
  SUMMARY: 'summary',
  ANOMALIES: 'anomalies',
  GOAL_ALERTS: 'goal_alerts',
  CASH_FLOW: 'cash_flow',
  RECOMMENDATIONS: 'recommendations',
  MACRO: 'macro',
} as const;

/** All sections start expanded */
export const DEFAULT_EXPANDED_SECTIONS: Record<string, boolean> = {
  [INSIGHT_SECTION_IDS.SUMMARY]: true,
  [INSIGHT_SECTION_IDS.ANOMALIES]: true,
  [INSIGHT_SECTION_IDS.GOAL_ALERTS]: true,
  [INSIGHT_SECTION_IDS.CASH_FLOW]: true,
  [INSIGHT_SECTION_IDS.RECOMMENDATIONS]: true,
  [INSIGHT_SECTION_IDS.MACRO]: false, // collapsed by default — supplementary
};

// ── Advisor tools ─────────────────────────────────────────────────────────────
// These mirror the tools defined in AI-SERVICE.md Domain 3.
// Postgres tools are free (user's own DB); oracle tools call external APIs
// with rate limits, so they start disabled and the user opts in.

export const ADVISOR_TOOLS: AdvisorTool[] = [
  // ── Your Data (Postgres) ──
  {
    id: 'get_transactions',
    name: 'Transactions',
    description: 'Fetch recent transactions with filters for date, category, and type.',
    category: 'postgres',
    enabled: true,
  },
  {
    id: 'get_spending_summary',
    name: 'Spending Summary',
    description: 'Total spending grouped by category or time period.',
    category: 'postgres',
    enabled: true,
  },
  {
    id: 'get_budgets',
    name: 'Budgets',
    description: 'All budgets with current period spend vs limit.',
    category: 'postgres',
    enabled: true,
  },
  {
    id: 'get_goals',
    name: 'Goals',
    description: 'Savings goals with target amounts and deadline pacing.',
    category: 'postgres',
    enabled: true,
  },
  {
    id: 'get_recurring_items',
    name: 'Recurring Bills',
    description: 'All recurring income and expense items.',
    category: 'postgres',
    enabled: true,
  },
  {
    id: 'get_splits',
    name: 'Split Bills',
    description: 'Group expense splits — open, settled, or all.',
    category: 'postgres',
    enabled: true,
  },
  {
    id: 'semantic_search',
    name: 'Semantic Search',
    description: 'Find transactions by natural language query (e.g. "forgotten subscriptions").',
    category: 'postgres',
    enabled: true,
  },
  // ── Market Data (Oracle — rate-limited, opt-in) ──
  {
    id: 'ngn_exchange_rate',
    name: 'NGN Exchange Rate',
    description: 'Live USD/NGN rate via exchangerate-api.com (1h cache). 1,500 req/mo free.',
    category: 'oracle',
    enabled: false,
  },
  {
    id: 'nigerian_inflation',
    name: 'Nigerian CPI',
    description: 'Food and general CPI inflation via World Bank (24h cache). Unlimited.',
    category: 'oracle',
    enabled: false,
  },
  {
    id: 'market_data',
    name: 'Market Data',
    description:
      'Forex rates and economic indicators via Alpha Vantage (4h cache). 25 req/day free.',
    category: 'oracle',
    enabled: false,
  },
];

// ── Suggested prompts ─────────────────────────────────────────────────────────
// Shown in the chat empty state. Clicking one pre-fills the input.

export const SUGGESTED_PROMPTS: string[] = [
  'How much did I spend on food last month?',
  'Am I on track for my Emergency Fund?',
  'What subscriptions can I cancel?',
  'Analyse this bank statement',
  'How does my spending compare to last month?',
  "What's my cash flow for the rest of the month?",
];
