'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import {
  WINDOW_OPTIONS,
  type SpendingTrendMode,
  type TrendWindow,
} from '@/app/(dashboard)/finances/budgets/types';

interface SpendingTrendHeaderProps {
  mode: SpendingTrendMode;
  months: TrendWindow;
  onModeChange?: (mode: SpendingTrendMode) => void;
  onMonthsChange?: (months: TrendWindow) => void;
  disabled?: boolean;
}

export function SpendingTrendHeader({
  mode,
  months,
  onModeChange,
  onMonthsChange,
  disabled = false,
}: SpendingTrendHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-text-primary shrink-0 text-sm font-semibold">Spending Trend</h2>

      {/* Mobile: compact selects */}
      <div className={cn('flex items-center gap-1.5 sm:hidden', disabled && 'pointer-events-none')}>
        <Select
          value={mode}
          onValueChange={disabled ? undefined : (v) => onModeChange?.(v as SpendingTrendMode)}
        >
          <SelectTrigger size="sm" className="h-7 w-[120px] text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Total</SelectItem>
            <SelectItem value="category">By Category</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(months)}
          onValueChange={
            disabled ? undefined : (v) => onMonthsChange?.(Number(v) as TrendWindow)
          }
        >
          <SelectTrigger size="sm" className="h-7 w-16 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOW_OPTIONS.map((w) => (
              <SelectItem key={w} value={String(w)}>
                {w}M
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: pill controls */}
      <div
        className={cn(
          'hidden items-center gap-1.5 sm:flex',
          disabled && 'pointer-events-none',
        )}
      >
        <div className="border-border-light flex items-center rounded-lg border p-0.5">
          {(['total', 'category'] as SpendingTrendMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={disabled ? undefined : () => onModeChange?.(m)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors',
                mode === m
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary cursor-pointer',
              )}
            >
              {m === 'total' ? 'Total' : 'By Category'}
            </button>
          ))}
        </div>

        <div className="border-border-light flex items-center rounded-lg border p-0.5">
          {WINDOW_OPTIONS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={disabled ? undefined : () => onMonthsChange?.(w)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors',
                months === w
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary cursor-pointer',
              )}
            >
              {w}M
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
