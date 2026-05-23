'use client';

import * as React from 'react';
import { Link2, Link2Off, Search } from 'lucide-react';
import { AnchoredPopover } from '@ui/components/shared';
import { Skeleton } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { inputCls } from '@/app/_components/drawer_ui';
import { useDebounce } from '@/hooks/use_debounce';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import { format } from '@fintrack/utils/date';
import { type TransactionType } from '@fintrack/database/types';

export interface LinkedTransaction {
  id: string;
  description: string | null;
  merchant: string | null;
  amount: string;
  date: string;
}

interface TransactionPickerProps {
  type: 'EXPENSE' | 'INCOME';
  value: LinkedTransaction | null;
  onChange: (tx: LinkedTransaction | null) => void;
  disabled?: boolean;
}

function txLabel(tx: LinkedTransaction): string {
  return tx.description ?? tx.merchant ?? '—';
}

export function TransactionPicker({ type, value, onChange, disabled }: TransactionPickerProps) {
  const formatCurrency = useFormatCurrency();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const minChars = 2;
  const queryReady = debouncedQuery.trim().length >= minChars;

  const { data, isFetching } = api_client.transaction.search.useQuery(
    { q: debouncedQuery, type: type as TransactionType, limit: 20 },
    { enabled: open && queryReady, staleTime: 30 * 1000 },
  );

  const results = queryReady ? (data?.data ?? []) : [];

  const handleSelect = (tx: LinkedTransaction) => {
    onChange(tx);
    setOpen(false);
  };

  const handleUnlink = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="relative">
    <AnchoredPopover
      open={open}
      onOpenChange={disabled ? undefined : setOpen}
      modal={false}
      contentClassName="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg"
      trigger={
        <button
          type="button"
          disabled={disabled}
          className={cn(
            inputCls,
            'flex h-10 w-full cursor-pointer items-center gap-2 overflow-hidden text-left',
            value && 'pr-8',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {value ? (
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-text-primary truncate text-[12px] font-medium">
                {txLabel(value)}
              </span>
              <span className="text-text-tertiary text-[10px] tabular-nums">
                {formatCurrency(parseFloat(value.amount))} ·{' '}
                {format(new Date(value.date), 'MMM D, YYYY')}
              </span>
            </span>
          ) : (
            <>
              <Link2 className="text-text-disabled size-3.5 shrink-0" />
              <span className="text-text-disabled flex-1 text-[12px]">Link a transaction</span>
            </>
          )}
        </button>
      }
    >
      <div className="flex flex-col">
        {/* Search input */}
        <div className="border-border-light flex items-center gap-2 border-b px-3 py-2">
          <Search className="text-text-disabled size-3.5 shrink-0" />
          <input
            autoFocus
            className="text-text-primary placeholder:text-text-disabled w-full bg-transparent text-[12px] outline-none"
            placeholder="Search transactions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Results */}
        <div className="max-h-[260px] overflow-y-auto">
          {isFetching ? (
            <div className="flex flex-col gap-2 p-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : !queryReady ? (
            <p className="text-text-disabled py-6 text-center text-[12px]">Type to search transactions</p>
          ) : results.length === 0 ? (
            <p className="text-text-disabled py-6 text-center text-[12px]">No transactions found</p>
          ) : (
            results.map((tx) => {
              const linked: LinkedTransaction = {
                id: tx.id,
                description: tx.description ?? null,
                merchant: tx.merchant ?? null,
                amount: tx.amount,
                date: tx.date,
              };
              const isSelected = value?.id === tx.id;
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => handleSelect(linked)}
                  className={cn(
                    'border-border-light hover:bg-bg-surface-hover flex w-full cursor-pointer items-center justify-between gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-0',
                    isSelected && 'bg-primary/5',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-text-primary block truncate text-[12px] font-medium">
                      {txLabel(linked)}
                    </span>
                    <span className="text-text-tertiary text-[10px]">
                      {format(new Date(tx.date), 'MMM D, YYYY')}
                    </span>
                  </span>
                  <span className="text-text-primary shrink-0 text-[12px] font-semibold tabular-nums">
                    {formatCurrency(parseFloat(tx.amount))}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </AnchoredPopover>
    {value && (
      <button
        type="button"
        onClick={handleUnlink}
        className="text-text-disabled hover:text-error absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors"
        aria-label="Remove linked transaction"
      >
        <Link2Off className="size-3.5" />
      </button>
    )}
    </div>
  );
}
