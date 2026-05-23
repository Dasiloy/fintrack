'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, PiggyBank, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';
import type { GoalsAggregate } from '@fintrack/types/protos/finance/goal';
import type { Budget } from '@fintrack/types/protos/finance/budget';

type ChipStatus = 'green' | 'amber' | 'red';

interface ScoreChipProps {
  label: string;
  value: string;
  status: ChipStatus;
  icon: React.ReactNode;
  sub?: string;
}

function ScoreChip({ label, value, status, icon, sub }: ScoreChipProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl border px-4 py-3',
        status === 'green' && 'border-emerald-500/15 bg-emerald-500/6',
        status === 'amber' && 'border-amber-500/15 bg-amber-500/6',
        status === 'red' && 'border-red-500/15 bg-red-500/6',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'text-[10px] font-semibold tracking-wider uppercase',
            status === 'green' && 'text-emerald-500/70',
            status === 'amber' && 'text-amber-500/70',
            status === 'red' && 'text-red-500/70',
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-md',
            status === 'green' && 'bg-emerald-500/15 text-emerald-400',
            status === 'amber' && 'bg-amber-500/15 text-amber-400',
            status === 'red' && 'bg-red-500/15 text-red-400',
          )}
        >
          {icon}
        </span>
      </div>
      <span
        className={cn(
          'text-[18px] font-bold tabular-nums leading-none',
          status === 'green' && 'text-emerald-400',
          status === 'amber' && 'text-amber-400',
          status === 'red' && 'text-red-400',
        )}
      >
        {value}
      </span>
      {sub && (
        <span className="text-text-tertiary text-[10px]">{sub}</span>
      )}
    </div>
  );
}

interface HealthScorecardProps {
  summary?: GetTransactionSummaryRes | null;
  goalAggregate?: GoalsAggregate | null;
  budgets?: Budget[];
  isLoading: boolean;
}

export function HealthScorecard({ summary, goalAggregate, budgets = [], isLoading }: HealthScorecardProps) {
  const monthlyIncome = parseFloat(summary?.monthlyIncome ?? '0');
  const monthlyExpense = parseFloat(summary?.monthlyExpense ?? '0');
  const monthlyNet = parseFloat(summary?.monthlyNet ?? '0');

  // Cashflow
  const cashflowStatus: ChipStatus = monthlyNet > 0 ? 'green' : monthlyNet === 0 ? 'amber' : 'red';
  const cashflowIcon = monthlyNet > 0
    ? <TrendingUp className="size-3" />
    : monthlyNet === 0
      ? <Minus className="size-3" />
      : <TrendingDown className="size-3" />;

  // Budget adherence — % of budgets where spent < alertThreshold * amount
  const adherencePct = React.useMemo(() => {
    if (!budgets.length) return null;
    const underThreshold = budgets.filter((b) => {
      const spent = parseFloat(b.spent);
      const threshold = b.alertThreshold > 0 ? b.alertThreshold / 100 : 0.8;
      return spent < b.amount * threshold;
    }).length;
    return (underThreshold / budgets.length) * 100;
  }, [budgets]);

  const budgetStatus: ChipStatus =
    adherencePct === null ? 'amber'
    : adherencePct >= 80 ? 'green'
    : adherencePct >= 60 ? 'amber'
    : 'red';

  // Goals on pace
  const goalsPct = goalAggregate && goalAggregate.activeCount > 0
    ? (goalAggregate.onTrackCount / goalAggregate.activeCount) * 100
    : null;

  const goalsStatus: ChipStatus =
    goalsPct === null ? 'amber'
    : goalsPct >= 75 ? 'green'
    : goalsPct >= 50 ? 'amber'
    : 'red';

  // Savings rate
  const savingsRate = monthlyIncome > 0 ? (monthlyNet / monthlyIncome) * 100 : null;
  const savingsStatus: ChipStatus =
    savingsRate === null ? 'amber'
    : savingsRate >= 20 ? 'green'
    : savingsRate >= 10 ? 'amber'
    : 'red';

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <ScoreChip
        label="Cashflow"
        value={monthlyNet === 0 ? 'Neutral' : monthlyNet > 0 ? 'Positive' : 'Negative'}
        status={cashflowStatus}
        icon={cashflowIcon}
        sub={monthlyNet === 0 ? 'No net change' : monthlyNet > 0 ? 'Surplus this month' : 'Deficit this month'}
      />
      <ScoreChip
        label="Budget Adherence"
        value={adherencePct === null ? '—' : `${Math.round(adherencePct)}%`}
        status={budgetStatus}
        icon={<ShieldCheck className="size-3" />}
        sub={adherencePct === null ? 'No budgets set' : `${Math.round(adherencePct)}% under threshold`}
      />
      <ScoreChip
        label="Goals on Pace"
        value={goalsPct === null ? '—' : `${Math.round(goalsPct)}%`}
        status={goalsStatus}
        icon={<Target className="size-3" />}
        sub={
          goalAggregate && goalAggregate.activeCount > 0
            ? `${goalAggregate.onTrackCount} of ${goalAggregate.activeCount} active`
            : 'No active goals'
        }
      />
      <ScoreChip
        label="Savings Rate"
        value={savingsRate === null ? '—' : `${savingsRate.toFixed(1)}%`}
        status={savingsStatus}
        icon={<PiggyBank className="size-3" />}
        sub={savingsRate === null ? 'No income recorded' : savingsRate >= 20 ? 'On target' : 'Below 20% target'}
      />
    </div>
  );
}
