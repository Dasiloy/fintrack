/**
 * @description Helper to get a cookie value by name on the client side.
 *
 * @param {string}  name cookie name
 * @returns {string. | undefined} cookie value
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

/**
 * @description Helper to set a cookie value on the client side.
 *
 * @param {string} name name of the cookie to set
 * @param {string} value value of the cookie to set
 * @param {number} maxAgeInSeconds the expiration for the cookie in seconds
 */
export function setCookie(name: string, value: string, maxAgeInSeconds: number) {
  if (typeof document === 'undefined') return;
  const secure = process.env.NODE_ENV === 'production' ? 'secure;' : '';
  document.cookie = `${name}=${value}; max-age=${maxAgeInSeconds}; path=/; ${secure} samesite=lax`;
}
