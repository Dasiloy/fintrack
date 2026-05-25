import { formatCurrency } from '@fintrack/utils/format';

/**
 * Shared NGN formatting helpers for PDF and image generators.
 *
 * @module export.format
 */

/** Full NGN amount — e.g. ₦1,200,000.00 — used in tables and PDF rows. */
export function formatNGN(amount: number): string {
  return formatCurrency(amount, 'NGN', 'en-NG');
}

/** Compact NGN amount — e.g. ₦1.2M / ₦300K — used in chart labels and image overlays. */
export function formatNGNCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₦${Math.round(abs / 1_000)}K`;
  return formatNGN(amount);
}
