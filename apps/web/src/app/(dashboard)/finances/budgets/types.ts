export type SpendingTrendMode = 'total' | 'category';

export interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number | (string | number)[];
  color?: string;
}

export const WINDOW_OPTIONS = [3, 6, 12] as const;
export type TrendWindow = (typeof WINDOW_OPTIONS)[number];

export const BudgetPeriod = {
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
} as const;
export type BudgetPeriod = (typeof BudgetPeriod)[keyof typeof BudgetPeriod];

export const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: BudgetPeriod.MONTHLY, label: 'Monthly' },
  { value: BudgetPeriod.WEEKLY, label: 'Weekly' },
  { value: BudgetPeriod.QUARTERLY, label: 'Quarterly' },
  { value: BudgetPeriod.YEARLY, label: 'Yearly' },
];
