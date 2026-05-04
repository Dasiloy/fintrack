'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, MonthPicker, toast } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { PageHeader } from '@/app/_components/page-header';
import type { Budget, UnbudgetedCategory } from '@fintrack/types/protos/finance/budget';
import { BudgetCategoryCard } from './budget_card';
import { BudgetCardSkeleton } from './budget_card_skeleton';
import { BudgetEmptyState } from './budget_empty_state';
import { BudgetFormDialog } from './budget_form_dialog';
import { BudgetDrawer } from './budget_drawer';
import { UnbudgetedCategoryCard } from './unbudgeted_category_card';

// ── Fake data (remove when API is ready) ─────────────────────────────────────

const FAKE_BUDGETS: Budget[] = [
  {
    id: '1',
    name: 'Monthly Groceries',
    amount: 80000,
    spent: '91200',
    description: '',
    period: 'MONTHLY',
    carryOver: false,
    alertThreshold: 0.8,
    category: { name: 'Food & Dining', slug: 'food-dining', color: '#f97316', icon: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Transport',
    amount: 40000,
    spent: '34500',
    description: '',
    period: 'MONTHLY',
    carryOver: false,
    alertThreshold: 0.8,
    category: { name: 'Transport', slug: 'transport', color: '#3b82f6', icon: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Utilities',
    amount: 25000,
    spent: '21800',
    description: '',
    period: 'MONTHLY',
    carryOver: false,
    alertThreshold: 0.8,
    category: {
      name: 'Bills & Utilities',
      slug: 'utilities',
      color: '#8b5cf6',
      icon: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Entertainment',
    amount: 30000,
    spent: '8400',
    description: '',
    period: 'MONTHLY',
    carryOver: false,
    alertThreshold: 0.8,
    category: {
      name: 'Entertainment',
      slug: 'entertainment',
      color: '#ec4899',
      icon: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Health',
    amount: 20000,
    spent: '0',
    description: '',
    period: 'MONTHLY',
    carryOver: false,
    alertThreshold: 0.75,
    category: { name: 'Health & Fitness', slug: 'health', color: '#10b981', icon: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const FAKE_UNBUDGETED: UnbudgetedCategory[] = [
  { slug: 'cat-shopping', name: 'Shopping', color: '#f59e0b', icon: '', spent: 45600 },
  { slug: 'cat-education', name: 'Education', color: '#06b6d4', icon: '', spent: 12000 },
];

interface BudgetPageClientProps {
  trendNode: React.ReactNode;
}

export function BudgetPageClient({ trendNode }: BudgetPageClientProps) {
  const [selectedMonth, setSelectedMonth] = React.useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [monthPickerOpen, setMonthPickerOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [drawerBudgetId, setDrawerBudgetId] = React.useState<string | null>(null);
  const [drawerEditMode, setDrawerEditMode] = React.useState(false);
  const [prefilledCategoryId, setPrefilledCategoryId] = React.useState<string | undefined>();

  const utils = api_client.useUtils();

  const { data, isLoading } = api_client.budget.getAll.useQuery(
    {
      month: selectedMonth.getMonth(),
      year: selectedMonth.getFullYear(),
    },
    {
      enabled: false,
    },
  );

  const budgets = data?.data?.budgets ?? [...FAKE_BUDGETS];
  const unbudgeted = data?.data?.unbudgeted ?? [...FAKE_UNBUDGETED];

  const deleteMutation = api_client.budget.delete.useMutation({
    onSuccess: () => {
      void utils.budget.getAll.invalidate();
      toast.success('Budget deleted');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSetBudget = (categoryId: string) => {
    setPrefilledCategoryId(categoryId);
    setCreateOpen(true);
  };

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) setPrefilledCategoryId(undefined);
  };

  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <PageHeader breadcrumbs={[{ label: 'Finances', href: '/finances' }, { label: 'Budgets' }]}>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
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
                <h2 className="text-text-primary text-sm font-semibold">Your Budgets</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {isLoading ? (
                    <BudgetCardSkeleton count={4} />
                  ) : budgets.length === 0 ? (
                    <BudgetEmptyState month={selectedMonth} onNew={() => setCreateOpen(true)} />
                  ) : (
                    budgets.map((budget) => (
                      <BudgetCategoryCard
                        key={budget.id}
                        budget={budget}
                        onOpen={(id, editMode) => {
                          setDrawerBudgetId(id);
                          setDrawerEditMode(!!editMode);
                        }}
                        onDelete={(id) => deleteMutation.mutate({ id })}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* ── Right: unbudgeted sidebar ── */}
            {!isLoading && unbudgeted.length > 0 && (
              <aside className="w-full lg:w-[260px] lg:shrink-0">
                <div className="glass-card rounded-card border-border-subtle border p-4">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="text-text-primary text-sm font-semibold">Unbudgeted</h2>
                    <button
                      type="button"
                      className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                    >
                      <Plus className="size-3" />
                      Add Category
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                    {unbudgeted.map((cat) => (
                      <UnbudgetedCategoryCard
                        key={cat.slug}
                        category={cat}
                        onSetBudget={handleSetBudget}
                      />
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs / drawers ── */}
      <BudgetFormDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        selectedMonth={selectedMonth}
        prefilledCategoryId={prefilledCategoryId}
      />
      <BudgetDrawer
        budgetId={drawerBudgetId}
        initialEditMode={drawerEditMode}
        onOpenChange={(open) => {
          if (!open) setDrawerBudgetId(null);
        }}
      />
    </div>
  );
}
