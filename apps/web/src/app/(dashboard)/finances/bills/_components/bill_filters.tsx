'use client';

import { RecurringItemFrequency } from '@fintrack/database/types';
import {
  FilterSheet,
  FilterSection,
  FilterToggleGroup,
  FilterChipList,
} from '@/app/_components/filters';
import { EMPTY_FILTERS, activeFilterCount } from '../helpers';
import {
  FREQUENCY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  type BillFilters,
  type BillSortBy,
  type StatusTab,
} from '../types';

interface BillFiltersProps {
  filters: BillFilters;
  onChange: (filters: BillFilters) => void;
}

export function BillFilters({ filters, onChange }: BillFiltersProps) {
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
          <FilterSection label="Status">
            <FilterToggleGroup
              options={STATUS_OPTIONS}
              value={[draft.status]}
              onChange={(vals) => {
                const next = (vals.find((v) => v !== draft.status) ?? 'all') as StatusTab;
                setDraft((d) => ({ ...d, status: next }));
              }}
            />
          </FilterSection>

          <FilterSection label="Type">
            <FilterToggleGroup
              options={TYPE_OPTIONS}
              value={draft.type}
              onChange={(type) => setDraft((d) => ({ ...d, type }))}
            />
          </FilterSection>

          <FilterSection label="Frequency">
            <FilterChipList
              options={FREQUENCY_OPTIONS}
              value={draft.frequency}
              onChange={(frequency) =>
                setDraft((d) => ({ ...d, frequency: frequency as RecurringItemFrequency[] }))
              }
            />
          </FilterSection>

          <FilterSection label="Sort by">
            <FilterToggleGroup
              options={SORT_OPTIONS}
              value={[draft.sortBy]}
              onChange={(vals) => {
                const next = (vals.find((v) => v !== draft.sortBy) ?? 'nextRun') as BillSortBy;
                setDraft((d) => ({ ...d, sortBy: next }));
              }}
            />
          </FilterSection>
        </>
      )}
    </FilterSheet>
  );
}
