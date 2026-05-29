'use client';

import * as React from 'react';
import { useOnborda } from 'onborda';
import { PageHeader } from '@/app/_components/page-header';
import { api_client } from '@/lib/trpc_app/api_client';
import { DashboardHero } from './dashboard_hero';
import { StatCards } from './stat_cards';
import { MonthlyCashflowChart } from './monthly_cashflow_chart';
import { WeeklySpendingChart } from './weekly_spending_chart';
import { SpendingBreakdownCard } from './spending_breakdown_card';
import { SpendingHeatmap } from './spending_heatmap';
import { ActivityFeed } from './activity_feed';
import { TourWelcomeDialog } from '@/app/(dashboard)/_components/onboarding_tour/tour_welcome_dialog';

const TOUR_SESSION_KEY = 'ft_tour_prompt_seen';

interface DashboardClientProps {
  balanceHidden: boolean;
}

export function DashboardClient({ balanceHidden }: DashboardClientProps) {
  const { data, isLoading } = api_client.transaction.getSummary.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const { data: meData } = api_client.user.getMe.useQuery();
  const utils = api_client.useUtils();

  const summary = data?.data ?? null;
  const me = meData?.data ?? null;

  const { startOnborda, isOnbordaVisible } = useOnborda();
  const [showWelcome, setShowWelcome] = React.useState(false);

  // Mark onboarding as seen immediately when the welcome dialog fires so:
  // (a) the dialog never re-appears on subsequent logins, and
  // (b) the 2FA prompt is unblocked from the very next login.
  const { mutate: markSeen } = api_client.user.completeTour.useMutation({
    onSuccess: () => void utils.user.getMe.invalidate(),
  });

  React.useEffect(() => {
    if (me && !me.hasCompletedOnboarding && !sessionStorage.getItem(TOUR_SESSION_KEY)) {
      sessionStorage.setItem(TOUR_SESSION_KEY, '1');
      setShowWelcome(true);
      markSeen();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.hasCompletedOnboarding]);

  // Lock body scroll on tablet/desktop (≥768 px) so spotlight targets stay in
  // place. On mobile the tour card can extend off-screen, so scroll must remain
  // available for the user to reach it.
  React.useEffect(() => {
    const isTabletOrAbove = window.matchMedia('(min-width: 768px)').matches;
    if (isOnbordaVisible && isTabletOrAbove) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOnbordaVisible]);

  const handleStartTour = () => {
    setShowWelcome(false);
    startOnborda('main');
  };

  const handleSkipTour = () => {
    setShowWelcome(false);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader breadcrumbs={[{ label: 'Dashboard' }]} />

      <main className="flex flex-1 flex-col gap-4 p-6">
        {/* Hero — net balance + income/expense chips */}
        <div id="onborda-hero">
          <DashboardHero data={summary} isLoading={isLoading} initialBalanceHidden={balanceHidden} />
        </div>

        {/* Stat row — 4 metric cards */}
        <div id="onborda-stat-cards">
          <StatCards data={summary} isLoading={isLoading} />
        </div>

        {/* Row 2 — cashflow chart (2/3) + weekly bar (1/3) */}
        <div className="grid gap-4 xl:grid-cols-3 xl:items-stretch">
          <div id="onborda-cashflow" className="min-w-0 xl:col-span-2 xl:flex xl:flex-col">
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

      <TourWelcomeDialog
        open={showWelcome}
        firstName={me?.firstName ?? ''}
        onStart={handleStartTour}
        onSkip={handleSkipTour}
      />
    </div>
  );
}
