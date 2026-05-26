// ── Advisor helper utilities ─────────────────────────────────────────────────
// Pure functions used across advisor components. No side effects.
// Formatting delegates to shared @fintrack/utils to stay consistent with the
// rest of the app (same locale, same dayjs instance, same currency rules).

import { formatCurrency, capitalize } from '@fintrack/utils/format';
import { getTimeFromNow, format as dayjsFormat } from '@fintrack/utils/date';
import type { AdvisorAction, InsightRecommendation } from './advisor.types';

// ── Formatting ────────────────────────────────────────────────────────────────

/** Format a number as Nigerian Naira, e.g. 42500 → "₦42,500.00" */
export function formatNGN(amount: number): string {
  return formatCurrency(amount, 'NGN', 'en-NG');
}

/** Truncate a string to maxLen chars, appending "…" if cut */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/** Human-readable relative time via dayjs fromNow, e.g. "2 hours ago" */
export function relativeTime(date: Date): string {
  return getTimeFromNow(date);
}

/** Format a Date as a short time string, e.g. "09:41" */
export function formatTime(date: Date): string {
  return dayjsFormat(date, 'HH:mm');
}

// ── Advisor actions ───────────────────────────────────────────────────────────

/**
 * Returns a one-line human-readable label for any AdvisorAction.
 * Used in approval cards and rejection confirmations.
 */
export function getActionLabel(action: AdvisorAction): string {
  switch (action.kind) {
    case 'adjust_budget':
      return `Raise ${titleCase(action.categorySlug)} budget ${formatNGN(action.currentLimit)} → ${formatNGN(action.proposedLimit)}`;
    case 'create_budget':
      return `Create ${titleCase(action.categorySlug)} budget — ${formatNGN(action.proposedLimit)}/mo`;
    case 'adjust_goal_contribution':
      return `Increase ${action.goalName} contribution ${formatNGN(action.currentAmount)} → ${formatNGN(action.proposedAmount)}/mo`;
    case 'suggest_recurring':
      return `Add "${action.name}" as a recurring ${action.frequency} — ${formatNGN(action.amount)}`;
    case 'flag_subscription':
      return `Flag "${action.name}" (${formatNGN(action.amount)}) as an unused subscription`;
  }
}

// ── Priority colours ──────────────────────────────────────────────────────────

/** Returns the Tailwind text colour class for an insight priority level */
export function getPriorityColor(priority: InsightRecommendation['priority']): string {
  const map: Record<InsightRecommendation['priority'], string> = {
    high: 'text-error',
    medium: 'text-warning',
    low: 'text-info',
  };
  return map[priority];
}

/** Returns the Tailwind bg colour class for an insight priority badge */
export function getPriorityBg(priority: InsightRecommendation['priority']): string {
  const map: Record<InsightRecommendation['priority'], string> = {
    high: 'bg-error/10',
    medium: 'bg-warning/10',
    low: 'bg-info/10',
  };
  return map[priority];
}

// ── String utilities ──────────────────────────────────────────────────────────

/** "food_and_dining" → "Food And Dining" */
function titleCase(str: string): string {
  return str.replace(/_/g, ' ').split(' ').map(capitalize).join(' ');
}

/** Format file size in KB or MB */
export function formatFileSize(sizeKb: number): string {
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} MB`;
  return `${sizeKb} KB`;
}
