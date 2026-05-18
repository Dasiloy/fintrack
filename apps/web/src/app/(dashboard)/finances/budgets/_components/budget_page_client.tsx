'use client';

import * as React from 'react';
import { Archive, Plus } from 'lucide-react';
import { Button, MonthPicker, toast } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { PageHeader } from '@/app/_components/page-header';
import { ProGateModal } from '@/app/_components/pro_gate_modal';
import { useProGate } from '@/hooks/use_pro_gate';
import { BudgetCategoryCard } from './budget_card';
import { BudgetCardSkeleton } from './budget_card_skeleton';
import { BudgetEmptyState } from './budget_empty_state';
import { BudgetFormDialog } from './budget_form_dialog';
import { BudgetDrawer } from './budget_drawer';
import { UnbudgetedCategoryCard } from './unbudgeted_category_card';
import { UnbudgetedCategoryCardSkeletons } from './unbudgeted_category_card_skeleton';
import { CreateCategoryDialog } from './create_category_dialog';
import { ArchivedBudgetsSheet } from './archived_budgets_sheet';

interface BudgetPageClientProps {
  trendNode: React.ReactNode;
}

export function BudgetPageClient({ trendNode }: BudgetPageClientProps) {
  const createGate = useProGate(Usage.MAX_BUDGETS);
  const [selectedMonth, setSelectedMonth] = React.useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [monthPickerOpen, setMonthPickerOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [drawerBudgetId, setDrawerBudgetId] = React.useState<string | null>(null);
  const [drawerEditMode, setDrawerEditMode] = React.useState(false);
  const [prefilledCategoryId, setPrefilledCategoryId] = React.useState<string | undefined>();
  const [createCategoryOpen, setCreateCategoryOpen] = React.useState(false);
  const [archivedOpen, setArchivedOpen] = React.useState(false);

  const utils = api_client.useUtils();

  const { data, isLoading } = api_client.budget.getAll.useQuery({
    month: selectedMonth.getMonth(),
    year: selectedMonth.getFullYear(),
  });

  const budgets = data?.data?.budgets ?? [];
  const unbudgeted = data?.data?.unbudgeted ?? [];

  const deleteMutation = api_client.budget.delete.useMutation({
    onSuccess: () => {
      void utils.budget.getAll.invalidate();
      toast.success('Budget deactivated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSetBudget = (categoryId: string) => {
    createGate.triggerGate(() => {
      setPrefilledCategoryId(categoryId);
      setCreateOpen(true);
    });
  };

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) setPrefilledCategoryId(undefined);
  };

  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <PageHeader breadcrumbs={[{ label: 'Finances', href: '/finances' }, { label: 'Budgets' }]}>
        <Button size="sm" onClick={() => createGate.triggerGate(() => setCreateOpen(true))}>
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Budget</span>
        </Button>
      </PageHeader>

      {/* ── Scrollable body ── */}
      <div className="px-4 py-6 sm:px-6">
        <div className="space-y-5">
          {/* ── Title + month picker ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-text-primary text-[22px] leading-7 font-semibold tracking-tight">
              Budgets
            </h1>
            <MonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              open={monthPickerOpen}
              onOpenChange={setMonthPickerOpen}
            />
          </div>

          {/* ── Two-column layout (lg+) ── */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
            {/* ── Left: trend + budgets ── */}
            <div className="min-w-0 flex-1 space-y-5">
              {/* Spending trend */}
              <div className="glass-card rounded-card border-border-subtle w-full min-w-0 overflow-hidden border p-4 sm:p-5">
                {trendNode}
              </div>

              {/* Budget cards */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-text-primary text-sm font-semibold">Your Budgets</h2>
                  <button
                    type="button"
                    onClick={() => setArchivedOpen(true)}
                    className="text-text-tertiary hover:text-text-secondary flex cursor-pointer items-center gap-1 text-[11px] transition-colors"
                  >
                    <Archive className="size-3" />
                    Archived
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {isLoading ? (
                    <BudgetCardSkeleton count={4} />
                  ) : budgets.length === 0 ? (
                    <BudgetEmptyState month={selectedMonth} onNew={() => createGate.triggerGate(() => setCreateOpen(true))} />
                  ) : (
                    budgets.map((budget) => (
                      <BudgetCategoryCard
                        key={budget.id}
                        budget={budget}
                        onOpen={(id, editMode) => {
                          setDrawerBudgetId(id);
                          setDrawerEditMode(!!editMode);
                        }}
                        onDelete={(id) => deleteMutation.mutateAsync({ id })}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* ── Right: unbudgeted sidebar ── */}
            <aside className="w-full lg:w-[260px] lg:shrink-0">
              <div className="glass-card rounded-card border-border-subtle border p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-text-primary text-sm font-semibold">Unbudgeted</h2>
                  {!isLoading && (
                    <button
                      type="button"
                      onClick={() => setCreateCategoryOpen(true)}
                      className="bg-primary/10 text-primary hover:bg-primary/20 flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                    >
                      <Plus className="size-3" />
                      Add Category
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                    <UnbudgetedCategoryCardSkeletons count={3} />
                  </div>
                ) : unbudgeted.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="bg-bg-muted flex size-10 items-center justify-center rounded-full">
                      <Plus className="text-text-disabled size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-text-secondary text-[13px] font-medium">All caught up</p>
                      <p className="text-text-disabled text-[11px] leading-snug">
                        Every category with spend this month has a budget.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateCategoryOpen(true)}
                      className="text-primary hover:text-primary/80 cursor-pointer text-[11px] font-medium underline-offset-2 transition-colors hover:underline"
                    >
                      Create a new category
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                    {unbudgeted.map((cat) => (
                      <UnbudgetedCategoryCard
                        key={cat.slug}
                        category={cat}
                        onSetBudget={handleSetBudget}
                      />
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ── Dialogs / drawers ── */}
      <ProGateModal feature={Usage.MAX_BUDGETS} open={createGate.open} onClose={createGate.onClose} />
      <ArchivedBudgetsSheet open={archivedOpen} onOpenChange={setArchivedOpen} />
      <CreateCategoryDialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen} />
      <BudgetFormDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        selectedMonth={selectedMonth}
        prefilledCategoryId={prefilledCategoryId}
      />
      <BudgetDrawer
        budgetId={drawerBudgetId}
        initialEditMode={drawerEditMode}
        selectedMonth={selectedMonth}
        onOpenChange={(open) => {
          if (!open) setDrawerBudgetId(null);
        }}
      />
    </div>
  );
}
