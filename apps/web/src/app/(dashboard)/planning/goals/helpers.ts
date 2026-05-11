import type { ChartConfig } from '@ui/components';
import { Crown, Flame, Trophy, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format } from '@fintrack/utils/date';

export function milestoneForStreak(n: number): { icon: LucideIcon; label: string; cls: string } | null {
  if (n >= 12) return { icon: Crown,  label: 'Year Streak',    cls: 'bg-yellow-400/15 border-yellow-400/25 text-yellow-300' };
  if (n >= 6)  return { icon: Trophy, label: 'Diamond Saver',  cls: 'bg-violet-400/15 border-violet-400/25 text-violet-300' };
  if (n >= 3)  return { icon: Zap,    label: 'Streak Master',  cls: 'bg-amber-400/15  border-amber-400/25  text-amber-300'  };
  if (n >= 1)  return { icon: Flame,  label: 'On Track',       cls: 'bg-blue-400/15   border-blue-400/25   text-blue-300'   };
  return null;
}

export function progressBarColor(pct: number, status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-500';
  if (pct >= 90) return 'bg-emerald-400';
  if (pct >= 50) return 'bg-amber-400';
  return 'bg-blue-400';
}

export function monthLabel(yyyyMM: string): string {
  try {
    return format(new Date(yyyyMM + '-01'), 'MMM');
  } catch {
    return yyyyMM.slice(5);
  }
}

export function formatYAxisTick(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

export const goalProjectionChartConfig = {
  actual: { label: 'Actual', color: 'var(--color-primary, #7c7aff)' },
  projected: { label: 'Projected', color: 'rgba(124,122,255,0.5)' },
} satisfies ChartConfig;

export type GoalPriorityVariant = 'secondary' | 'info' | 'warning';
export type GoalStatusVariant = 'info' | 'warning' | 'success';

export function priorityVariant(priority: string): GoalPriorityVariant {
  if (priority === 'HIGH') return 'warning';
  if (priority === 'LOW') return 'secondary';
  return 'info';
}

export function statusVariant(status: string): GoalStatusVariant {
  if (status === 'ON_HOLD') return 'warning';
  if (status === 'COMPLETED') return 'success';
  return 'info';
}

export function statusLabel(status: string): string {
  if (status === 'ON_HOLD') return 'On Hold';
  if (status === 'COMPLETED') return 'Completed';
  return 'Active';
}
