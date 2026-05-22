'use client';

import * as React from 'react';
import dayjs from '@fintrack/utils/date';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
} from '@ui/components';
import { Skeleton } from '@ui/components';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface IncomeExpenseChartProps {
  data?: GetTransactionSummaryRes | null;
  isLoading: boolean;
}

const chartConfig = {
  income: { label: 'Income', color: '#30d158' },
  expense: { label: 'Expense', color: '#ff453a' },
};

function formatYAxis(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
  return String(val);
}

export function IncomeExpenseChart({ data, isLoading }: IncomeExpenseChartProps) {
  const formatCurrency = useFormatCurrency();

  const chartData = React.useMemo(() => {
    if (!data?.monthlySeries?.length) return [];
    return [...data.monthlySeries]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        label: dayjs(m.month + '-01').format('MMM'),
        income: parseFloat(m.income),
        expense: parseFloat(m.expense),
      }));
  }, [data]);

  const xInterval = Math.max(0, Math.floor((chartData.length - 1) / 5));

  return (
    <div className="glass-card rounded-card flex h-full w-full min-w-0 flex-col overflow-hidden p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-y-2">
        <div className="min-w-0">
          <h3 className="text-text-primary text-[13px] font-semibold">Income vs Expense</h3>
          <p className="text-text-tertiary text-[11px]">Monthly breakdown</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
            <span className="size-2 rounded-full bg-[#30d158]" />
            Income
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
            <span className="size-2 rounded-full bg-[#ff453a]" />
            Expense
          </span>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="flex h-56 items-center justify-center">
          <p className="text-text-disabled text-[12px]">No data yet</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-56 w-full overflow-hidden">
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-disabled)' }}
              axisLine={false}
              tickLine={false}
              interval={xInterval}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fill: 'var(--color-text-disabled)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(124,122,255,0.06)', radius: 4 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="glass-card rounded-lg px-3 py-2 text-[11px]">
                    <p className="text-text-primary mb-1.5 font-semibold">{label}</p>
                    {payload.map((entry) => (
                      <div key={entry.dataKey as string} className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: entry.color }}
                        />
                        <span className="text-text-tertiary capitalize">{entry.name}</span>
                        <span className="text-text-primary ml-auto pl-4 tabular-nums font-medium">
                          {formatCurrency(Number(entry.value ?? 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="income" fill="#30d158" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={18} />
            <Bar dataKey="expense" fill="#ff453a" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
