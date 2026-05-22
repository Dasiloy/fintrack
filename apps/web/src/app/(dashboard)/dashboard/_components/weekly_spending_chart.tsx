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
  Cell,
} from '@ui/components';
import { Skeleton } from '@ui/components';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface WeeklySpendingChartProps {
  data?: GetTransactionSummaryRes | null;
  isLoading: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const chartConfig = {
  amount: { label: 'Spending', color: '#7c7aff' },
};

export function WeeklySpendingChart({ data, isLoading }: WeeklySpendingChartProps) {
  const formatCurrency = useFormatCurrency();
  // day() returns 0=Sun ... 6=Sat; convert to Mon-based index (0=Mon ... 6=Sun)
  const todayLabel = DAY_LABELS[(dayjs().day() + 6) % 7];

  const chartData = React.useMemo(() => {
    if (!data?.weeklySpending?.length) {
      return DAY_LABELS.map((label) => ({ label, amount: 0 }));
    }
    return data.weeklySpending.map((d, i) => ({
      label: DAY_LABELS[i] ?? dayjs(d.date).format('ddd'),
      amount: parseFloat(d.amount),
    }));
  }, [data]);

  const totalWeek = chartData.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="glass-card rounded-card flex h-full w-full min-w-0 flex-col overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-text-primary">This Week</h3>
          <p className="text-[11px] text-text-tertiary">Daily spending Mon–Sun</p>
        </div>
        {!isLoading && (
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-disabled">
              Total
            </p>
            <p className="text-[13px] font-bold tabular-nums text-text-primary">
              {formatCurrency(totalWeek)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto">
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <ChartContainer config={chartConfig} className="h-40 w-full overflow-hidden">
          <BarChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: 4 }} barSize={16}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--ft-color-border-subtle)"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 10, fill: 'var(--ft-color-text-disabled)' }}
            />
            <YAxis
              hide
              domain={[0, (dataMax: number) => (dataMax === 0 ? 1 : dataMax * 1.05)]}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(124,122,255,0.06)', radius: 4 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="glass-card rounded-lg px-3 py-2 text-[11px]">
                    <p className="font-semibold text-text-primary">{label}</p>
                    <p className="tabular-nums text-[#7c7aff]">
                      {formatCurrency(Number(payload[0]?.value ?? 0))}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.label === todayLabel ? '#7c7aff' : 'rgba(124,122,255,0.25)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      </div>
    </div>
  );
}
