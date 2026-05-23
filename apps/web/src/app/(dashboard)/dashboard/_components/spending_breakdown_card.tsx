'use client';

import * as React from 'react';
import { Skeleton } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import { api_client } from '@/lib/trpc_app/api_client';

interface CategoryBar {
  name: string;
  color: string;
  amount: number;
  pct: number;
}

export function SpendingBreakdownCard() {
  const formatCurrency = useFormatCurrency();

  const { data, isLoading } = api_client.budget.getSpendingTrend.useQuery(
    { months: 3 },
    { staleTime: 5 * 60 * 1000 },
  );

  const categories = React.useMemo<CategoryBar[]>(() => {
    const months = data?.data?.data;
    if (!months?.length) return [];

    // Merge all byCategory entries across months (usually 1 here)
    const map = new Map<string, { name: string; color: string; amount: number }>();
    for (const month of months) {
      for (const cat of month.byCategory ?? []) {
        const existing = map.get(cat.name);
        if (existing) {
          existing.amount += cat.amount;
        } else {
          map.set(cat.name, { name: cat.name, color: cat.color, amount: cat.amount });
        }
      }
    }

    const sorted = [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const total = sorted.reduce((sum, c) => sum + c.amount, 0) || 1;
    return sorted.map((c) => ({ ...c, pct: (c.amount / total) * 100 }));
  }, [data]);

  return (
    <div className="glass-card rounded-card flex flex-col p-5">
      <div className="mb-4">
        <h3 className="text-text-primary text-[13px] font-semibold">Top Categories</h3>
        <p className="text-text-tertiary text-[11px]">Spending breakdown for past three months</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-text-disabled text-[12px]">No category data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.name}>
              <div className="mb-1.5 flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: cat.color || '#7c7aff' }}
                  />
                  <span className="text-text-secondary truncate text-[12px] font-medium">
                    {cat.name}
                  </span>
                </div>
                <span className="text-text-primary shrink-0 text-[11px] font-semibold tabular-nums">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
              <div className="bg-bg-surface-hover relative h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full transition-all duration-700 ease-out')}
                  style={{
                    width: `${cat.pct}%`,
                    background: cat.color || '#7c7aff',
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
