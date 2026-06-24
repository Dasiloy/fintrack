import { AdvisorScope } from '@fintrack/database/types';

/**
 * Default posture: all scopes granted, individually revocable. Used until the
 * real per-user grants are resolved in Phase 5, and as the value seeded for a
 * user's first advisor session.
 */
export const ALL_ADVISOR_SCOPES: AdvisorScope[] = [
  'TRANSACTIONS',
  'BUDGETS',
  'GOALS',
  'RECURRING',
  'SPLITS',
  'ANALYTICS',
];

/**
 * Maps each user-data tool to the scope that gates it. Drives two things:
 * 1. Per-request tool binding — the respond node binds only the tools whose
 *    scope the user has granted, so the model can never even *call* a disabled
 *    tool (authoritative enforcement, per-user, no cross-user impact).
 * 2. The `withScope` runtime backstop inside each tool.
 *
 * IMPORTANT: every tool that reads user data MUST be registered here. Public
 * tools (oracle/market data — no user data) are intentionally absent and are
 * therefore always available.
 */
export const TOOL_SCOPES: Record<string, AdvisorScope> = {
  get_financial_summary: 'ANALYTICS',
  get_spending: 'TRANSACTIONS',
  get_budgets: 'BUDGETS',
  get_goals: 'GOALS',
  get_recurring_items: 'RECURRING',
  get_splits: 'SPLITS',
};

/**
 * Human-facing metadata per scope:
 * - `label`  — short name shown in the permissions UI and re-enable hints.
 * - `grants` — what the advisor can do when the scope is granted, phrased to drop
 *   straight into the system prompt ("You can <grants>.").
 */
export const SCOPE_CATALOG: Record<
  AdvisorScope,
  { label: string; grants: string }
> = {
  TRANSACTIONS: {
    label: 'Transactions',
    grants:
      'look up the user’s transactions, spending summaries, and category breakdowns',
  },
  BUDGETS: {
    label: 'Budgets',
    grants: 'review the user’s budgets and how close each is to its limit',
  },
  GOALS: {
    label: 'Goals',
    grants: 'check the user’s savings goals and whether they are on pace',
  },
  RECURRING: {
    label: 'Recurring bills',
    grants: 'see the user’s recurring bills and what is coming up',
  },
  SPLITS: {
    label: 'Shared expenses',
    grants: 'check shared bills and who owes what',
  },
  ANALYTICS: {
    label: 'Balance & analytics',
    grants:
      'see the user’s income, spending, savings rate, and net balance this month',
  },
};
