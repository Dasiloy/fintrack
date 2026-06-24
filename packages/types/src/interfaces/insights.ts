export interface BudgetBreachEntry {
  categorySlug: string;
  budgetId: string;
  severity: 'warning' | 'critical';
  currentPct: number;
  threshold: number;
}

export interface BudgetBreachInsightData {
  categorySlug: string;
  budgetName: string;
  severity: 'warning' | 'critical';
  currentPct: number;
  threshold: number;
  updatedAt: string;
  /** AI-generated contextual advice for this breach event */
  aiMessage?: string;
}

export interface InsightsJobPayload {
  trigger: 'daily' | 'budget_breach' | 'manual';
  /** manual + budget_breach: single user */
  userId?: string;
  /** budget_breach: breach entries for this user */
  metadata?: BudgetBreachEntry[];
  /** daily: batch of user IDs (processed by InsightsWorker per-user) */
  userIds?: string[];
}

export interface InsightRecommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: 'budget' | 'goal' | 'spending' | 'saving' | 'cashflow';
  actionable: boolean;
}

export interface MacroContext {
  /** Live USD/NGN rate; null when the source is unavailable. */
  ngnUsdRate: number | null;
  /** YoY % change in food CPI; null until a live source is wired up. */
  foodCpiYoY: number | null;
  /** CBN policy rate; null until a live source is wired up. */
  cbnPolicyRate: number | null;
  fetchedAt: string;
}

/** Shape of the Alpha Vantage CURRENCY_EXCHANGE_RATE response we read from. */
export interface AlphaVantageFxResponse {
  'Realtime Currency Exchange Rate'?: {
    '5. Exchange Rate'?: string;
  };
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
