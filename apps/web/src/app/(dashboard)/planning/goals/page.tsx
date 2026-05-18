'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { PageHeader } from '@/app/_components/page-header';
import { ProGateModal } from '@/app/_components/pro_gate_modal';
import { useProGate } from '@/hooks/use_pro_gate';
import { GoalCard } from './_components/goal_card';
import { GoalCardSkeleton } from './_components/goal_card_skeleton';
import { GoalEmptyState } from './_components/goal_empty_state';
import { GoalFormDialog } from './_components/goal_form_dialog';
import { GoalDrawer } from './_components/goal_drawer';
import { GoalHealthPanel } from './_components/goal_health_panel';
import { GoalProjectionChart } from './_components/goal_projection_chart';

export default function GoalsPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const createGate = useProGate(Usage.MAX_GOALS);
  const [drawerGoalId, setDrawerGoalId] = React.useState<string | null>(null);
  const [drawerEditMode, setDrawerEditMode] = React.useState(false);
  const [drawerAddFunds, setDrawerAddFunds] = React.useState(false);

  const { data: goalsData, isLoading: goalsLoading } = api_client.goal.getAll.useQuery(
    undefined,
    { staleTime: 2 * 60 * 1000 },
  );

  const { data: aggregateData, isLoading: aggregateLoading } = api_client.goal.getAggregate.useQuery(
    undefined,
    { staleTime: 2 * 60 * 1000 },
  );

  const goals = goalsData?.data ?? [];
  const aggregate = aggregateData?.data;

  const handleOpen = (id: string) => {
    setDrawerEditMode(false);
    setDrawerGoalId(id);
  };

  const handleEdit = (id: string) => {
    setDrawerEditMode(true);
    setDrawerGoalId(id);
  };

  const handleAddFunds = (id: string) => {
    setDrawerEditMode(false);
    setDrawerAddFunds(true);
    setDrawerGoalId(id);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) {
      setDrawerGoalId(null);
      setDrawerEditMode(false);
      setDrawerAddFunds(false);
    }
  };

  return (
    <div className="flex flex-col">
      <PageHeader breadcrumbs={[{ label: 'Planning' }, { label: 'Goals' }]}>
        <Button size="sm" onClick={() => createGate.triggerGate(() => setCreateOpen(true))}>
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Create New Goal</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6">
        {/* Health + Projection row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr] lg:items-stretch">
          <GoalHealthPanel aggregate={aggregate ?? undefined} isLoading={aggregateLoading} />
          <GoalProjectionChart
            data={aggregate?.projectionData ?? []}
            isLoading={aggregateLoading}
          />
        </div>

        {/* Goal cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {goalsLoading ? (
            <GoalCardSkeleton count={4} />
          ) : goals.length === 0 ? (
            <GoalEmptyState onNew={() => createGate.triggerGate(() => setCreateOpen(true))} />
          ) : (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onOpen={handleOpen}
                onEdit={handleEdit}
                onAddFunds={handleAddFunds}
              />
            ))
          )}
        </div>
      </div>

      <GoalFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ProGateModal feature={Usage.MAX_GOALS} open={createGate.open} onClose={createGate.onClose} />

      <GoalDrawer
        goalId={drawerGoalId}
        onOpenChange={handleDrawerOpenChange}
        initialEditMode={drawerEditMode}
        initialAddFundsOpen={drawerAddFunds}
      />
    </div>
  );
}
