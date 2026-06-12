'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@bprogress/next';
import { Button, toast } from '@ui/components';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import { ServerFormatter } from '@fintrack/utils/server';

import { api_client } from '@/lib/trpc_app/api_client';
import { useRegionCheck } from '@/hooks/use_region_check';
import { RegionGateModal } from '@/app/_components/region_gate_modal';
import { TRIAL_PROMPT_SEEN_KEY } from '@/constants/trial.constants';

export function TrialActions() {
  const router = useRouter();
  const { checkRegion, isPending: isCheckingRegion } = useRegionCheck();
  const [regionGateOpen, setRegionGateOpen] = useState(false);

  const { data: usage } = api_client.subscription.getGatedUsage.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    localStorage.setItem(TRIAL_PROMPT_SEEN_KEY, 'true');
  }, []);

  // Redirect ineligible users without flashing the page content
  useEffect(() => {
    if (usage && (usage.trialUsed || usage.plan === 'PRO')) {
      router.replace(DASHBOARD_ROUTES.DASHBOARD);
    }
  }, [usage, router]);

  const startTrial = api_client.subscription.startTrial.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        router.push(data.data!.checkoutSessionUrl!);
      }
    },
    onError: (error) => {
      toast.error('Could not start your trial', {
        description: ServerFormatter.formatError(error),
      });
    },
  });

  const handleStartTrial = async () => {
    const { isNigeria } = await checkRegion();
    if (!isNigeria) {
      setRegionGateOpen(true);
      return;
    }
    startTrial.mutate();
  };

  const isLoading = startTrial.isPending || isCheckingRegion;

  return (
    <>
      <div className="gap-space-3 flex flex-col">
        <Button type="button" loading={isLoading} disabled={isLoading} onClick={handleStartTrial}>
          Start my free trial
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isLoading}
          onClick={() => router.push(DASHBOARD_ROUTES.DASHBOARD)}
        >
          Skip for now
        </Button>
      </div>

      <RegionGateModal open={regionGateOpen} onClose={() => setRegionGateOpen(false)} />
    </>
  );
}
