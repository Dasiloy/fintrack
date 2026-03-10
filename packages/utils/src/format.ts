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
