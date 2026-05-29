'use client';

import * as React from 'react';
import { OnbordaProvider, Onborda } from 'onborda';
import { SidebarInset, SidebarProvider } from '@ui/components';
import { AppSidebar } from '@/app/_components/app-sidebar';
import type { Session } from 'next-auth';
import { usePushNotifications } from '@/hooks/use_notifications';
import { useActivity } from '@/hooks/use_activity';
import { TwoFaPromptModal } from '@/app/(dashboard)/_components/two_fa_prompt_modal';
import { TourCard } from '@/app/(dashboard)/_components/onboarding_tour/tour_card';
import { TOUR_STEPS, TOUR_STEPS_MOBILE } from '@/app/(dashboard)/_components/onboarding_tour/tour_steps';

export default function DashboardLayout({
  children,
  session,
  isPro,
  sidebarDefaultOpen = true,
  showTwoFaPrompt = false,
}: React.PropsWithChildren & {
  session: Session;
  isPro: boolean;
  sidebarDefaultOpen?: boolean;
  showTwoFaPrompt?: boolean;
}) {
  usePushNotifications();
  useActivity();

  // Pick mobile steps on narrow screens — the sidebar nav items are hidden in a
  // drawer on mobile so the four sidebar-targeted steps would have no target.
  // Evaluated once after mount (window is not available during SSR).
  const [tourSteps, setTourSteps] = React.useState(TOUR_STEPS);
  React.useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) {
      setTourSteps(TOUR_STEPS_MOBILE);
    }
  }, []);

  return (
    <OnbordaProvider>
      <Onborda
        steps={tourSteps}
        cardComponent={TourCard}
        shadowRgb="12,12,17"
        shadowOpacity="0.85"
        cardTransition={{ duration: 0.3, type: 'tween' }}
      >
        <SidebarProvider defaultOpen={sidebarDefaultOpen}>
          <AppSidebar session={session} isPro={isPro} />
          <SidebarInset className="bg-bg-deep flex flex-col">{children}</SidebarInset>
          <TwoFaPromptModal initialOpen={showTwoFaPrompt} />
        </SidebarProvider>
      </Onborda>
    </OnbordaProvider>
  );
}
