'use client';

import * as React from 'react';
import { format } from '@fintrack/utils/date';
import { Download, Eye, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button, Skeleton, toast, type DateRange as DateType } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { PageHeader } from '@/app/_components/page-header';
import { TransactionDrawer } from './_components/transaction_drawer';
import { TransactionFormDialog } from './_components/transaction_form_dialog';
import {
  TransactionFilters,
  EMPTY_FILTERS,
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
import { capitalize, flattenObject, formatCurrency } from '@fintrack/utils/format';
import { DateRange, Menu } from '@/app/_components';
import { useCsv } from '@ui/hooks';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';

export default function TransactionsPage() {
  // ── Hooks ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState<CategoryTab>({
    kind: 'all',
    label: 'All Transactions',
  });
  const [drawerTxId, setDrawerTxId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS);
  const [dateRange, setDateRange] = React.useState<DateType | undefined>(undefined);
  const [draftDateRange, setDraftDateRange] = React.useState<DateType | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: categoryData, isLoading: catsLoading } = api_client.category.getAll.useQuery();
  const categories = categoryData?.data ?? [];

  const queryInput = React.useMemo(() => {
    const startDate = dateRange?.from ? format(dateRange.from, 'YYYY-MM-DD') : undefined;
    const endDate = dateRange?.to ? format(dateRange.to, 'YYYY-MM-DD') : undefined;
    return {
      limit: 10,
      startDate,
      endDate: endDate ? (startDate === endDate ? undefined : endDate) : undefined,
      categorySlug: activeTab.kind === 'category' ? [activeTab.slug] : undefined,
      type: filters.type.length > 0 ? filters.type : undefined,
      source: filters.source.length > 0 ? filters.source : undefined,
      sourceId: filters.sourceId || undefined,
      bankTransactionId: filters.bankTransactionId || undefined,
      bankAccountId: filters.bankAccountId || undefined,
    };
  }, [dateRange, activeTab, filters]);

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
        flex: '0 0 90px',
        headerClassName: 'text-right md:text-left',
        bodyClassName: 'text-right md:text-left',
        skeletonClassName: 'flex justify-end',
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
        headerClassName: 'hidden sm:block shrink-0 w-8',
        bodyClassName: 'hidden sm:flex shrink-0 w-8 justify-end',
        skeletonClassName: 'hidden sm:block shrink-0 w-8',
        render: (row) => (
          <Menu
            menus={[
              {
                label: 'View',
                Icon: <Eye className="size-3.5 shrink-0" />,
                onClick(e) {
                  e.stopPropagation();
                  setDrawerTxId(row.id);
                  setDrawerOpen(true);
                },
              },
              {
                label: 'Delete',
                variant: 'destructive',
                Icon: <Trash2 className="size-3.5 shrink-0" />,
                onClick(e) {
                  e.stopPropagation();
                  deleteMutation.mutate({ id: row.id });
                },
              },
            ]}
          />
        ),
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [drawerTxId, drawerOpen, deleteMutation],
  );

  // ── Csv Exports ────────────────────────────────────────────────────────────────
  const { isDownloading, downloadTableCsv } = useCsv('transactions.csv');
  const handleExports = async () => {
    try {
      const rows = allTransactions.map(flattenObject);
      await downloadTableCsv(rows, { omit: ['icon', 'slug', 'color'] });
    } catch {
      toast.error('Failed to export transactions');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Page header ── */}
      <PageHeader breadcrumbs={[{ label: 'Transactions' }]}>
        <Button
          variant="outline"
          size="sm"
          loading={isDownloading}
          className="gap-1.5 px-2.5 sm:px-4"
          onClick={handleExports}
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
          {txLoading ? (
            <Skeleton className="mt-1 h-5 w-40 rounded-md" />
          ) : (
            <p className="text-text-tertiary mt-1 text-[13px]">
              `You have {totalCount} transaction{totalCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Date range */}
          <DateRange
            showClear
            label="Date Range"
            date={draftDateRange}
            rangeOpen={calendarOpen}
            onClear={() => {
              setDraftDateRange(undefined);
              setDateRange(undefined);
              setCalendarOpen(false);
            }}
            onApply={() => {
              setDateRange(draftDateRange);
              setCalendarOpen(false);
            }}
            onRangeOpenStateChange={(state) => {
              if (!state) setDraftDateRange(dateRange);
              setCalendarOpen(state);
            }}
            onDateSelect={(date: any) => {
              setDraftDateRange({ from: date?.from, to: date?.to });
            }}
          />

          {/* Filters */}
          <TransactionFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="shrink-0 px-6 pb-4">
        <div className="no-scrollbar overflow-x-auto">
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
        <div className="glass-card rounded-card border-border-subtle min-h-[480px] overflow-hidden border md:min-h-[660px] 2xl:min-h-[750px]">
          <StyledTable
            columns={transactionColumns}
            columnHeaderClassName="truncate"
            isLoading={txLoading}
            isEmpty={!txLoading && grouped.length === 0}
            skeletonRowCount={16}
            emptyContent={
              <div className="flex min-h-[480px] flex-col items-center justify-center gap-3 md:min-h-[660px]">
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
    </div>
  );
}
