'use client';

import { PageHeader } from '@/app/_components/page-header';
import { api_client } from '@/lib/trpc_app/api_client';
import { DashboardHero } from './dashboard_hero';
import { StatCards } from './stat_cards';
import { MonthlyCashflowChart } from './monthly_cashflow_chart';
import { WeeklySpendingChart } from './weekly_spending_chart';
import { SpendingBreakdownCard } from './spending_breakdown_card';
import { SpendingHeatmap } from './spending_heatmap';
import { ActivityFeed } from './activity_feed';

interface DashboardClientProps {
  balanceHidden: boolean;
}

export function DashboardClient({ balanceHidden }: DashboardClientProps) {
  const { data, isLoading } = api_client.transaction.getSummary.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const summary = data?.data ?? null;

  return (
    <div className="flex h-full flex-col">
      <PageHeader breadcrumbs={[{ label: 'Dashboard' }]} />

      <main className="flex flex-1 flex-col gap-4 p-6">
        {/* Hero — net balance + month chips */}
        <DashboardHero data={summary} isLoading={isLoading} initialBalanceHidden={balanceHidden} />

        {/* Stat row — 4 metric cards */}
        <StatCards data={summary} isLoading={isLoading} />

        {/* Row 2 — cashflow chart (2/3) + weekly bar (1/3) */}
        <div className="grid gap-4 xl:grid-cols-3 xl:items-stretch">
          <div className="min-w-0 xl:col-span-2 xl:flex xl:flex-col">
            <MonthlyCashflowChart data={summary} isLoading={isLoading} />
          </div>
          <div className="min-w-0 xl:flex xl:flex-col">
            <WeeklySpendingChart data={summary} isLoading={isLoading} />
          </div>
        </div>

        {/* Row 3 — heatmap + breakdown + activity (equal thirds, stretch height) */}
        <div className="grid gap-4 xl:grid-cols-3">
          <SpendingHeatmap data={summary} isLoading={isLoading} />
          <SpendingBreakdownCard />
          <div className="glass-card rounded-card flex flex-col p-5">
            <div className="shrink-0">
              <h2 className="text-text-primary mb-0.5 text-[13px] font-semibold">
                Recent Activity
              </h2>
              <p className="text-text-tertiary mb-4 text-[11px]">
                Your actions across all features
              </p>
            </div>
            <div className="no-scrollbar max-h-[392px] overflow-y-auto">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
