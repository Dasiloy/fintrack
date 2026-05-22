'use client';

import * as React from 'react';
import { CalendarClock } from 'lucide-react';
import { Skeleton } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { useFormatCurrency } from '@/hooks/use_format_currency';

interface SubscriptionBurdenCardProps {
  monthlyRecurringExpense?: number;
  monthlyIncome?: number;
  isLoading: boolean;
}

export function SubscriptionBurdenCard({
  monthlyRecurringExpense = 0,
  monthlyIncome = 0,
  isLoading,
}: SubscriptionBurdenCardProps) {
  const formatCurrency = useFormatCurrency();

  const pct = monthlyIncome > 0
    ? Math.min((monthlyRecurringExpense / monthlyIncome) * 100, 999)
    : null;

  const status = pct === null ? 'neutral'
    : pct < 50 ? 'green'
    : pct < 70 ? 'amber'
    : 'red';

  const label = pct === null
    ? 'No income recorded'
    : pct < 50
      ? 'Healthy — below 50%'
      : pct < 70
        ? 'Moderate — watch fixed costs'
        : 'High — consider reducing fixed costs';

  return (
    <div className="glass-card rounded-card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-text-primary text-[13px] font-semibold">Subscription Burden</h3>
          <p className="text-text-tertiary text-[11px]">Fixed costs as % of monthly income</p>
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
          <CalendarClock className="text-text-disabled size-3.5" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <span
            className={cn(
              'text-[28px] font-bold tabular-nums leading-none',
              status === 'green' && 'text-emerald-400',
              status === 'amber' && 'text-amber-400',
              status === 'red' && 'text-red-400',
              status === 'neutral' && 'text-text-disabled',
            )}
          >
            {pct === null ? '—' : `${pct.toFixed(1)}%`}
          </span>

          {/* Progress bar */}
          <div className="bg-border-light h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                status === 'green' && 'bg-emerald-400',
                status === 'amber' && 'bg-amber-400',
                status === 'red' && 'bg-red-400',
                status === 'neutral' && 'bg-text-disabled',
              )}
              style={{ width: pct !== null ? `${Math.min(pct, 100)}%` : '0%' }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-text-tertiary text-[11px]">{label}</p>
            <span className="text-text-tertiary shrink-0 text-[11px] tabular-nums">
              {formatCurrency(monthlyRecurringExpense)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
