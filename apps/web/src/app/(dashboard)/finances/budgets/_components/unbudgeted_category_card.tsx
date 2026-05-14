'use client';

import { Plus } from 'lucide-react';
import { formatCurrency } from '@fintrack/utils/format';
import type { UnbudgetedCategory } from '@fintrack/types/protos/finance/budget';

interface UnbudgetedCategoryCardProps {
  category: UnbudgetedCategory;
  onSetBudget: (categoryId: string) => void;
}

export function UnbudgetedCategoryCard({ category, onSetBudget }: UnbudgetedCategoryCardProps) {
  const color = category.color ?? '#8b8b98';

  return (
    <div className="border-border-subtle bg-bg-surface flex flex-col rounded-xl border border-dashed p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
          <p className="text-text-primary truncate text-[13px] font-semibold">{category.name}</p>
        </div>

        <button
          type="button"
          onClick={() => onSetBudget(category.slug)}
          className="bg-primary/10 text-primary hover:bg-primary/20 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
          aria-label={`Set budget for ${category.name}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Spend info */}
      <div className="mt-4 space-y-1">
        <p className="text-text-primary text-[15px] font-semibold tabular-nums">
          {formatCurrency(category.spent)}
        </p>
        <p className="text-text-tertiary text-[11px]">spent this month</p>
      </div>

      <p className="text-text-disabled mt-3 text-[11px] font-medium">No budget set</p>
    </div>
  );
}
