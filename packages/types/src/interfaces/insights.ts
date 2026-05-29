export interface InsightsJobPayload {
  userId: string;
  trigger: 'daily' | 'budget_breach' | 'manual'; // only manual is implemented
  metadata?: {
    categorySlug?: string;
    budgetId?: string;
    /** budget_breach only */
    severity?: 'warning' | 'critical';
    currentPct?: number;
    threshold?: number;
  }[];
}

export interface InsightRecommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: 'budget' | 'goal' | 'spending' | 'saving' | 'cashflow';
  actionable: boolean;
}

export interface MacroContext {
  ngnUsdRate: number;
  /** YoY % change in food CPI */
  foodCpiYoY: number;
  cbnPolicyRate: number;
  fetchedAt: string;
}

/**
 * Serialisable snapshot of UserBalance for use inside the insights graph state.
 * Decimal fields are converted to numbers so the state is JSON-safe.
 */
export interface UserBalanceContext {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  /** "YYYY-MM" — which month the monthly counters belong to */
  monthYear: string;
}

export interface GenerateInsightsRes {
  insightId: string;
  severity: 'info' | 'warning' | 'critical';
  conversationThreadId: string | null;
  summary: string;
  anomalies: string[];
  goalAlerts: string[];
  cashFlowForecast: string;
  recommendations: InsightRecommendation[];
  macroContext: MacroContext;
  generatedAt: string;
}
