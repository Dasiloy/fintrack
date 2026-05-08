export const REDIS_CLIENT = 'REDIS_CLIENT';
export const USER_CACHE_TTL = 300; //5min

export const GATED_USAGE_CACHE_PREFIX = 'gated_usage';
export const GATED_USAGE_TTL = 600; // 10 minutes

export const USER_PROFILE_CACHE_PREFIX = 'user_profile';

export const RECURRING_AGGREGATE_CACHE_PREFIX = 'recurring_aggregate';

export const MERCHANT_CACHE_KEY = 'merchants';
export const MERCHANT_CACHE_TTL = 86400; // 24 hours

export const BUDGET_LIST_CACHE_PREFIX = 'budget_list'; // budget_list:{userId}:{YYYY-MM}
export const BUDGET_LIST_CACHE_TTL = 300; // 5 minutes

export const BUDGET_TREND_CACHE_PREFIX = 'budget_trend'; // budget_trend:{userId}:{months}
export const BUDGET_TREND_CACHE_TTL = 900; // 15 minutes

export const BUDGET_ONE_CACHE_PREFIX = 'budget_one'; // budget_one:{budgetId}
export const BUDGET_ONE_CACHE_TTL = 300; // 5 minutes

export const GOAL_LIST_CACHE_PREFIX = 'goal_list'; // goal_list:{userId}
export const GOAL_LIST_CACHE_TTL = 120; // 2 minutes

export const GOAL_AGGREGATE_CACHE_PREFIX = 'goal_aggregate'; // goal_aggregate:{userId}
export const GOAL_AGGREGATE_CACHE_TTL = 120; // 2 minutes
