export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';
export const USER_CACHE_TTL = 300; //5min

export const GATED_USAGE_CACHE_PREFIX = 'gated_usage';
export const GATED_USAGE_TTL = 600; // 10 minutes

export const USER_PROFILE_CACHE_PREFIX = 'user_profile';

export const RECURRING_AGGREGATE_CACHE_PREFIX = 'recurring_aggregate';

export const MERCHANT_CACHE_KEY = 'merchants';
export const MERCHANT_CACHE_TTL = 86400; // 24 hours

export const BUDGET_TREND_CACHE_PREFIX = 'budget_trend'; // budget_trend:{userId}:{months}
export const BUDGET_TREND_CACHE_TTL = 900; // 15 minutes

export const GOAL_LIST_CACHE_PREFIX = 'goal_list'; // goal_list:{userId}
export const GOAL_LIST_CACHE_TTL = 300; // 5 minutes

export const GOAL_AGGREGATE_CACHE_PREFIX = 'goal_aggregate'; // goal_aggregate:{userId}
export const GOAL_AGGREGATE_CACHE_TTL = 1200; // 20 minutes => Goals do not chnage frequently

export const OCR_RESULT_CACHE_PREFIX = 'ocr_result'; // ocr_result:{draftId}
export const OCR_RESULT_CACHE_TTL = 3600; // 1 hour — terminal OCR results are immutable

export const ORACLE_MACRO_CACHE_KEY = 'oracle:macro_context';
export const ORACLE_MACRO_CACHE_TTL = 6 * 60 * 60; // 6 hours — macro data changes slowly

// ── Insights cache ────────────────────────────────────────────────────────
// insights:{userId}              — latest AiInsight row for the user
// insights_unread:{userId}       — unread insight count (badge)
//
// Invalidation:
//   insights:{userId}           deleted by ai_service InsightService.runGraph()
//                               after every successful graph completion
//   insights_unread:{userId}    deleted after markInsightRead / markAllRead
export const INSIGHTS_CACHE_PREFIX = 'insights'; // insights:{userId}
export const INSIGHTS_CACHE_TTL = 3600; // 1 hour

export const INSIGHTS_UNREAD_CACHE_PREFIX = 'insights_unread'; // insights_unread:{userId}
export const INSIGHTS_UNREAD_CACHE_TTL = 300; // 5 minutes

export const INSIGHTS_COOLDOWN = 'insights_trigger_cooldown';
export const INSIGHTS_COOLDOWN_TTL = 600;
