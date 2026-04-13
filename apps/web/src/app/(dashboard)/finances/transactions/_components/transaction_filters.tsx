'use client';

import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { ScrollArea, Sheet, SheetContent } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterState {
  type: ('INCOME' | 'EXPENSE')[];
  source: string[];
  sourceId: string;
  bankTransactionId: string;
  bankAccountId: string;
}

export const EMPTY_FILTERS: FilterState = {
  type: [],
  source: [],
  sourceId: '',
  bankTransactionId: '',
  bankAccountId: '',
};

export function activeFilterCount(f: FilterState): number {
  return [
    f.type.length > 0,
    f.source.length > 0,
    !!f.sourceId,
    !!f.bankTransactionId,
    !!f.bankAccountId,
  ].filter(Boolean).length;
}

function filtersEqual(a: FilterState, b: FilterState): boolean {
  return (
    JSON.stringify(a.type.slice().sort()) === JSON.stringify(b.type.slice().sort()) &&
    JSON.stringify(a.source.slice().sort()) === JSON.stringify(b.source.slice().sort()) &&
    a.sourceId === b.sourceId &&
    a.bankTransactionId === b.bankTransactionId &&
    a.bankAccountId === b.bankAccountId
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'BANK', label: 'Bank Sync' },
  { value: 'RECURRING', label: 'Recurring' },
  { value: 'OCR', label: 'OCR Scan' },
  { value: 'SPLIT', label: 'Split' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-text-disabled uppercase tracking-[0.1em] mb-2.5">
      {children}
    </p>
  );
}

function ExpandableInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(!!value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-0.5 group mb-2.5"
      >
        <span className="text-[10px] font-semibold text-text-disabled uppercase tracking-[0.1em]">
          {label}
        </span>
        <ChevronDown
          className={cn(
            'size-3 text-text-disabled transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="relative mt-0.5">
          <input
            type="text"
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'w-full rounded-md border border-border-subtle bg-bg-surface',
              'px-3 py-2 text-[12px] text-text-primary placeholder:text-text-disabled',
              'focus:outline-none focus:border-primary/40 transition-colors',
            )}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TransactionFilters
// ---------------------------------------------------------------------------

interface TransactionFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Applied (committed) filters */
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function TransactionFilters({ open, onOpenChange, filters, onChange }: TransactionFiltersProps) {
  // Local draft — only written to parent on Apply
  const [draft, setDraft] = React.useState<FilterState>(filters);

  // Reset draft whenever the sheet opens
  React.useEffect(() => {
    if (open) setDraft(filters);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: accountsData } = api_client.account.getLinkedAccounts.useQuery(undefined, {
    enabled: open,
  });
  const accounts = accountsData?.data ?? [];

  const toggleType = (val: 'INCOME' | 'EXPENSE') =>
    setDraft((d) => ({
      ...d,
      type: d.type.includes(val) ? d.type.filter((t) => t !== val) : [...d.type, val],
    }));

  const toggleSource = (val: string) =>
    setDraft((d) => ({
      ...d,
      source: d.source.includes(val) ? d.source.filter((s) => s !== val) : [...d.source, val],
    }));

  const toggleAccount = (id: string) =>
    setDraft((d) => ({ ...d, bankAccountId: d.bankAccountId === id ? '' : id }));

  const handleApply = () => {
    onChange(draft);
    onOpenChange(false);
  };

  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const draftCount = activeFilterCount(draft);
  const isDirty = !filtersEqual(draft, filters);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" showCloseButton={false} className="w-72 flex flex-col p-0 gap-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <span className="text-[13px] font-semibold text-text-primary">Filters</span>
          <div className="flex items-center gap-3">
            {draftCount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[12px] text-text-tertiary hover:text-text-primary transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="size-6 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1">
          <div className="px-5 py-5 flex flex-col gap-6">

            {/* Type */}
            <div>
              <SectionLabel>Type</SectionLabel>
              <div className="flex gap-2">
                {(['INCOME', 'EXPENSE'] as const).map((t) => {
                  const active = draft.type.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleType(t)}
                      className={cn(
                        'flex-1 py-2 rounded-md text-[12px] font-medium border transition-all duration-150',
                        active && t === 'INCOME'
                          ? 'bg-success/10 border-success/25 text-success'
                          : active && t === 'EXPENSE'
                            ? 'bg-error/10 border-error/25 text-error'
                            : 'border-border-subtle text-text-secondary hover:border-border-light hover:text-text-primary',
                      )}
                    >
                      {t === 'INCOME' ? 'Income' : 'Expense'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source */}
            <div>
              <SectionLabel>Source</SectionLabel>
              <div className="space-y-0.5">
                {SOURCE_OPTIONS.map((opt) => {
                  const active = draft.source.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleSource(opt.value)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md text-[12px] transition-all duration-150',
                        active
                          ? 'bg-primary/8 text-primary'
                          : 'text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary',
                      )}
                    >
                      <span>{opt.label}</span>
                      {active && (
                        <span className="size-3.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <X className="size-2 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source ID */}
            <ExpandableInput
              label="Source ID"
              value={draft.sourceId}
              placeholder="e.g. ocr-job-abc123"
              onChange={(v) => setDraft((d) => ({ ...d, sourceId: v }))}
            />

            {/* Bank Transaction ID */}
            <ExpandableInput
              label="Bank Transaction ID"
              value={draft.bankTransactionId}
              placeholder="e.g. bank-tx-abc123"
              onChange={(v) => setDraft((d) => ({ ...d, bankTransactionId: v }))}
            />

            {/* Bank Account */}
            {accounts.length > 0 && (
              <div>
                <SectionLabel>Bank Account</SectionLabel>
                <div className="space-y-1.5">
                  {accounts.map((acc) => {
                    const active = draft.bankAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => toggleAccount(acc.id!)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-150',
                          active
                            ? 'border-primary/30 bg-primary/6'
                            : 'border-border-subtle hover:border-border-light hover:bg-bg-surface-hover/50',
                        )}
                      >
                        {/* Bank initial */}
                        <span
                          className={cn(
                            'size-8 rounded-full shrink-0 flex items-center justify-center text-[12px] font-semibold',
                            active ? 'bg-primary/15 text-primary' : 'bg-bg-surface-hover text-text-secondary',
                          )}
                        >
                          {(acc.bankName ?? 'B')[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-[12px] font-medium truncate', active ? 'text-primary' : 'text-text-primary')}>
                            {acc.bankName}
                          </p>
                          <p className="text-[11px] text-text-tertiary truncate">
                            {acc.accountNumber} · {acc.accountType}
                          </p>
                        </div>
                        {active && (
                          <span className="size-3.5 rounded-full bg-primary shrink-0 flex items-center justify-center">
                            <X className="size-2 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle shrink-0 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'flex-1 h-9 rounded-button border border-border-subtle text-[12px] font-medium',
              'text-text-secondary hover:text-text-primary hover:border-border-light transition-colors',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className={cn(
              'flex-1 h-9 rounded-button text-[12px] font-medium text-white transition-colors',
              isDirty
                ? 'bg-primary hover:opacity-90'
                : 'bg-primary/50 cursor-default',
            )}
          >
            {draftCount > 0 ? `Apply (${draftCount})` : 'Apply'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
