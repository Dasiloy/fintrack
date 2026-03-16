import type { LoginActivity, User } from '@fintrack/database/types';
import { capitalize } from '@fintrack/utils/format';
import { Laptop, Monitor, Smartphone, Tablet } from 'lucide-react';

/**
 *
 * @description Get the name of a user.
 * @param user - The user to get the name of.
 * @returns
 */
export function getName(user?: Partial<User>): string {
  if (!user) return '';
  return capitalize(user.firstName ?? '') + ' ' + capitalize(user.lastName ?? '');
}

/**
 *
 * @description Get the username of a user.
 * @param user - The user to get the username of.
 * @returns The username of the user.
 */
export function getUsername(user?: Partial<User>): string {
  if (!user) return '';
  return capitalize(user.firstName ?? '') + '_' + capitalize(user.lastName ?? '');
}

/**
 * @description Infer a human-readable device type and icon from a raw user-agent string.
 *
 * @param ua - The user-agent string to parse.
 * @returns An object containing the device name, browser, and icon.
 */
export function parseUserAgent(ua?: string | null): {
  deviceName: string;
  browser: string;
  Icon: typeof Monitor;
} {
  if (!ua) return { deviceName: 'Unknown Device', browser: 'Unknown Browser', Icon: Monitor };

  const uaLower = ua.toLowerCase();

  // Icon / device type
  const Icon =
    uaLower.includes('mobile') || uaLower.includes('android')
      ? Smartphone
      : uaLower.includes('ipad') || uaLower.includes('tablet')
        ? Tablet
        : uaLower.includes('windows') || uaLower.includes('macintosh') || uaLower.includes('linux')
          ? Laptop
          : Monitor;

  // Device OS label
  const deviceName = uaLower.includes('iphone')
    ? 'iPhone'
    : uaLower.includes('ipad')
      ? 'iPad'
      : uaLower.includes('android')
        ? 'Android'
        : uaLower.includes('macintosh')
          ? 'Mac'
          : uaLower.includes('windows')
            ? 'Windows PC'
            : uaLower.includes('linux')
              ? 'Linux'
              : 'Device';

  // Browser
  const browser = uaLower.includes('edg/')
    ? 'Edge'
    : uaLower.includes('chrome') && !uaLower.includes('chromium')
      ? 'Chrome'
      : uaLower.includes('firefox')
        ? 'Firefox'
        : uaLower.includes('safari') && !uaLower.includes('chrome')
          ? 'Safari'
          : uaLower.includes('opera') || uaLower.includes('opr/')
            ? 'Opera'
            : 'Browser';

  return { deviceName, browser, Icon };
}

/**
 * @description Format activity type label.
 *
 * @param {LoginActivity['type']} type - The type of the activity.
 * @returns The formatted activity type label.
 */
export function activityTypeLabel(type: LoginActivity['type']) {
  return type === 'MFA' ? '2FA Authenticator' : 'Password';
}
