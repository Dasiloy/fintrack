'use client';

import * as React from 'react';
import dayjs from '@fintrack/utils/date';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
} from '@ui/components';
import { Skeleton } from '@ui/components';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface MonthlyCashflowChartProps {
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

export function MonthlyCashflowChart({ data, isLoading }: MonthlyCashflowChartProps) {
  const formatCurrency = useFormatCurrency();

  const chartData = React.useMemo(() => {
    if (!data?.monthlySeries?.length) return [];
    return data.monthlySeries.map((m) => ({
      label: dayjs(m.month + '-01').format('MMM'),
      income: parseFloat(m.income),
      expense: parseFloat(m.expense),
    }));
  }, [data]);

  const xInterval = Math.max(0, Math.floor((chartData.length - 1) / 4));

  return (
    <div className="glass-card rounded-card flex h-full w-full min-w-0 flex-col overflow-hidden p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-y-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-text-primary">Monthly Cashflow</h3>
          <p className="text-[11px] text-text-tertiary">Income vs expenses over time</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
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
          <p className="text-[12px] text-text-disabled">No cashflow data yet</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-56 w-full overflow-hidden">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="dash-grad-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#30d158" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#30d158" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dash-grad-expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff453a" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ff453a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--ft-color-border-subtle)"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10, fill: 'var(--ft-color-text-disabled)' }}
              interval={xInterval}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tick={{ fontSize: 10, fill: 'var(--ft-color-text-disabled)' }}
              tickFormatter={formatYAxis}
              width={40}
            />
            <ChartTooltip
              cursor={{ stroke: 'var(--ft-color-border-subtle)', strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="glass-card rounded-lg px-3 py-2 text-[11px] shadow-card">
                    <p className="mb-1.5 font-semibold text-text-primary">{label}</p>
                    {payload.map((entry) => (
                      <div key={entry.dataKey as string} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: entry.color }}
                          />
                          <span className="capitalize text-text-tertiary">{entry.dataKey as string}</span>
                        </div>
                        <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
                          {formatCurrency(Number(entry.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#30d158"
              strokeWidth={1.5}
              fill="url(#dash-grad-income)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: '#30d158' }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#ff453a"
              strokeWidth={1.5}
              fill="url(#dash-grad-expense)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: '#ff453a' }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
