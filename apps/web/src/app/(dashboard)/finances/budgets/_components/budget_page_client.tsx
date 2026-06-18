'use client';

import * as React from 'react';
import { Archive, Plus } from 'lucide-react';
import { Button, MonthPicker, toast } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { PageHeader } from '@/app/_components/page-header';
import { ProGateModal } from '@/app/_components/pro_gate_modal';
import { UsageBanner } from '@/app/_components/usage_banner';
import { usePlan } from '@/app/providers/plan_usage_provider';
import { useProGate } from '@/hooks/use_pro_gate';
import { BudgetCategoryCard } from './budget_card';
import { BudgetCardSkeleton } from './budget_card_skeleton';
import { BudgetEmptyState } from './budget_empty_state';
import { BudgetFormDialog } from './budget_form_dialog';
import { BudgetDrawer } from './budget_drawer';
import { UnbudgetedCard } from './unbudgeted_card';
import { UnbudgetedCategoryCardSkeletons } from './unbudgeted_category_card_skeleton';
import { CategoryDialog } from './create_category_dialog';
import { ArchivedBudgetsSheet } from './archived_budgets_sheet';
import type { UnbudgetedCategory } from '@fintrack/types/protos/finance/budget';
import { BudgetSpendingTrend } from '@/app/(dashboard)/finances/budgets/_components/budget_spending_trend';

export function BudgetPageClient() {
  const plan = usePlan();
  const createGate = useProGate(Usage.MAX_BUDGETS);
  const [selectedMonth, setSelectedMonth] = React.useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [monthPickerOpen, setMonthPickerOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [drawerBudgetId, setDrawerBudgetId] = React.useState<string | null>(null);
  const [drawerEditMode, setDrawerEditMode] = React.useState(false);
  const [prefilledCategoryId, setPrefilledCategoryId] = React.useState<string | undefined>();
  // Single dialog state: null = closed, {} = create mode, { id, name, color } = edit mode
  const [categoryDialog, setCategoryDialog] = React.useState<{
    editCategory?: { slug: string; name: string; color: string };
  } | null>(null);
  const [archivedOpen, setArchivedOpen] = React.useState(false);

  const utils = api_client.useUtils();

  const { data, isLoading } = api_client.budget.getAll.useQuery({
    month: selectedMonth.getMonth(),
    year: selectedMonth.getFullYear(),
  });

  const budgets = data?.data?.budgets ?? [];
  const unbudgeted = data?.data?.unbudgeted ?? [];

  const deleteBudgetMutation = api_client.budget.delete.useMutation({
    onSuccess: () => {
      void utils.budget.getAll.invalidate();
      void utils.subscription.getGatedUsage.invalidate();
      toast.success('Budget deactivated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteCategoryMutation = api_client.category.delete.useMutation({
    onSuccess: () => {
      void utils.budget.getAll.invalidate();
      void utils.category.getAll.invalidate();
      void utils.subscription.getGatedUsage.invalidate();
      toast.success('Category deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete category', { description: error.message });
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

  const onDeletCategory = async (c: UnbudgetedCategory, switchCatSlug?: string) => {
    await deleteCategoryMutation.mutateAsync({ slug: c.slug, switchCatSlug });
  };

  const onEditCategory = (c: UnbudgetedCategory) =>
    setCategoryDialog({
      editCategory: { slug: c.slug, name: c.name, color: c.color },
    });

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
                <BudgetSpendingTrend defaultMonths={6} />
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
                <UsageBanner
                  used={plan?.resourceCounts.budgets ?? 0}
                  limit={(plan?.limits?.[Usage.MAX_BUDGETS] ?? 5) as number}
                  variant="slot"
                  label="budgets"
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {isLoading ? (
                    <BudgetCardSkeleton count={4} />
                  ) : budgets.length === 0 ? (
                    <BudgetEmptyState
                      month={selectedMonth}
                      onNew={() => createGate.triggerGate(() => setCreateOpen(true))}
                    />
                  ) : (
                    budgets.map((budget) => (
                      <BudgetCategoryCard
                        key={budget.id}
                        budget={budget}
                        onOpen={(id, editMode) => {
                          setDrawerBudgetId(id);
                          setDrawerEditMode(!!editMode);
                        }}
                        onDelete={(id) => deleteBudgetMutation.mutateAsync({ id })}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* ── Right: unbudgeted sidebar ── */}
            <aside className="w-full lg:top-4 lg:w-[260px] lg:shrink-0">
              <div className="glass-card rounded-card border-border-subtle ft-scrollbar flex-col overflow-y-scroll border p-4 lg:h-[calc(100vh-150px)]">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-text-primary text-sm font-semibold">Unbudgeted</h2>
                  {!isLoading && (
                    <button
                      type="button"
                      onClick={() => setCategoryDialog({})}
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
                      onClick={() => setCategoryDialog({})}
                      className="text-primary hover:text-primary/80 cursor-pointer text-[11px] font-medium underline-offset-2 transition-colors hover:underline"
                    >
                      Create a new category
                    </button>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 pr-0.5">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                      {unbudgeted.map((cat) => {
                        return (
                          <UnbudgetedCard
                            key={cat.slug}
                            category={cat}
                            onSetBudget={handleSetBudget}
                            deleteCategory={onDeletCategory}
                            editCategory={onEditCategory}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ── Dialogs / drawers ── */}
      <ProGateModal
        feature={Usage.MAX_BUDGETS}
        open={createGate.open}
        onClose={createGate.onClose}
      />
      <ArchivedBudgetsSheet open={archivedOpen} onOpenChange={setArchivedOpen} />
      <CategoryDialog
        open={categoryDialog !== null}
        onOpenChange={(open) => {
          if (!open) setCategoryDialog(null);
        }}
        editCategory={categoryDialog?.editCategory}
      />
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
