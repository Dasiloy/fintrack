'use client';

import {
  FilterSheet,
  FilterSection,
  FilterToggleGroup,
  FilterChipList,
  FilterTextInput,
  FilterAccountList,
  type ToggleOption,
} from '@/app/_components/filters';

// ---------------------------------------------------------------------------
// Filter shape
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_OPTIONS: ToggleOption<'INCOME' | 'EXPENSE'>[] = [
  {
    value: 'INCOME',
    label: 'Income',
    activeClassName: 'bg-success/10 border-success/25 text-success',
  },
  { value: 'EXPENSE', label: 'Expense', activeClassName: 'bg-error/10 border-error/25 text-error' },
];

const SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'BANK', label: 'Bank Sync' },
  { value: 'RECURRING', label: 'Recurring' },
  { value: 'OCR', label: 'OCR Scan' },
  { value: 'SPLIT', label: 'Split' },
];

// ---------------------------------------------------------------------------
// TransactionFilters
// ---------------------------------------------------------------------------

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  return (
    <FilterSheet
      value={filters}
      onApply={onChange}
      empty={EMPTY_FILTERS}
      countActive={activeFilterCount}
      title="Filters"
    >
      {(draft, setDraft) => (
        <>
          <FilterSection label="Type">
            <FilterToggleGroup
              options={TYPE_OPTIONS}
              value={draft.type}
              onChange={(type) => setDraft((d) => ({ ...d, type }))}
            />
          </FilterSection>

          <FilterSection label="Source">
            <FilterChipList
              options={SOURCE_OPTIONS}
              value={draft.source}
              onChange={(source) => setDraft((d) => ({ ...d, source }))}
            />
          </FilterSection>

          <FilterTextInput
            label="Source ID"
            value={draft.sourceId}
            placeholder="e.g. ocr-job-abc123"
            onChange={(v) => setDraft((d) => ({ ...d, sourceId: v }))}
          />

          <FilterTextInput
            label="Bank Transaction ID"
            value={draft.bankTransactionId}
            placeholder="e.g. bank-tx-abc123"
            onChange={(v) => setDraft((d) => ({ ...d, bankTransactionId: v }))}
          />

          <FilterAccountList
            value={draft.bankAccountId}
            onChange={(id) => setDraft((d) => ({ ...d, bankAccountId: id }))}
          />
        </>
      )}
    </FilterSheet>
  );
}
