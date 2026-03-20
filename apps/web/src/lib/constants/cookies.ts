export const COOKIE_CONSENT = 'fintrack_cookie_consent';
export const COOKIE_THEME = 'fintrack_theme';
export const COOKIE_BALANCE = 'fintrack_balance';

export const COOKIE_CONSENT_EXPIRES = 365;
export const COOKIE_THEME_EXPIRES = 365;
export const COOKIE_BALANCE_EXPIRES = 365;

export const COOKIE_CONSENT_VALUE_ACCEPTED = 'accepted';
export const COOKIE_CONSENT_VALUE_DECLINED = 'declined';
export const COOKIE_BALANCE_VALUE_ENABLED = 'enabled';
export const COOKIE_BALANCE_VALUE_DISABLED = 'disabled';
export const COOKIE_THEME_VALUE_SYSTEM = 'system';
export const COOKIE_THEME_VALUE_LIGHT = 'light';
export const COOKIE_THEME_VALUE_DARK = 'dark';

export type CookiKeys = typeof COOKIE_CONSENT | typeof COOKIE_THEME | typeof COOKIE_BALANCE;

/**
 *
 * @description Get the expiry date for a cookie key
 * @param key
 * @returns number
 */
export function getCookieExpiry(key: CookiKeys) {
  switch (key) {
    case COOKIE_CONSENT:
      return COOKIE_CONSENT_EXPIRES;
    case COOKIE_THEME:
      return COOKIE_THEME_EXPIRES;
    case COOKIE_BALANCE:
      return COOKIE_BALANCE_EXPIRES;
    default:
      return 365;
  }
}
