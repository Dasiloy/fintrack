export interface AnalyticsTopCategory {
  slug: string;
  total: number;
  transactionCount: number;
}

export interface AnalyticsBudgetUtilisation {
  categorySlug: string;
  budgeted: number;
  spent: number;
  /** Ratio of spent to budgeted (0–1+). Values > 1 indicate overspend. */
  pct: number;
}

export interface AnalyticsGoalProgress {
  goalId: string;
  targetAmount: number;
  savedAmount: number;
  /** Ratio of savedAmount to targetAmount (0–1+). */
  pct: number;
}

/**
 * Shape stored in `analytics_snapshots.data` (JSONB).
 *
 * Income, expense, and netSavings are intentionally excluded — those are
 * maintained in real-time by UserBalance (current month) and
 * MonthlyBalanceSnapshot (historical months) and should be read from there.
 */
export interface AnalyticsSnapshotData {
  topCategories: AnalyticsTopCategory[];
  budgetUtilisation: AnalyticsBudgetUtilisation[];
  goalProgress: AnalyticsGoalProgress[];
}
