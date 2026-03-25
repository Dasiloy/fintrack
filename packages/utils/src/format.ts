/**
 * FormatCurrency - format currency in account desired currency
 *
 * Currency can be NGN,USD and others
 * Return Properly formatted currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Mask an IP address for display — never expose the full address to the UI.
 *
 * IPv4: replaces the last octet  → 192.168.1.***
 * IPv6: replaces the last group  → 2001:db8:***
 */
export function maskIp(ip?: string | null): string {
  if (!ip) return 'Unknown';
  if (ip.includes('.')) return ip.replace(/\.\d+$/, '.***');
  if (ip.includes(':')) return ip.replace(/:[^:]+$/, ':***');
  return '***';
}

/**
 *
 * @param str string to capitalize
 * @returns capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Flatten an object into a single level
 * @param obj object to flatten
 * @returns { Record<string, any> } flattened object
 */
export function flattenObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const isValueObject = typeof obj[key] === 'object' && obj[key] !== null;
    if (isValueObject) {
      const nested = flattenObject(obj[key]);
      for (const nestedKey in nested) {
        result[`${nestedKey}`] = nested[nestedKey];
      }
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}
