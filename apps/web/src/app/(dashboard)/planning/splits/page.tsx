'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { PageHeader } from '@/app/_components/page-header';
import { ProGateModal } from '@/app/_components/pro_gate_modal';
import { UsageBanner } from '@/app/_components/usage_banner';
import { useProGate } from '@/hooks/use_pro_gate';
import { usePlan } from '@/app/providers/plan_usage_provider';
import { SplitCard } from './_components/split_card';
import { SplitCardSkeleton } from './_components/split_card_skeleton';
import { SplitEmptyState } from './_components/split_empty_state';
import { SplitFormDialog } from './_components/split_form_dialog';
import { SplitDrawer } from './_components/split_drawer';
import { SplitAggregatePanel } from './_components/split_aggregate_panel';

export default function SplitsPage() {
  const plan = usePlan();
  const [createOpen, setCreateOpen] = React.useState(false);
  const createGate = useProGate(Usage.MAX_ACTIVE_SPLITS);
  const [drawerSplitId, setDrawerSplitId] = React.useState<string | null>(null);
  const [drawerEditMode, setDrawerEditMode] = React.useState(false);

  const { data: splitsData, isLoading: splitsLoading } = api_client.split.getAll.useQuery(
    undefined,
    { staleTime: 2 * 60 * 1000 },
  );

  const { data: aggregateData, isLoading: aggregateLoading } =
    api_client.split.getAggregate.useQuery(undefined, { staleTime: 2 * 60 * 1000 });

  const splits = splitsData?.data ?? [];
  const aggregate = aggregateData?.data ?? undefined;

  const handleOpen = (id: string) => {
    setDrawerEditMode(false);
    setDrawerSplitId(id);
  };

  const handleEdit = (id: string) => {
    setDrawerEditMode(true);
    setDrawerSplitId(id);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) {
      setDrawerSplitId(null);
      setDrawerEditMode(false);
    }
  };

  return (
    <div className="flex flex-col">
      <PageHeader breadcrumbs={[{ label: 'Planning' }, { label: 'Split Bills' }]}>
        <Button size="sm" onClick={() => createGate.triggerGate(() => setCreateOpen(true))}>
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Split</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6">
        {/* Aggregate panel + cards layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
          {/* Aggregate panel */}
          <SplitAggregatePanel aggregate={aggregate} isLoading={aggregateLoading} />

          {/* Cards grid */}
          <div className="flex flex-col gap-4">
            <UsageBanner
              used={plan?.resourceCounts.splits ?? 0}
              limit={(plan?.limits?.[Usage.MAX_ACTIVE_SPLITS] ?? 3) as number}
              variant="slot"
              label="active splits"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {splitsLoading ? (
              <SplitCardSkeleton count={3} />
            ) : splits.length === 0 ? (
              <SplitEmptyState onNew={() => createGate.triggerGate(() => setCreateOpen(true))} />
            ) : (
              splits.map((split) => (
                <SplitCard
                  key={split.id}
                  split={split}
                  onOpen={handleOpen}
                  onEdit={handleEdit}
                />
              ))
            )}
            </div>
          </div>
        </div>
      </div>

      <SplitFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ProGateModal
        feature={Usage.MAX_ACTIVE_SPLITS}
        open={createGate.open}
        onClose={createGate.onClose}
      />

      <SplitDrawer
        splitId={drawerSplitId}
        onOpenChange={handleDrawerOpenChange}
        initialEditMode={drawerEditMode}
      />
    </div>
  );
}
