'use client';

// ── ContextBudgetSection ──────────────────────────────────────────────────────
// Budget utilisation mini-bars in the right context panel.
// Shows how each budget category is tracking against its limit for the month.
// Bars fill proportionally — red when over budget, yellow when over 80%.

import * as React from 'react';
import { PieChart, ChevronDown } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { formatNGN } from '../_lib/advisor.helpers';
import { STUB_BUDGETS } from '../_lib/advisor.stub';

export function ContextBudgetSection() {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div className="border-b border-border-subtle">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-bg-surface-hover"
        aria-expanded={expanded}
      >
        <PieChart className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
        <span className="flex-1 text-[12px] font-semibold text-text-primary">Budget Snapshot</span>
        <ChevronDown
          className={cn(
            'size-3.5 text-text-tertiary transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-2.5 px-4 pb-4">
          {STUB_BUDGETS.map((budget) => {
            const pct = Math.min((budget.spent / budget.budgeted) * 100, 100);
            const isOver = budget.spent > budget.budgeted;
            const isWarning = !isOver && pct >= 80;

            return (
              <div key={budget.categorySlug} className="flex flex-col gap-1">
                {/* Label row */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-text-secondary">
                    {budget.label}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] tabular-nums font-medium',
                      isOver ? 'text-error' : isWarning ? 'text-warning' : 'text-text-tertiary',
                    )}
                  >
                    {formatNGN(budget.spent)}{' '}
                    <span className="font-normal text-text-disabled">/ {formatNGN(budget.budgeted)}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
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
                    aria-label={`${budget.label} budget: ${Math.round(pct)}% used`}
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
