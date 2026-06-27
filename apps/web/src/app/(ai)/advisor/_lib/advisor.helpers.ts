// ── Advisor helper utilities ─────────────────────────────────────────────────
// Pure functions. No side effects.

import { formatCurrency, capitalize } from '@fintrack/utils/format';
import { getTimeFromNow, format as dayjsFormat } from '@fintrack/utils/date';
import type { InsightRecommendation, MacroContext } from '@fintrack/types/interfaces/insights';
import type { AiInsight } from '@fintrack/database/types';
import type { AdvisorAction, AdvisorMessage } from './advisor.types';
import type { AdvisorMessageMetadata } from '@fintrack/types/interfaces/ai';

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
    case 'create_transaction':
      return `Create ${action.type.toLowerCase()} transaction — ${formatNGN(action.amount)}`;
    case 'update_transaction':
      return `Update "${action.label}" transaction`;
    case 'delete_transaction':
      return `Delete "${action.label}" transaction${action.amount ? ` — ${formatNGN(action.amount)}` : ''}`;
    case 'adjust_budget':
      return `Raise ${budgetCategoryLabel(action)} budget ${formatNGN(action.currentLimit)} → ${formatNGN(action.proposedLimit)}`;
    case 'create_budget':
      return `Create ${budgetCategoryLabel(action)} budget — ${formatNGN(action.proposedLimit)}/mo`;
    case 'delete_budget':
      return `Remove ${budgetCategoryLabel(action)} budget — currently ${formatNGN(action.currentLimit)}`;
    case 'create_goal':
      return `Create "${action.name}" goal — ${formatNGN(action.targetAmount)}`;
    case 'update_goal':
      return `Update "${action.goalName}" goal`;
    case 'delete_goal':
      return `Delete "${action.goalName}" goal`;
    case 'adjust_goal_contribution':
      return `Increase ${action.goalName} contribution ${formatNGN(action.currentAmount)} → ${formatNGN(action.proposedAmount)}/mo`;
    case 'goal_contributions_batch':
      return `Update "${action.goalName}" contributions — ${action.operations.length} change${action.operations.length === 1 ? '' : 's'}`;
    case 'suggest_recurring':
      return `Add "${action.name}" as a recurring ${action.frequency} — ${formatNGN(action.amount)}`;
    case 'create_split':
      return `Create "${action.name}" split — ${formatNGN(action.amount)}`;
    case 'update_split':
      return `Update "${action.splitName}" split`;
    case 'delete_split':
      return `Delete "${action.splitName}" split`;
    case 'split_participants_batch':
      return `Update "${action.splitName}" participants — ${action.operations.length} change${action.operations.length === 1 ? '' : 's'}`;
    case 'split_settlements_batch':
      return `Update "${action.splitName}" payments — ${action.operations.length} change${action.operations.length === 1 ? '' : 's'}`;
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

function budgetCategoryLabel(
  action: Extract<
    AdvisorAction,
    { kind: 'adjust_budget' | 'create_budget' | 'delete_budget' }
  >,
): string {
  return action.categoryName?.trim() || titleCase(action.categorySlug);
}

export function toAdvisorMessage(m: {
  id: string;
  role: string;
  content: string;
  createdAt: string | Date;
  metadata?: AdvisorMessageMetadata | null;
}): AdvisorMessage {
  return {
    id: m.id,
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
    createdAt: new Date(m.createdAt),
    attachments: m.metadata?.attachments ?? [],
    proposedAction: m.metadata?.proposedAction ?? null,
    actionState: m.metadata?.actionState,
  };
}

export function actionKey(message: AdvisorMessage): string | null {
  return message.proposedAction ? actionIdentity(message.proposedAction) : null;
}

export function normalizeIdentityPart(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function actionIdentity(action: AdvisorAction): string {
  switch (action.kind) {
    case 'create_transaction':
      return [
        action.kind,
        action.type,
        action.amount,
        action.date,
        action.categorySlug,
        normalizeIdentityPart(action.merchant ?? action.description),
      ].join(':');
    case 'update_transaction':
      return [
        action.kind,
        action.transactionId,
        action.amount ?? '',
        action.date ?? '',
        action.categorySlug ?? '',
        normalizeIdentityPart(action.merchant ?? action.description),
      ].join(':');
    case 'delete_transaction':
      return [action.kind, action.transactionId].join(':');
    case 'adjust_budget':
      return [
        action.kind,
        action.budgetId,
        action.categorySlug,
        action.currentLimit,
        action.proposedLimit,
      ].join(':');
    case 'create_budget':
      return [action.kind, action.categorySlug, action.proposedLimit].join(':');
    case 'delete_budget':
      return [action.kind, action.budgetId, action.categorySlug].join(':');
    case 'create_goal':
      return [
        action.kind,
        normalizeIdentityPart(action.name),
        action.targetDate,
        action.targetAmount,
      ].join(':');
    case 'update_goal':
      return [
        action.kind,
        action.goalId,
        normalizeIdentityPart(action.name ?? action.goalName),
        action.targetDate ?? '',
        action.targetAmount ?? '',
        action.priority ?? '',
        action.status ?? '',
      ].join(':');
    case 'delete_goal':
      return [action.kind, action.goalId].join(':');
    case 'adjust_goal_contribution':
      return [action.kind, action.goalId, action.currentAmount, action.proposedAmount].join(':');
    case 'goal_contributions_batch':
      return [
        action.kind,
        action.goalId,
        action.operations.length,
        JSON.stringify(action.operations),
      ].join(':');
    case 'suggest_recurring':
      return [
        action.kind,
        normalizeIdentityPart(action.name),
        action.amount,
        action.categorySlug,
        action.frequency,
      ].join(':');
    case 'flag_subscription':
      return [
        action.kind,
        action.recurringId || normalizeIdentityPart(action.name),
        action.operation,
        action.currentAmount,
        action.proposedAmount ?? '',
      ].join(':');
    case 'create_split':
      return [
        action.kind,
        normalizeIdentityPart(action.name),
        action.amount,
        action.participants?.length ?? 0,
      ].join(':');
    case 'update_split':
      return [
        action.kind,
        action.splitId,
        normalizeIdentityPart(action.name ?? action.splitName),
        action.amount ?? '',
        action.transactionId ?? '',
        action.unlinkTransaction ?? '',
      ].join(':');
    case 'delete_split':
      return [action.kind, action.splitId].join(':');
    case 'split_participants_batch':
    case 'split_settlements_batch':
      return [
        action.kind,
        action.splitId,
        action.operations.length,
        JSON.stringify(action.operations),
      ].join(':');
  }
}
