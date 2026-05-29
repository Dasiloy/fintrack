'use client';

import { Map, RotateCcw } from 'lucide-react';
import { Button, toast } from '@ui/components';
import { useRouter } from 'next/navigation';
import { api_client } from '@/lib/trpc_app/api_client';
import { ProfileSection } from '@/app/(dashboard)/settings/account/_components/profile_section';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';

const TOUR_SESSION_KEY = 'ft_tour_prompt_seen';

export function OnboardingSection() {
  const router = useRouter();
  const utils = api_client.useUtils();

  const { data: meData } = api_client.user.getMe.useQuery();
  const hasCompleted = meData?.data?.hasCompletedOnboarding ?? false;

  const { mutate: resetTour, isPending } = api_client.user.resetTour.useMutation({
    onSuccess: async () => {
      await utils.user.getMe.invalidate();
      sessionStorage.removeItem(TOUR_SESSION_KEY);
      router.push(DASHBOARD_ROUTES.DASHBOARD);
    },
    onError: () => {
      toast.error('Failed to reset tour. Please try again.');
    },
  });

  if (!hasCompleted) return null;

  return (
    <ProfileSection
      title="Help & Onboarding"
      description="Replay the guided onboarding tour at any time"
      Icon={<Map className="text-primary size-5" />}
      showSave={false}
    >
      <div className="bg-bg-surface flex items-center justify-between gap-4 rounded-xl p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-text-primary text-body font-medium">Replay onboarding tour</p>
          <p className="text-text-tertiary text-body-sm">
            Walk through the key features of FinTrack again — takes about 60 seconds.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          loading={isPending}
          onClick={() => resetTour()}
        >
          <RotateCcw className="size-3.5" />
          Replay tour
        </Button>
      </div>
    </ProfileSection>
  );
}
