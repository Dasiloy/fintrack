'use client';

import * as React from 'react';
import type { SpendingTrendMonth } from '@fintrack/types/protos/finance/budget';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  XAxis,
  YAxis,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import type { SpendingTrendMode, TooltipEntry } from '@/app/(dashboard)/finances/budgets/types';
import {
  buildCategoryConfig,
  buildCategoryData,
  buildTotalConfig,
  buildTotalData,
  formatYAxisTick,
} from '@/app/(dashboard)/finances/budgets/helpers';
import { SpendingTrendChartTooltip } from '@/app/(dashboard)/finances/budgets/_components/spending_trend_chart_tooltip';

interface SpendingTrendChartProps {
  data: SpendingTrendMonth[];
  mode?: SpendingTrendMode;
  className?: string;
}

export function SpendingTrendChart({ data, mode = 'total', className }: SpendingTrendChartProps) {
  const config = React.useMemo(
    () => (mode === 'total' ? buildTotalConfig() : buildCategoryConfig(data)),
    [data, mode],
  );

  const chartData = React.useMemo(
    () => (mode === 'total' ? buildTotalData(data) : buildCategoryData(data)),
    [data, mode],
  );

  const areaKeys = Object.keys(config);
  // Show at most 4 evenly-spread labels regardless of window size
  const xInterval = Math.max(0, Math.floor((chartData.length - 1) / 3));

  return (
    <ChartContainer config={config} className={cn('h-72 w-full overflow-hidden', className)}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
        <defs>
          {areaKeys.map((key) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${key})`} stopOpacity={0.3} />
              <stop offset="100%" stopColor={`var(--color-${key})`} stopOpacity={0} />
            </linearGradient>
          ))}
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
          tick={{ fontSize: 10 }}
          interval={xInterval}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tick={{ fontSize: 10 }}
          tickFormatter={formatYAxisTick}
          width={52}
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--ft-color-border-subtle)', strokeWidth: 1 }}
          content={({ active, payload, label: lbl }) => (
            <SpendingTrendChartTooltip
              active={active}
              payload={payload as unknown as TooltipEntry[] | undefined}
              label={lbl?.toString()}
              config={config}
            />
          )}
        />
        {areaKeys.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            fill={`url(#grad-${key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
