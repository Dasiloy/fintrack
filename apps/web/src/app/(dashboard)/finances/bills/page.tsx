'use client';

import * as React from 'react';
import { CirclePlay, Plus, PauseCircle, Repeat2, TrendingDown } from 'lucide-react';
import { Button, toast } from '@ui/components';
import { formatCurrency } from '@fintrack/utils/format';
import { api_client } from '@/lib/trpc_app/api_client';
import { PageHeader } from '@/app/_components/page-header';
import type { Recurinrg } from '@fintrack/types/protos/finance/recurring';

import type { BillFilters } from './types';
import { EMPTY_FILTERS } from './helpers';
import { BillCard } from './_components/bill_card';
import { BillCardSkeleton } from './_components/bill_card_skeleton';
import { BillDrawer } from './_components/bill_drawer';
import { BillFilters as BillFiltersPanel } from './_components/bill_filters';
import { BillFormDialog } from './_components/bill_form_dialog';
import { MetricCard } from './_components/metric_card';

export default function BillsPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [filters, setFilters] = React.useState<BillFilters>(EMPTY_FILTERS);
  const [addOpen, setAddOpen] = React.useState(false);
  const [drawerItemId, setDrawerItemId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerEditMode, setDrawerEditMode] = React.useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: categoryData } = api_client.category.getAll.useQuery();
  const categories = categoryData?.data ?? [];

  const queryInput = React.useMemo(
    () => ({
      isActive: filters.status === 'all' ? undefined : filters.status === 'active',
      sortBy: filters.sortBy,
      type: filters.type.length ? filters.type : undefined,
      frequency: filters.frequency.length ? filters.frequency : undefined,
    }),
    [filters],
  );

  const { data, isLoading } = api_client.recurring.getAll.useQuery(queryInput, {
    staleTime: 2 * 60 * 1000,
  });
  const items = data?.data ?? [];

  const { data: summaryData, isLoading: summaryLoading } = api_client.recurring.getSummary.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 },
  );
  const summary = summaryData?.data;
  const activeCount = summary?.activeCount ?? 0;
  const pausedCount = summary?.pausedCount ?? 0;
  const monthlyTotal = summary?.monthlyExpense ?? 0;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const utils = api_client.useUtils();

  const invalidateAll = React.useCallback(() => {
    void utils.recurring.getAll.invalidate();
    void utils.recurring.getSummary.invalidate();
  }, [utils]);

  const toggleMutation = api_client.recurring.toggle.useMutation({
    onSuccess: (data) => {
      invalidateAll();
      toast.success(data.data?.isActive ? 'Resumed' : 'Paused');
    },
    onError: () => toast.error('Failed to update status. Please try again.'),
  });

  const deleteMutation = api_client.recurring.delete.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success('Recurring item deleted');
    },
    onError: () => toast.error('Failed to delete. Please try again.'),
  });

  // ── Card callbacks ────────────────────────────────────────────────────────
  const handleView = React.useCallback((item: Recurinrg) => {
    setDrawerEditMode(false);
    setDrawerItemId(item.id);
    setDrawerOpen(true);
  }, []);

  const handleEdit = React.useCallback((item: Recurinrg) => {
    setDrawerEditMode(true);
    setDrawerItemId(item.id);
    setDrawerOpen(true);
  }, []);

  const handleToggle = React.useCallback(
    (item: Recurinrg) => toggleMutation.mutate({ id: item.id }),
    [toggleMutation],
  );

  const handleDelete = React.useCallback(
    (item: Recurinrg) => deleteMutation.mutate({ id: item.id }),
    [deleteMutation],
  );

  const hasActiveFilters =
    filters.status !== 'all' || filters.type.length > 0 || filters.frequency.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Page header ── */}
      <PageHeader breadcrumbs={[{ label: 'Bills & Recurring' }]}>
        <Button size="sm" className="gap-1.5 px-2.5 sm:px-3" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Add Bill</span>
        </Button>
      </PageHeader>

      {/* ── Title + metric cards ── */}
      <div className="flex shrink-0 flex-col gap-4 px-6 pt-6 pb-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-text-primary text-[22px] leading-7 font-semibold tracking-tight">
            Bills & Recurring
          </h1>
          <BillFiltersPanel filters={filters} onChange={setFilters} />
        </div>

        {/* Metric cards — stacked on mobile, 3-col on sm+ */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <MetricCard
            label="Active"
            value={activeCount}
            format={(n) => String(n)}
            icon={CirclePlay}
            accentColor="var(--color-success)"
            isLoading={summaryLoading}
            delay={0}
          />
          <MetricCard
            label="Paused"
            value={pausedCount}
            format={(n) => String(n)}
            icon={PauseCircle}
            accentColor="var(--color-warning)"
            isLoading={summaryLoading}
            delay={80}
          />
          <MetricCard
            label="Monthly"
            value={monthlyTotal}
            format={(n) => formatCurrency(n)}
            icon={TrendingDown}
            accentColor="var(--color-primary)"
            isLoading={summaryLoading}
            delay={160}
          />
        </div>
      </div>

      {/* ── Bill cards grid ── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <BillCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:min-h-[400px] sm:pt-16">
            <div className="border-border-subtle bg-bg-surface flex size-14 items-center justify-center rounded-2xl border">
              <Repeat2 className="text-text-disabled size-6" />
            </div>
            <div className="text-center">
              <p className="text-text-primary text-[14px] font-medium">No bills found</p>
              <p className="text-text-tertiary mt-1 text-[13px]">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Add your first recurring bill or subscription'}
              </p>
            </div>
            {!hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="size-3.5" />
                Add Bill
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <BillCard
                key={item.id}
                item={item}
                onView={handleView}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending && deleteMutation.variables?.id === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create dialog ── */}
      <BillFormDialog open={addOpen} onOpenChange={setAddOpen} categories={categories} />

      {/* ── Detail drawer ── */}
      <BillDrawer
        billId={drawerItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        categories={categories}
        initialEditMode={drawerEditMode}
      />
    </div>
  );
}
