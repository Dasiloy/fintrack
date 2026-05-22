'use client';

import * as React from 'react';
import dayjs from '@fintrack/utils/date';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ChartContainer,
  ChartTooltip,
} from '@ui/components';
import { Skeleton } from '@ui/components';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface SavingsRateChartProps {
  data?: GetTransactionSummaryRes | null;
  isLoading: boolean;
}

const chartConfig = {
  rate: { label: 'Savings Rate', color: '#7c7aff' },
};

export function SavingsRateChart({ data, isLoading }: SavingsRateChartProps) {
  const chartData = React.useMemo(() => {
    if (!data?.monthlySeries?.length) return [];
    return [...data.monthlySeries]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => {
        const income = parseFloat(m.income);
        const expense = parseFloat(m.expense);
        const rate = income > 0 ? ((income - expense) / income) * 100 : 0;
        return {
          label: dayjs(m.month + '-01').format('MMM'),
          rate: parseFloat(rate.toFixed(1)),
        };
      });
  }, [data]);

  const xInterval = Math.max(0, Math.floor((chartData.length - 1) / 5));

  return (
    <div className="glass-card rounded-card flex h-full w-full min-w-0 flex-col overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-text-primary text-[13px] font-semibold">Savings Rate Trend</h3>
          <p className="text-text-tertiary text-[11px]">Monthly % of income saved</p>
        </div>
        <span className="text-text-disabled flex items-center gap-1 text-[10px]">
          <span className="inline-block h-px w-4 border-t border-dashed border-[#30d158]" />
          20% target
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="flex h-56 items-center justify-center">
          <p className="text-text-disabled text-[12px]">No data yet</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-56 w-full overflow-hidden">
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-disabled)' }}
              axisLine={false}
              tickLine={false}
              interval={xInterval}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: 'var(--color-text-disabled)' }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="glass-card rounded-lg px-3 py-2 text-[11px]">
                    <p className="text-text-primary mb-1 font-semibold">{label}</p>
                    <div className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full bg-[#7c7aff]" />
                      <span className="text-text-tertiary">Savings rate</span>
                      <span className="text-text-primary ml-auto pl-4 tabular-nums font-medium">
                        {payload[0]?.value}%
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={20}
              stroke="#30d158"
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              strokeWidth={1.5}
            />
            <ReferenceLine y={0} stroke="var(--color-border-light)" strokeDasharray="4 2" />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#7c7aff"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#7c7aff', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#7c7aff' }}
            />
          </LineChart>
        </ChartContainer>
      )}
    </div>
  );
}
