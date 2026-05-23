'use client';

import * as React from 'react';
import dayjs from '@fintrack/utils/date';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ChartContainer,
  ChartTooltip,
} from '@ui/components';
import { Skeleton } from '@ui/components';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface NetWorthChartProps {
  data?: GetTransactionSummaryRes | null;
  isLoading: boolean;
}

const chartConfig = {
  net: { label: 'Net Worth', color: '#7c7aff' },
};

function formatYAxis(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K`;
  return `${sign}${abs}`;
}

export function NetWorthChart({ data, isLoading }: NetWorthChartProps) {
  const formatCurrency = useFormatCurrency();

  const { chartData, isGrowing } = React.useMemo(() => {
    if (!data?.monthlySeries?.length) return { chartData: [], isGrowing: true };

    const sorted = [...data.monthlySeries].sort((a, b) => a.month.localeCompare(b.month));
    let running = 0;
    const points = sorted.map((m) => {
      running += parseFloat(m.income) - parseFloat(m.expense);
      return {
        label: dayjs(m.month + '-01').format('MMM YY'),
        net: parseFloat(running.toFixed(2)),
      };
    });

    const first = points[0]?.net ?? 0;
    const last = points[points.length - 1]?.net ?? 0;
    return { chartData: points, isGrowing: last >= first };
  }, [data]);

  const color = isGrowing ? '#30d158' : '#ff453a';
  const gradientId = isGrowing ? 'nw-grad-green' : 'nw-grad-red';
  const xInterval = Math.max(0, Math.floor((chartData.length - 1) / 5));

  return (
    <div className="glass-card rounded-card flex h-full w-full min-w-0 flex-col overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-text-primary text-[13px] font-semibold">Net Worth Trajectory</h3>
          <p className="text-text-tertiary text-[11px]">Cumulative wealth built over time</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: isGrowing ? 'rgba(48,209,88,0.1)' : 'rgba(255,69,58,0.1)',
            color: isGrowing ? '#30d158' : '#ff453a',
          }}
        >
          {isGrowing ? '↑ Growing' : '↓ Declining'}
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
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              width={40}
            />
            <ReferenceLine y={0} stroke="var(--color-border-light)" strokeDasharray="4 2" />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const val = Number(payload[0]?.value ?? 0);
                return (
                  <div className="glass-card rounded-lg px-3 py-2 text-[11px]">
                    <p className="text-text-primary mb-1 font-semibold">{label}</p>
                    <div className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
                      <span className="text-text-tertiary">Net worth</span>
                      <span
                        className="ml-auto pl-4 font-medium tabular-nums"
                        style={{ color }}
                      >
                        {formatCurrency(val)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 3.5, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
