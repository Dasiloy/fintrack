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
// 25 hours — refreshed hourly by the scheduler's ORACLE_REFRESH_JOB; the TTL
// outlives the refresh interval so a missed/failed run still serves the last
// good value rather than going cold.
export const ORACLE_MACRO_CACHE_TTL = 25 * 60 * 60;

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

// Advisor consent — granted scopes per user. Read on the advisor hot path and
// when serving the permissions panel; busted whenever the user updates scopes.
export const ADVISOR_SCOPES_CACHE_PREFIX = 'advisor_scopes'; // advisor_scopes:{userId}
export const ADVISOR_SCOPES_CACHE_TTL = 300; // 5 minutes — mirrors USER_CACHE_TTL

// Advisor pending message — staged by the POST step and consumed once by the
// @Sse stream step (SSE is GET-only, so the message can't ride in the URL).
export const ADVISOR_PENDING_PREFIX = 'advisor_pending'; // advisor_pending:{token}
export const ADVISOR_PENDING_TTL = 60; // 1 minute — token is consumed immediately

// Advisor conversation list — the chat-history sidebar per user. Read on every
// sidebar render; busted whenever the user's conversations change (new turn,
// rename, delete). Messages are NOT cached here — they paginate by cursor.
export const ADVISOR_CONVERSATIONS_CACHE_PREFIX = 'advisor_conversations'; // advisor_conversations:{userId}
export const ADVISOR_CONVERSATIONS_CACHE_TTL = 300; // 5 minutes
