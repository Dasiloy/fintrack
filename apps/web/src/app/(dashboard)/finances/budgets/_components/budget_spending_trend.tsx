'use client';

import * as React from 'react';
import { api_client } from '@/lib/trpc_app/api_client';
import { type SpendingTrendMode, type TrendWindow } from '@/app/(dashboard)/finances/budgets/types';
import { SpendingTrendChart } from './spending_trend_chart';
import { SpendingTrendChartSkeleton } from './spending_trend_skeletoon';
import { SpendingTrendHeader } from './spending_trend_header';

interface BudgetSpendingTrendProps {
  defaultMonths?: TrendWindow;
}

export function BudgetSpendingTrend({ defaultMonths = 6 }: BudgetSpendingTrendProps) {
  const [mounted, setMounted] = React.useState(false);
  const [months, setMonths] = React.useState<TrendWindow>(defaultMonths);
  const [mode, setMode] = React.useState<SpendingTrendMode>('total');

  React.useEffect(() => setMounted(true), []);

  const { data, isLoading } = api_client.budget.getSpendingTrend.useQuery(
    { months },
    {
      staleTime: 15 * 60 * 1000,
    },
  );

  const trendData = data?.data?.data ?? [];

  return (
    <div className="space-y-3">
      <SpendingTrendHeader
        mode={mode}
        months={months}
        onModeChange={setMode}
        onMonthsChange={setMonths}
      />

      {/* Chart */}
      {isLoading || !mounted ? (
        <SpendingTrendChartSkeleton />
      ) : (
        <SpendingTrendChart
          data={trendData}
          mode={mode}
          className="animate-in fade-in duration-150"
        />
      )}
    </div>
  );
}
