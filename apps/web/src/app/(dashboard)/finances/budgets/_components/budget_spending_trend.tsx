'use client';

import * as React from 'react';
import { api_client } from '@/lib/trpc_app/api_client';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { GetSpendingTrendRes } from '@fintrack/types/protos/finance/budget';
import {
  type SpendingTrendMode,
  type TrendWindow,
} from '@/app/(dashboard)/finances/budgets/types';
import { SpendingTrendChart } from './spending_trend_chart';
import { SpendingTrendChartSkeleton } from './spending_trend_skeletoon';
import { SpendingTrendHeader } from './spending_trend_header';

// ─── constants ────────────────────────────────────────────────────────────────

interface BudgetSpendingTrendProps {
  defaultMonths?: TrendWindow;
  initialData?: StandardResponse<GetSpendingTrendRes>;
}

export function BudgetSpendingTrend({ defaultMonths = 6, initialData }: BudgetSpendingTrendProps) {
  const [mounted, setMounted] = React.useState(false);
  const [months, setMonths] = React.useState<TrendWindow>(defaultMonths);
  const [mode, setMode] = React.useState<SpendingTrendMode>('total');

  React.useEffect(() => setMounted(true), []);

  const { data, isLoading } = api_client.budget.getSpendingTrend.useQuery(
    { months },
    {
      // Only hydrate from SSR data on the initial window — other windows have no prefetched cache.
      initialData: months === defaultMonths ? (initialData ?? undefined) : undefined,
      initialDataUpdatedAt: months === defaultMonths && initialData ? Date.now() : undefined,
      staleTime: 15 * 60 * 1000,
      enabled: false,
    },
  );

  const trendData = data?.data?.data ?? [
    {
      label: 'Jan 2026',
      total: 420000,
      byCategory: [
        { slug: 'food', name: 'Food', color: '#FF6384', amount: 120000 },
        { slug: 'transport', name: 'Transport', color: '#36A2EB', amount: 80000 },
        { slug: 'rent', name: 'Rent', color: '#FFCE56', amount: 150000 },
        { slug: 'entertainment', name: 'Entertainment', color: '#4BC0C0', amount: 40000 },
        { slug: 'utilities', name: 'Utilities', color: '#9966FF', amount: 30000 },
      ],
    },
    {
      label: 'Feb 2026',
      total: 390000,
      byCategory: [
        { slug: 'food', name: 'Food', color: '#FF6384', amount: 110000 },
        { slug: 'transport', name: 'Transport', color: '#36A2EB', amount: 70000 },
        { slug: 'rent', name: 'Rent', color: '#FFCE56', amount: 150000 },
        { slug: 'entertainment', name: 'Entertainment', color: '#4BC0C0', amount: 30000 },
        { slug: 'utilities', name: 'Utilities', color: '#9966FF', amount: 30000 },
      ],
    },
    {
      label: 'Mar 2026',
      total: 450000,
      byCategory: [
        { slug: 'food', name: 'Food', color: '#FF6384', amount: 130000 },
        { slug: 'transport', name: 'Transport', color: '#36A2EB', amount: 85000 },
        { slug: 'rent', name: 'Rent', color: '#FFCE56', amount: 150000 },
        { slug: 'entertainment', name: 'Entertainment', color: '#4BC0C0', amount: 50000 },
        { slug: 'utilities', name: 'Utilities', color: '#9966FF', amount: 35000 },
      ],
    },
    {
      label: 'Apr 2026',
      total: 410000,
      byCategory: [
        { slug: 'food', name: 'Food', color: '#FF6384', amount: 115000 },
        { slug: 'transport', name: 'Transport', color: '#36A2EB', amount: 75000 },
        { slug: 'rent', name: 'Rent', color: '#FFCE56', amount: 150000 },
        { slug: 'entertainment', name: 'Entertainment', color: '#4BC0C0', amount: 40000 },
        { slug: 'utilities', name: 'Utilities', color: '#9966FF', amount: 30000 },
      ],
    },
    {
      label: 'May 2026',
      total: 470000,
      byCategory: [
        { slug: 'food', name: 'Food', color: '#FF6384', amount: 140000 },
        { slug: 'transport', name: 'Transport', color: '#36A2EB', amount: 90000 },
        { slug: 'rent', name: 'Rent', color: '#FFCE56', amount: 150000 },
        { slug: 'entertainment', name: 'Entertainment', color: '#4BC0C0', amount: 55000 },
        { slug: 'utilities', name: 'Utilities', color: '#9966FF', amount: 35000 },
      ],
    },
  ];

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
        <SpendingTrendChart data={trendData} mode={mode} className="animate-in fade-in duration-150" />
      )}
    </div>
  );
}
