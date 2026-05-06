'use client';

import { getTimeFromNow } from '@fintrack/utils/date';
import dayjs from '@fintrack/utils/date';
import { useAtomValue } from 'jotai';
import {
  ArrowUpDown,
  PiggyBank,
  RefreshCw,
  SplitSquareVertical,
  Target,
  Activity,
} from 'lucide-react';
import { Skeleton } from '@ui/components';
import { cn } from '@ui/lib/utils';
import { activityAtom } from '@/lib/jotai/activity';
import { useActivity } from '@/hooks/use_activity';
import type { ActivityLogs } from '@fintrack/database/types';
import { capitalize, formatCurrency } from '@fintrack/utils/format';

// =============================================================================
// Helpers
// =============================================================================

const EVENT_WORD_OVERRIDES: Record<string, string> = {
  upserted: 'Created',
};

function formatEventLabel(event: string): string {
  return event
    .split('_')
    .map((word) => {
      const override = EVENT_WORD_OVERRIDES[word.toLowerCase()];
      return override ?? capitalize(word);
    })
    .join(' ');
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  budget: <PiggyBank className="size-3.5" />,
  transaction: <ArrowUpDown className="size-3.5" />,
  goal: <Target className="size-3.5" />,
  split: <SplitSquareVertical className="size-3.5" />,
  recurring: <RefreshCw className="size-3.5" />,
};

const ENTITY_ICON_COLORS: Record<string, string> = {
  budget: 'border-violet-500/20 bg-violet-500/8 text-violet-400',
  transaction: 'border-blue-500/20 bg-blue-500/8 text-blue-400',
  goal: 'border-amber-500/20 bg-amber-500/8 text-amber-400',
  split: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-400',
  recurring: 'border-cyan-500/20 bg-cyan-500/8 text-cyan-400',
};

const GOAL_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400',
  COMPLETED: 'bg-blue-500/10 text-blue-400',
  ON_HOLD: 'bg-amber-500/10 text-amber-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
};

const SPLIT_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400',
  SETTLED: 'bg-emerald-500/10 text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
};

function fmt(value: string | undefined) {
  if (!value) return null;
  const n = Number(value);
  return isNaN(n) ? null : formatCurrency(n);
}

// =============================================================================
// Entity-specific detail line
// =============================================================================

function ActivityDetail({ log }: { log: ActivityLogs }) {
  const d = log.data as Record<string, string> | null;
  if (!d) return null;

  if (d.type === 'transaction') {
    const isExpense = d.transactionType === 'EXPENSE';
    const amount = fmt(d.transactionAmount);
    const date = d.transactionDate ? dayjs(d.transactionDate).format('DD MMM YYYY') : null;
    const source = d.transactionSource
      ? d.transactionSource.charAt(0) + d.transactionSource.slice(1).toLowerCase()
      : null;

    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {amount && (
          <span
            className={cn(
              'text-[11px] font-semibold tabular-nums',
              isExpense ? 'text-red-400' : 'text-emerald-400',
            )}
          >
            {isExpense ? '-' : '+'}
            {amount}
          </span>
        )}
        {d.transactionType && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium',
              isExpense ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400',
            )}
          >
            {isExpense ? 'Expense' : 'Income'}
          </span>
        )}
        {source && <span className="text-text-disabled text-[10px]">{source}</span>}
        {date && <span className="text-text-disabled text-[10px]">{date}</span>}
      </div>
    );
  }

  if (d.type === 'budget') {
    const amount = fmt(d.budgetAmount);
    const period = d.budgetPeriod
      ? d.budgetPeriod.charAt(0) + d.budgetPeriod.slice(1).toLowerCase()
      : null;

    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {d.budgetName && (
          <span className="text-text-secondary text-[11px] font-medium">{d.budgetName}</span>
        )}
        {amount && <span className="text-text-disabled text-[11px] tabular-nums">{amount}</span>}
        {period && (
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
            {period}
          </span>
        )}
      </div>
    );
  }

  if (d.type === 'goal') {
    const target = fmt(d.goalTargetAmount);
    const statusStyle = d.goalStatus
      ? (GOAL_STATUS_STYLES[d.goalStatus] ?? 'bg-white/8 text-white/40')
      : null;

    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {d.goalName && (
          <span className="text-text-secondary text-[11px] font-medium">{d.goalName}</span>
        )}
        {target && (
          <span className="text-text-disabled text-[11px] tabular-nums">{target} target</span>
        )}
        {d.goalStatus && statusStyle && (
          <span
            className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', statusStyle)}
          >
            {d.goalStatus.toLowerCase().replace('_', ' ')}
          </span>
        )}
      </div>
    );
  }

  if (d.type === 'split') {
    const amount = fmt(d.splitAmount);
    const statusStyle = d.splitStatus
      ? (SPLIT_STATUS_STYLES[d.splitStatus] ?? 'bg-white/8 text-white/40')
      : null;

    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {d.splitName && (
          <span className="text-text-secondary text-[11px] font-medium">{d.splitName}</span>
        )}
        {amount && <span className="text-text-disabled text-[11px] tabular-nums">{amount}</span>}
        {d.splitStatus && statusStyle && (
          <span
            className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', statusStyle)}
          >
            {d.splitStatus.toLowerCase()}
          </span>
        )}
      </div>
    );
  }

  if (d.type === 'recurring') {
    const amount = fmt(d.recurringAmount);
    const frequency = d.recurringFrequency
      ? d.recurringFrequency.charAt(0) + d.recurringFrequency.slice(1).toLowerCase()
      : null;

    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {d.recurringName && (
          <span className="text-text-secondary text-[11px] font-medium">{d.recurringName}</span>
        )}
        {amount && <span className="text-text-disabled text-[11px] tabular-nums">{amount}</span>}
        {frequency && (
          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
            {frequency}
          </span>
        )}
      </div>
    );
  }

  return null;
}

// =============================================================================
// Row
// =============================================================================

function ActivityRow({ log }: { log: ActivityLogs }) {
  const icon = ENTITY_ICONS[log.entityType] ?? <Activity className="size-3.5" />;
  const iconColor =
    ENTITY_ICON_COLORS[log.entityType] ?? 'border-white/8 bg-white/3 text-text-tertiary';
  const label = formatEventLabel(log.event);

  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={cn(
          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border',
          iconColor,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-text-primary truncate text-[12px] font-medium">{label}</p>
          <span className="text-text-disabled shrink-0 text-[10px] tabular-nums">
            {getTimeFromNow(new Date(log.createdAt))}
          </span>
        </div>
        <ActivityDetail log={log} />
      </div>
    </div>
  );
}

function ActivityRowSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="mt-0.5 size-6 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-2.5 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-2.5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main
// =============================================================================

export function ActivityFeed() {
  useActivity();
  const { loading, logs } = useAtomValue(activityAtom);

  if (loading) {
    return (
      <div className="divide-y divide-white/6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ActivityRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Activity className="text-text-disabled size-5" />
        <p className="text-text-tertiary text-[13px]">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/6">
      {logs.map((log) => (
        <ActivityRow key={log.id} log={log} />
      ))}
    </div>
  );
}
