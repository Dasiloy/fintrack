'use client';

import type { TooltipEntry } from '@/app/(dashboard)/finances/budgets/types';

import type { ChartConfig } from '@ui/components';
import { useFormatCurrency } from '@/hooks/use_format_currency';

interface SpendingTrendChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  config: ChartConfig;
}

export function SpendingTrendChartTooltip({
  active,
  payload,
  label,
  config,
}: SpendingTrendChartTooltipProps) {
  const formatCurrency = useFormatCurrency();
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-bg-elevated border-border-light min-w-40 rounded-lg border px-2.5 py-2 text-xs shadow-xl">
      <p className="text-text-secondary mb-2 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-6 py-0.5">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-secondary">
              {config[String(entry.dataKey)]?.label ?? entry.name ?? entry.dataKey}
            </span>
          </div>
          <span className="text-text-primary font-mono tabular-nums">
            {formatCurrency(Number(entry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}
