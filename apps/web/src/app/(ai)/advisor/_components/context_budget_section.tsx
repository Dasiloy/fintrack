'use client';

// ── ContextBudgetSection ──────────────────────────────────────────────────────
// Budget utilisation mini-bars for the current calendar month.
// Bars fill proportionally — red when over budget, yellow when ≥ 80%.

import * as React from 'react';
import { PieChart, ChevronDown } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { Skeleton } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { formatNGN } from '../_lib/advisor.helpers';

export function ContextBudgetSection() {
  const [expanded, setExpanded] = React.useState(true);

  const now = new Date();
  const { data, isLoading } = api_client.budget.getAll.useQuery(
    { month: now.getMonth(), year: now.getFullYear() },
    { staleTime: 120_000 },
  );

  const budgets = data?.data?.budgets ?? [];

  return (
    <div className="border-border-subtle border-b">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="hover:bg-bg-surface-hover flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors"
        aria-expanded={expanded}
      >
        <PieChart className="text-text-tertiary size-3.5 shrink-0" aria-hidden />
        <span className="text-text-primary flex-1 text-[12px] font-semibold">Budget Snapshot</span>
        <ChevronDown
          className={cn(
            'text-text-tertiary size-3.5 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-2.5 px-4 pb-4">
          {isLoading && (
            <>
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </>
          )}

          {!isLoading && budgets.length === 0 && (
            <p className="text-text-disabled py-2 text-[11px]">No budgets set for this month.</p>
          )}

          {!isLoading &&
            budgets.map((budget) => {
              const spent = Number(budget.spent ?? 0);
              const limit = Number(budget.amount ?? 0);
              const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const isOver = spent > limit;
              const isWarning = !isOver && pct >= 80;
              const label = budget.category?.name ?? budget.name;

              return (
                <div key={budget.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-[11px] font-medium">{label}</span>
                    <span
                      className={cn(
                        'text-[11px] font-medium tabular-nums',
                        isOver ? 'text-error' : isWarning ? 'text-warning' : 'text-text-tertiary',
                      )}
                    >
                      {formatNGN(spent)}{' '}
                      <span className="text-text-disabled font-normal">/ {formatNGN(limit)}</span>
                    </span>
                  </div>
                  <div className="bg-bg-surface-hover h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isOver ? 'bg-error' : isWarning ? 'bg-warning' : 'bg-success',
                      )}
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(pct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${label} budget: ${Math.round(pct)}% used`}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
