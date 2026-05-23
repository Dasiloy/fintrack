'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  Line,
  ReferenceLine,
  CartesianGrid,
  XAxis,
  YAxis,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Skeleton,
} from '@ui/components';

import type { ProjectionPoint } from '@fintrack/types/protos/finance/goal';
import { monthLabel, formatYAxisTick, goalProjectionChartConfig } from '../helpers';
import { useFormatCurrency } from '@/hooks/use_format_currency';

type ViewRange = '6M' | '12M';

interface GoalProjectionChartProps {
  data: ProjectionPoint[];
  isLoading?: boolean;
}

export function GoalProjectionChart({
  data, isLoading }: GoalProjectionChartProps) {
  const formatCurrency = useFormatCurrency();
  const [range, setRange] = React.useState<ViewRange>('6M');

  if (isLoading) {
    return (
      <div className="glass-card rounded-card border-border-subtle flex flex-col gap-3 border p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-52 w-full rounded-lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="glass-card rounded-card border-border-subtle flex flex-col items-center justify-center gap-2 border p-5 py-12 text-center">
        <p className="text-text-secondary text-[13px] font-medium">No projection data</p>
        <p className="text-text-disabled text-[12px]">
          Add goals with target dates to see projections
        </p>
      </div>
    );
  }

  const pastCount = data.filter((p) => !p.isProjected).length;
  const futureSlice = range === '6M' ? 3 : 12;
  const sliced = data.slice(0, pastCount + futureSlice);

  let lastActualIdx = -1;
  sliced.forEach((p, i) => {
    if (!p.isProjected) lastActualIdx = i;
  });
  const firstProjectedLabel =
    lastActualIdx + 1 < sliced.length ? monthLabel(sliced[lastActualIdx + 1]!.month) : null;

  // Stitch the two series at the boundary so they connect visually
  const chartData = sliced.map((p, i) => ({
    month: monthLabel(p.month),
    actual: !p.isProjected || i === lastActualIdx + 1 ? p.amount : null,
    projected: p.isProjected || i === lastActualIdx ? p.amount : null,
  }));

  return (
    <div className="glass-card rounded-card border-border-subtle flex flex-col gap-4 border p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-primary text-[13px] font-semibold">Savings Projection</p>
          <p className="text-text-tertiary text-[11px]">Combined active goals trajectory</p>
        </div>
        <div className="border-border-light flex overflow-hidden rounded-lg border">
          {(['6M', '12M'] as ViewRange[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setRange(v)}
              className={
                range === v
                  ? 'bg-primary/15 text-primary cursor-pointer px-3 py-1 text-[11px] font-semibold transition-colors'
                  : 'text-text-tertiary hover:text-text-secondary cursor-pointer px-3 py-1 text-[11px] font-medium transition-colors'
              }
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={goalProjectionChartConfig} className="h-72 w-full">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="grad-actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary, #7c7aff)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-primary, #7c7aff)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-projected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(124,122,255,0.5)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="rgba(124,122,255,0.5)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--ft-color-border-subtle)"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tick={{ fontSize: 10 }}
            tickFormatter={formatYAxisTick}
            width={48}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--ft-color-border-subtle)', strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  typeof value === 'number' ? formatCurrency(value) : String(value)
                }
              />
            }
          />

          {/* Solid area — actual contributions */}
          <Area
            dataKey="actual"
            stroke="var(--color-primary, #7c7aff)"
            strokeWidth={2}
            fill="url(#grad-actual)"
            connectNulls={false}
            dot={false}
            activeDot={{ r: 4 }}
          />

          {/* Dashed line — projected */}
          <Line
            dataKey="projected"
            stroke="rgba(124,122,255,0.5)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            connectNulls={false}
            dot={false}
            activeDot={{ r: 4 }}
          />

          {/* Today boundary */}
          {firstProjectedLabel && (
            <ReferenceLine
              x={firstProjectedLabel}
              stroke="var(--ft-color-border-subtle)"
              strokeDasharray="4 2"
              label={{
                value: 'Today',
                position: 'top',
                fontSize: 9,
                fill: 'var(--ft-color-text-disabled)',
              }}
            />
          )}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
