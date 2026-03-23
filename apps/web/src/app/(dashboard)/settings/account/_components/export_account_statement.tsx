'use client';

import Image from 'next/image';
import { Button, toast } from '@ui/components';
import { Download, File } from 'lucide-react';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { useCanUseFeature } from '@/app/providers/plan_usage_provider';
import { ProfileSection } from '@/app/(dashboard)/settings/account/_components/profile_section';
import { api_client } from '@/lib/trpc_app/api_client';

export function ExportAccountStatement() {
  const canUseFeature = useCanUseFeature(Usage.MAX_BUDGETS);

  const createBudget = api_client.budget.createBudget.useMutation({
    onSuccess: () => {
      toast.success('Budget created successfully');
    },
    onError: () => {
      toast.error('Failed to create budget');
    },
  });

  return (
    <ProfileSection
      title="Data & Privacy"
      showSave={false}
      description="Export your account statement"
      Icon={<Image width={20} height={20} alt="Export Account Statement" src="/shield.svg" />}
    >
      <div className="bg-bg-surface rounded-xl p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-text-primary text-body font-medium">Export Account Statement</p>
          <p className="text-text-tertiary text-body-sm font-normal">
            Download all your transaction and budget history
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="default"
            variant={'outline'}
            disabled={!canUseFeature}
            onClick={() => createBudget.mutate({ feature: Usage.MAX_BUDGETS })}
          >
            <Download /> CSV
          </Button>
          <Button size="default" variant={'outline'} disabled={!canUseFeature}>
            <File /> PDF
          </Button>
        </div>
      </div>
    </ProfileSection>
  );
}
