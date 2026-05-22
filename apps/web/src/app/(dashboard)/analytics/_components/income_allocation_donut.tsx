'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ChartContainer } from '@ui/components';
import { Skeleton } from '@ui/components';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface IncomeAllocationDonutProps {
  summary?: GetTransactionSummaryRes | null;
  monthlyRecurringExpense: number;
  isLoading: boolean;
}

const SLICES = [
  { key: 'fixed', label: 'Fixed Costs', color: '#ff453a' },
  { key: 'variable', label: 'Variable Spending', color: '#ff9f0a' },
  { key: 'saved', label: 'Saved / Surplus', color: '#30d158' },
] as const;

const chartConfig = {
  fixed: { label: 'Fixed Costs', color: '#ff453a' },
  variable: { label: 'Variable Spending', color: '#ff9f0a' },
  saved: { label: 'Saved / Surplus', color: '#30d158' },
};

export function IncomeAllocationDonut({
  summary,
  monthlyRecurringExpense,
  isLoading,
}: IncomeAllocationDonutProps) {
  const formatCurrency = useFormatCurrency();

  const { slices, total } = React.useMemo(() => {
    const income = parseFloat(summary?.monthlyIncome ?? '0');
    const totalExpense = parseFloat(summary?.monthlyExpense ?? '0');
    const net = parseFloat(summary?.monthlyNet ?? '0');
    const fixed = Math.max(0, Math.min(monthlyRecurringExpense, income));
    const variable = Math.max(0, totalExpense - fixed);
    const saved = Math.max(0, net);

    return {
      slices: [
        { key: 'fixed' as const, value: fixed },
        { key: 'variable' as const, value: variable },
        { key: 'saved' as const, value: saved },
      ],
      total: income,
    };
  }, [summary, monthlyRecurringExpense]);

  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const hasData = total > 0;

  return (
    <div className="glass-card rounded-card flex h-full flex-col p-5">
      <div className="mb-4">
        <h3 className="text-text-primary text-[13px] font-semibold">Income Allocation</h3>
        <p className="text-text-tertiary text-[11px]">Where your monthly income goes</p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center gap-6">
          <Skeleton className="size-36 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-9 w-36 rounded-lg" />)}
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-disabled text-[12px]">No income recorded this month</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-wrap items-center gap-6">
          {/* Donut */}
          <div className="relative mx-auto shrink-0" style={{ width: 144, height: 144 }}>
            <ChartContainer config={chartConfig} className="h-36 w-36">
              <PieChart>
                <Pie
                  data={slices.filter((s) => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveKey(slices.filter(s => s.value > 0)[index]?.key ?? null)}
                  onMouseLeave={() => setActiveKey(null)}
                  stroke="none"
                >
                  {slices.filter((s) => s.value > 0).map((slice) => {
                    const meta = SLICES.find((s) => s.key === slice.key)!;
                    return (
                      <Cell
                        key={slice.key}
                        fill={meta.color}
                        opacity={activeKey === null || activeKey === slice.key ? 1 : 0.35}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Centre label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {activeKey ? (
                <>
                  <span className="text-text-primary text-[11px] font-bold tabular-nums leading-tight">
                    {((slices.find(s => s.key === activeKey)?.value ?? 0) / total * 100).toFixed(0)}%
                  </span>
                  <span className="text-text-disabled text-[9px] leading-tight capitalize">
                    {SLICES.find(s => s.key === activeKey)?.label.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-text-primary text-[10px] font-semibold tabular-nums leading-tight">
                    {formatCurrency(total).replace(/\.00$/, '')}
                  </span>
                  <span className="text-text-disabled text-[9px] leading-tight">income</span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {SLICES.map(({ key, label, color }) => {
              const slice = slices.find((s) => s.key === key)!;
              const pct = total > 0 ? (slice.value / total) * 100 : 0;
              return (
                <div
                  key={key}
                  className="flex min-w-0 flex-col gap-0.5"
                  onMouseEnter={() => setActiveKey(key)}
                  onMouseLeave={() => setActiveKey(null)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
                      <span className="text-text-tertiary truncate text-[11px]">{label}</span>
                    </div>
                    <span className="text-text-primary shrink-0 text-[11px] font-semibold tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="bg-border-light h-1 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, background: color, opacity: activeKey === null || activeKey === key ? 1 : 0.35 }}
                    />
                  </div>
                  <span className="text-text-disabled text-[10px] tabular-nums">
                    {formatCurrency(slice.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
