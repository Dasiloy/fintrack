// ── Advisor helper utilities ─────────────────────────────────────────────────
// Pure functions. No side effects.

import { formatCurrency, capitalize } from '@fintrack/utils/format';
import { getTimeFromNow, format as dayjsFormat } from '@fintrack/utils/date';
import type { InsightRecommendation, MacroContext } from '@fintrack/types/interfaces/insights';
import type { AiInsight } from '@fintrack/database/types';
import type { AdvisorAction } from './advisor.types';

export type { InsightRecommendation, MacroContext };

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatNGN(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return 'unknown amount';
  }
  return formatCurrency(amount, 'NGN', 'en-NG');
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

export function relativeTime(date: Date): string {
  return getTimeFromNow(date);
}

export function formatTime(date: Date): string {
  return dayjsFormat(date, 'HH:mm');
}

export function formatFileSize(sizeKb: number): string {
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} MB`;
  return `${sizeKb} KB`;
}

// ── AiInsight JSON field accessors ────────────────────────────────────────────
// Prisma stores these as Json columns. The returned values are correct at
// runtime but typed as JsonValue, so we cast them here in one place.

export function getAnomalies(insight: AiInsight): string[] {
  return (insight.anomalies as string[]) ?? [];
}

export function getGoalAlerts(insight: AiInsight): string[] {
  return (insight.goalAlerts as string[]) ?? [];
}

export function getRecommendations(insight: AiInsight): InsightRecommendation[] {
  return (insight.recommendations as unknown as InsightRecommendation[]) ?? [];
}

// Note: an insight's `macroContext` is a point-in-time snapshot kept for
// reference only. Macro data shown in the UI is read live via
// `advisor.getMacroContext` (gateway → Redis), never from the insight row.

// ── Advisor actions ───────────────────────────────────────────────────────────

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
      return action.operation === 'cancel'
        ? `Cancel "${action.name}" subscription — currently ${formatNGN(action.currentAmount)}`
        : `Adjust "${action.name}" subscription ${formatNGN(action.currentAmount)} → ${formatNGN(action.proposedAmount ?? action.currentAmount)}`;
  }
}

// ── Priority colours ──────────────────────────────────────────────────────────

export function getPriorityColor(priority: InsightRecommendation['priority']): string {
  const map: Record<InsightRecommendation['priority'], string> = {
    high: 'text-error',
    medium: 'text-warning',
    low: 'text-info',
  };
  return map[priority];
}

export function getPriorityBg(priority: InsightRecommendation['priority']): string {
  const map: Record<InsightRecommendation['priority'], string> = {
    high: 'bg-error/10',
    medium: 'bg-warning/10',
    low: 'bg-info/10',
  };
  return map[priority];
}

// ── Internal ──────────────────────────────────────────────────────────────────

function titleCase(str: string): string {
  return str.replace(/_/g, ' ').split(' ').map(capitalize).join(' ');
}
