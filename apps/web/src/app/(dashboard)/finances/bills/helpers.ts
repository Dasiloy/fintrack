import type { Recurinrg } from '@fintrack/types/protos/finance/recurring';
import { format, parseLocalDate } from '@fintrack/utils/date';
import type { BillEditState, BillFilters, StatusTab } from './types';

export const EMPTY_FILTERS: BillFilters = {
  status: 'all',
  sortBy: 'nextRun',
  type: [],
  frequency: [],
};

export function activeFilterCount(f: BillFilters): number {
  return [
    f.status !== 'all',
    f.type.length > 0,
    f.frequency.length > 0,
    f.sortBy !== 'nextRun',
  ].filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Frequency labels
// ---------------------------------------------------------------------------

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  CUSTOM: 'Custom',
};

const FREQUENCY_SHORT: Record<string, string> = {
  DAILY: '/day',
  WEEKLY: '/wk',
  BIWEEKLY: '/2wk',
  MONTHLY: '/mo',
  QUARTERLY: '/qtr',
  YEARLY: '/yr',
  CUSTOM: '',
};

export function frequencyLabel(freq: string): string {
  return FREQUENCY_LABEL[freq] ?? freq;
}

export function frequencyShort(freq: string): string {
  return FREQUENCY_SHORT[freq] ?? '';
}

// ---------------------------------------------------------------------------
// Next-run helpers
// ---------------------------------------------------------------------------

export type RunUrgency = 'overdue' | 'soon' | 'upcoming' | 'none';

function localMidnightToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function nextRunLabel(nextRunAt?: string): string {
  if (!nextRunAt) return 'No upcoming run';

  const due = parseLocalDate(nextRunAt.slice(0, 10));
  const diffDays = Math.round((due.getTime() - localMidnightToday().getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return `Due ${format(due, 'MMM D')}`;
}

export function nextRunUrgency(nextRunAt?: string, isActive = true): RunUrgency {
  if (!nextRunAt || !isActive) return 'none';

  const due = parseLocalDate(nextRunAt.slice(0, 10));
  const diffDays = Math.round((due.getTime() - localMidnightToday().getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'soon';
  return 'upcoming';
}

// ---------------------------------------------------------------------------
// Filter + sort
// ---------------------------------------------------------------------------

export function filterBills(items: Recurinrg[], status: StatusTab): Recurinrg[] {
  if (status === 'active') return items.filter((i) => i.isActive);
  if (status === 'paused') return items.filter((i) => !i.isActive);
  return items;
}

/** Active items first, then sorted by nearest nextRunAt; inactive items last */
export function sortBillsByNextRun(items: Recurinrg[]): Recurinrg[] {
  return [...items].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;

    if (!a.nextRunAt && !b.nextRunAt) return 0;
    if (!a.nextRunAt) return 1;
    if (!b.nextRunAt) return -1;

    return parseLocalDate(a.nextRunAt.slice(0, 10)).getTime() - parseLocalDate(b.nextRunAt.slice(0, 10)).getTime();
  });
}

// ---------------------------------------------------------------------------
// Monthly cost estimate
// ---------------------------------------------------------------------------

const MONTHLY_MULTIPLIER: Record<string, number> = {
  DAILY: 30,
  WEEKLY: 4.33,
  BIWEEKLY: 2.17,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12,
  CUSTOM: 0,
};

/** Normalises any frequency to an approximate monthly equivalent for cost summaries */
export function toMonthlyAmount(amount: number, freq: string): number {
  return amount * (MONTHLY_MULTIPLIER[freq] ?? 0);
}

/** Total monthly cost of all active expense bills */
export function totalMonthlyExpense(items: Recurinrg[]): number {
  return items
    .filter((i) => i.isActive && i.type === 'EXPENSE')
    .reduce((sum, i) => sum + toMonthlyAmount(i.amount, i.frequency), 0);
}

export const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
];

// ---------------------------------------------------------------------------
// Frequency options (shared between form dialog and edit drawer)
// ---------------------------------------------------------------------------

export const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
] as const;

// ---------------------------------------------------------------------------
// Edit-state helpers (used by bill drawer)
// ---------------------------------------------------------------------------

export function toEditState(item: Recurinrg): BillEditState {
  return {
    name: item.name,
    amount: String(item.amount),
    type: item.type as BillEditState['type'],
    frequency: item.frequency,
    categorySlug: item.category?.slug ?? '',
    startDate: item.startDate.slice(0, 10),
    endDate: item.endDate ? item.endDate.slice(0, 10) : '',
    merchant: item.merchant ?? '',
    description: item.description ?? '',
  };
}
