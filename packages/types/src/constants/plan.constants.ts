export const PLAN_LIMITS = {
  FREE: {
    MAX_CUSTOM_CATEGORIES: 3,
    MAX_BUDGETS: 5,
    MAX_RECURRING_ITEMS: 5,
    MAX_GOALS: 3,
    MAX_ACTIVE_SPLITS: 3,
    MAX_PEOPLE_PER_SPLIT: 3,
    AI_INSIGHTS_QUERIES_PER_MONTH: 20,
    AI_CHAT_MESSAGES_PER_MONTH: 10,
    RECEIPT_UPLOADS_PER_MONTH: 10,
    PDF_REPORTS: false,
    CSV_EXPORT: false,
    ANALYTICS_ALL_TIME: false,
    ANALYTICS_MONTHS_LIMIT: 6,
  },
  PRO: {
    MAX_CUSTOM_CATEGORIES: Infinity,
    MAX_BUDGETS: Infinity,
    MAX_RECURRING_ITEMS: Infinity,
    MAX_GOALS: Infinity,
    MAX_ACTIVE_SPLITS: Infinity,
    MAX_PEOPLE_PER_SPLIT: Infinity,
    AI_INSIGHTS_QUERIES_PER_MONTH: Infinity,
    AI_CHAT_MESSAGES_PER_MONTH: Infinity,
    RECEIPT_UPLOADS_PER_MONTH: Infinity,
    PDF_REPORTS: true,
    CSV_EXPORT: true,
    ANALYTICS_ALL_TIME: true,
    ANALYTICS_MONTHS_LIMIT: null,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
export type PlanLimits = (typeof PLAN_LIMITS)[PlanName];
