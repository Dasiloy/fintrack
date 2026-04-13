'use client';

import * as React from 'react';
import { format } from '@fintrack/utils/date';
import {
  CalendarDays,
  Download,
  Edit2,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  Button,
  Calendar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { PageHeader } from '@/app/_components/page-header';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import { TransactionDrawer } from './_components/transaction_drawer';
import { TransactionFormDialog } from './_components/transaction_form_dialog';
import {
  TransactionFilters,
  EMPTY_FILTERS,
  activeFilterCount,
  type FilterState,
} from './_components/transaction_filters';
import type { CategoryTab } from '@/app/(dashboard)/finances/transactions/types';
import { groupTransactionsByDate } from '@/app/(dashboard)/finances/transactions/helpers';
import {
  StyledTable,
  StyledTableBody,
  StyledTableGroup,
  StyledTableHeader,
  type ColumnDef,
} from '@/app/_components/styledTable';
import { capitalize, formatCurrency } from '@fintrack/utils/format';

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = React.useState<CategoryTab>({
    kind: 'all',
    label: 'All Transactions',
  });
  const [drawerTxId, setDrawerTxId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editTx, setEditTx] = React.useState<Transaction | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS);
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({});
  const [draftDateRange, setDraftDateRange] = React.useState<{ from?: Date; to?: Date }>({});
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: categoryData, isLoading: catsLoading } = api_client.category.getAll.useQuery();
  const categories = categoryData?.data ?? [];

  const queryInput = React.useMemo(
    () => ({
      limit: 10,
      startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      categorySlug: activeTab.kind === 'category' ? [activeTab.slug] : undefined,
      type: filters.type.length > 0 ? filters.type : undefined,
      source: filters.source.length > 0 ? filters.source : undefined,
      sourceId: filters.sourceId || undefined,
      bankTransactionId: filters.bankTransactionId || undefined,
      bankAccountId: filters.bankAccountId || undefined,
    }),
    [dateRange, activeTab, filters],
  );

  const {
    data,
    isLoading: txLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api_client.transaction.getAll.useInfiniteQuery(queryInput, {
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      return meta.page < meta.lastPage ? meta.page + 1 : undefined;
    },
    initialCursor: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const totalCount = data?.pages[0]?.meta?.total ?? 0;
  const allTransactions = React.useMemo(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data],
  );
  const grouped = React.useMemo(() => groupTransactionsByDate(allTransactions), [allTransactions]);

  // Sentinel ref for infinite scroll
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const utils = api_client.useUtils();
  const deleteMutation = api_client.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success('Transaction deleted');
      utils.transaction.getAll.invalidate();
    },
    onError: (err) => toast.error('Failed to delete', { description: err.message }),
  });

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs: CategoryTab[] = React.useMemo(
    () => [
      { kind: 'all', label: 'All Transactions' },
      ...categories.map((cat) => ({
        kind: 'category' as const,
        label: cat.name,
        slug: cat.slug,
        color: cat.color ?? undefined,
      })),
    ],
    [categories],
  );

  const isTabActive = (tab: CategoryTab) => {
    if (tab.kind === 'all' && activeTab.kind === 'all') return true;
    if (tab.kind === 'category' && activeTab.kind === 'category')
      return tab.slug === activeTab.slug;
    return false;
  };

  // ── Date label ────────────────────────────────────────────────────────────
  const dateLabel = React.useMemo(() => {
    if (dateRange.from && dateRange.to)
      return `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`;
    if (dateRange.from) return `From ${format(dateRange.from, 'MMM d')}`;
    return 'Date range';
  }, [dateRange]);

  const hasDate = !!(dateRange.from || dateRange.to);
  const filterCount = activeFilterCount(filters);
  const showSkeleton = txLoading;

  // ── Column definitions (inside component to close over state) ─────────────
  const transactionColumns: ColumnDef<Transaction>[] = React.useMemo(
    () => [
      {
        key: 'transaction',
        label: 'Transaction',
        headerClassName: 'flex-1',
        bodyClassName: 'flex-1 min-w-0',
        skeletonClassName: 'flex-1 space-y-1.5',
        render: (row) => {
          const recurring = row.source === 'RECURRING';
          return (
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-text-primary truncate text-[14px] leading-5 font-medium">
                  {row.merchant ?? row.description ?? 'Transaction'}
                </span>
                {recurring && (
                  <span className="text-primary shrink-0 text-[11px] font-medium">Recurring</span>
                )}
              </div>
              {row.description && row.description !== row.merchant && (
                <p className="text-text-tertiary mt-0.5 truncate text-[12px] leading-4">
                  {row.description}
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: 'category',
        label: 'Category',
        headerClassName: 'hidden w-36 shrink-0 sm:block',
        bodyClassName: 'hidden w-36 shrink-0 sm:block',
        skeletonClassName: 'hidden w-36 shrink-0 sm:block',
        render: (row) => {
          const color = row.category?.color;
          if (!row.category) return <span className="text-text-disabled text-[12px]">—</span>;
          return (
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] leading-none font-medium"
              style={
                color
                  ? {
                      background: `color-mix(in srgb, ${color} 12%, transparent)`,
                      borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                      color,
                    }
                  : {
                      background: 'var(--color-bg-surface-hover)',
                      borderColor: 'var(--color-border-subtle)',
                      color: 'var(--color-text-secondary)',
                    }
              }
            >
              {row.category.name}
            </span>
          );
        },
      },
      {
        key: 'source',
        label: 'Source',
        headerClassName: 'hidden w-24 shrink-0 md:block',
        bodyClassName: 'hidden w-24 shrink-0 md:block',
        skeletonClassName: 'hidden w-24 shrink-0 md:block',
        render: (row) => (
          <span className="text-text-tertiary text-[12px]">{capitalize(row.source)}</span>
        ),
      },
      {
        key: 'amount',
        label: 'Amount',
        headerClassName: 'shrink-0',
        bodyClassName: 'shrink-0',
        skeletonClassName: 'shrink-0 w-20',
        render: (row) => {
          const expense = row.type === 'EXPENSE';
          return (
            <span
              className={cn(
                'text-[13px] font-semibold tracking-tight tabular-nums',
                expense ? 'text-error' : 'text-success',
              )}
            >
              {formatCurrency(parseFloat(row.amount))}
            </span>
          );
        },
      },
      {
        key: 'actions',
        label: '',
        headerClassName: 'shrink-0 w-8',
        bodyClassName: 'shrink-0 w-8 flex justify-end',
        skeletonClassName: 'shrink-0 w-8',
        render: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={cn(
                  'flex size-6 cursor-pointer items-center justify-center rounded',
                  'text-text-disabled hover:text-text-primary hover:bg-bg-surface',
                  'transition-all duration-150 outline-none',
                  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                )}
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-md p-1.5">
              <DropdownMenuItem
                className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerTxId(row.id);
                  setDrawerOpen(true);
                }}
              >
                <Eye className="size-3.5 shrink-0" /> View
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTx(row);
                }}
              >
                <Edit2 className="size-3.5 shrink-0" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate({ id: row.id });
                }}
              >
                <Trash2 className="size-3.5 shrink-0" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [drawerTxId, drawerOpen, deleteMutation],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Page header ── */}
      <PageHeader breadcrumbs={[{ label: 'Transactions' }]}>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 px-2.5 sm:px-4"
          onClick={() => toast.info('Export coming soon')}
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        <Button size="sm" className="gap-1.5 px-2.5 sm:px-4" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Add Transaction</span>
        </Button>
      </PageHeader>

      {/* ── Title + controls ── */}
      <div className="flex shrink-0 flex-col gap-3 px-6 pt-6 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-text-primary text-[22px] leading-7 font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="text-text-tertiary mt-1 text-[13px]">
            {txLoading
              ? 'Loading…'
              : `You have ${totalCount} transaction${totalCount !== 1 ? 's' : ''} this period`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Date range */}
          <div className="flex items-center gap-1">
            <AnchoredPopover
              open={calendarOpen}
              onOpenChange={(open) => {
                if (!open) setDraftDateRange(dateRange);
                setCalendarOpen(open);
              }}
              align="end"
              contentClassName="w-auto p-0"
              trigger={
                <button
                  type="button"
                  className={cn(
                    'rounded-button flex h-8 items-center gap-2 border px-3 text-[12px] transition-colors duration-150',
                    hasDate
                      ? 'border-border-light text-text-primary'
                      : 'border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border-light',
                  )}
                >
                  <CalendarDays className="size-3.5 shrink-0" />
                  {dateLabel}
                </button>
              }
            >
              <Calendar
                mode="range"
                selected={
                  draftDateRange.from
                    ? { from: draftDateRange.from, to: draftDateRange.to }
                    : undefined
                }
                onSelect={(range) => setDraftDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
              <div className="border-border-subtle flex items-center justify-end gap-2 border-t px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraftDateRange({});
                    setDateRange({});
                    setCalendarOpen(false);
                  }}
                  className="text-text-secondary hover:text-text-primary h-7 rounded-md px-3 text-[12px] transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={!draftDateRange.from}
                  onClick={() => {
                    setDateRange(draftDateRange);
                    setCalendarOpen(false);
                  }}
                  className={cn(
                    'h-7 rounded-md px-4 text-[12px] font-medium text-white transition-colors',
                    draftDateRange.from
                      ? 'bg-primary hover:opacity-90'
                      : 'bg-primary/40 cursor-default',
                  )}
                >
                  Apply
                </button>
              </div>
            </AnchoredPopover>

            {hasDate && (
              <button
                type="button"
                onClick={() => {
                  setDateRange({});
                  setDraftDateRange({});
                }}
                className="text-text-disabled hover:text-text-primary hover:bg-bg-surface-hover flex size-7 items-center justify-center rounded transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'rounded-button flex h-8 items-center gap-2 border px-3 text-[12px] transition-colors duration-150',
              filterCount > 0
                ? 'border-primary/30 text-text-primary'
                : 'border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border-light',
            )}
          >
            <SlidersHorizontal className="size-3.5 shrink-0" />
            Filters
            {filterCount > 0 && (
              <span className="bg-primary flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="shrink-0 px-6 pb-4">
        <div
          className="overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex w-max items-center gap-1.5">
            {catsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-24 rounded-full" />
                ))
              : tabs.map((tab) => {
                  const active = isTabActive(tab);
                  const color = tab.kind === 'category' ? tab.color : undefined;
                  return (
                    <button
                      key={tab.kind === 'all' ? 'all' : tab.slug}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[12px] font-medium',
                        'shrink-0 cursor-pointer border transition-all duration-150',
                        active
                          ? 'bg-primary border-primary text-white'
                          : 'border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-light',
                      )}
                    >
                      {color && (
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: color }}
                        />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
          </div>
        </div>
      </div>

      {/* ── Transaction list ── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="glass-card rounded-card border-border-subtle min-h-[480px] overflow-hidden border">
          <StyledTable
            columns={transactionColumns}
            className=""
            columnHeaderClassName="truncate"
            isLoading={showSkeleton}
            isEmpty={!showSkeleton && grouped.length === 0}
            skeletonRowCount={10}
            emptyContent={
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <p className="text-text-tertiary text-[13px]">No transactions found</p>
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="size-3.5" />
                  Add Transaction
                </Button>
              </div>
            }
          >
            <StyledTableHeader />
            <StyledTableBody>
              {grouped.map(({ label, items }) => (
                <StyledTableGroup
                  key={label}
                  label={label}
                  items={items}
                  onRowClick={(tx) => {
                    setDrawerTxId(tx.id);
                    setDrawerOpen(true);
                  }}
                  rowClassName={(tx) =>
                    cn(
                      'group transition-colors duration-150',
                      drawerTxId === tx.id && drawerOpen
                        ? 'bg-bg-surface-hover border-l-primary!'
                        : 'hover:bg-bg-surface-hover/50',
                    )
                  }
                />
              ))}
            </StyledTableBody>
          </StyledTable>
          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-px" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-5">
              <Loader2 className="text-text-disabled size-4 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* ── Filters sheet ── */}
      <TransactionFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
      />

      {/* ── Drawer ── */}
      <TransactionDrawer
        transactionId={drawerTxId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        categories={categories}
        onDeleted={() => setDrawerTxId(null)}
      />

      {/* ── Add ── */}
      <TransactionFormDialog open={addOpen} onOpenChange={setAddOpen} categories={categories} />

      {/* ── Edit ── */}
      {editTx && (
        <TransactionFormDialog
          open
          onOpenChange={(open) => !open && setEditTx(null)}
          categories={categories}
          transaction={editTx}
        />
      )}
    </div>
  );
}
