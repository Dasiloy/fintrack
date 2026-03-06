export const AUTH_ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  VERIFY_PASSWORD_TOKEN: '/verify-password-token',
};

export const STATIC_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  BLOG: '/blog',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  PRICING: '/pricing',
  SUPPORT: '/support',
  COMMUNITY: '/community',
};

/** Dashboard app navigation paths — use these for all sidebar and in-app links */
export const DASHBOARD_ROUTES = {
  DASHBOARD: '/dashboard',
  FINANCES_TRANSACTIONS: '/finances/transactions',
  FINANCES_BILLS: '/finances/bills',
  FINANCES_BUDGETS: '/finances/budgets',
  ANALYTICS: '/analytics',
  ANALYTICS_INSIGHTS: '/analytics/insights',
  ANALYTICS_CHAT: '/analytics/chat',
  PLANNING_GOALS: '/planning/goals',
  PLANNING_SPLITS: '/planning/splits',
  NOTIFICATIONS: '/notifications',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_ACCOUNT: '/settings/account',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_INVITE: '/settings/invite',
} as const;
