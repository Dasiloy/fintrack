import type { Recurinrg } from '@fintrack/types/protos/finance/recurring';
import type { RecurringItemFrequency } from '@fintrack/database/types';
import type { ToggleOption, ChipOption } from '@/app/_components/filters';
import { FREQUENCIES } from './helpers';
import type { RunUrgency } from './helpers';

export type StatusTab = 'all' | 'active' | 'paused';
export type BillSortBy = 'nextRun' | 'amount' | 'name';

/** Full filter state — drives the filter drawer and the tRPC getAll call */
export interface BillFilters {
  status: StatusTab;
  sortBy: BillSortBy;
  type: ('INCOME' | 'EXPENSE')[];
  frequency: RecurringItemFrequency[];
}

/** Passed from the page down into each card / drawer */
export interface BillItemCallbacks {
  onView: (item: Recurinrg) => void;
  onEdit: (item: Recurinrg) => void;
  onToggle: (item: Recurinrg) => void;
  onToggleReminder: (item: Recurinrg) => void;
  onDelete: (item: Recurinrg) => void;
  isDeleting?: boolean;
}

/** Shared prop shape for BillCard and its sub-components */
export interface BillCardProps extends BillItemCallbacks {
  item: Recurinrg;
}

/** Props for the DueChip component */
export interface DueChipProps {
  nextRunAt?: string;
  urgency: RunUrgency;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Filter option constants — shared between BillFilters component and any
// future consumers (e.g. summary chips, URL serialisation)
// ---------------------------------------------------------------------------

export const STATUS_OPTIONS: ToggleOption<StatusTab>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active', activeClassName: 'bg-success/10 border-success/25 text-success' },
  { value: 'paused', label: 'Paused', activeClassName: 'bg-warning/10 border-warning/25 text-warning' },
];

export const TYPE_OPTIONS: ToggleOption<'INCOME' | 'EXPENSE'>[] = [
  { value: 'INCOME', label: 'Income', activeClassName: 'bg-success/10 border-success/25 text-success' },
  { value: 'EXPENSE', label: 'Expense', activeClassName: 'bg-error/10 border-error/25 text-error' },
];

export const SORT_OPTIONS: ToggleOption<BillSortBy>[] = [
  { value: 'nextRun', label: 'Due date' },
  { value: 'amount', label: 'Amount' },
  { value: 'name', label: 'Name' },
];

export const FREQUENCY_OPTIONS: ChipOption[] = FREQUENCIES.map((f) => ({
  value: f.value,
  label: f.label,
}));

/** Form state for the bill edit drawer */
export interface BillEditState {
  name: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  frequency: string;
  categorySlug: string;
  startDate: string;
  endDate: string;
  merchant: string;
  description: string;
  reminderEnabled: boolean;
}
