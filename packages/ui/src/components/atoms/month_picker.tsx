'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { AnchoredPopover } from '@ui/components/shared/anchored_popover';
import { cn } from '@ui/lib/utils/index';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const MONTH_ROWS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
] as const;

// ─── trigger ──────────────────────────────────────────────────────────────────

interface MonthPickerTriggerProps {
  value: Date;
  open: boolean;
  nextMonthDisabled: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenChange: (open: boolean) => void;
}

function MonthPickerTrigger({
  value,
  open,
  nextMonthDisabled,
  onPrevMonth,
  onNextMonth,
  onOpenChange,
}: MonthPickerTriggerProps) {
  return (
    <div className="border-border-light bg-bg-surface flex items-center rounded-lg border">
      <button
        type="button"
        onClick={onPrevMonth}
        className="text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover flex h-8 w-7 items-center justify-center rounded-l-lg transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="text-text-primary hover:bg-bg-surface-hover h-8 min-w-[88px] px-2 text-xs font-medium transition-colors"
        aria-label="Open month picker"
      >
        {MONTHS[value.getMonth()]} {value.getFullYear()}
      </button>

      <button
        type="button"
        onClick={onNextMonth}
        disabled={nextMonthDisabled}
        className={cn(
          'text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover flex h-8 w-7 items-center justify-center rounded-r-lg transition-colors',
          nextMonthDisabled &&
            'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-inherit',
        )}
        aria-label="Next month"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

// ─── picker ───────────────────────────────────────────────────────────────────

export interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxDate?: Date;
}

export function MonthPicker({ value, onChange, open, onOpenChange, maxDate }: MonthPickerProps) {
  const max = React.useMemo(() => {
    if (maxDate) return maxDate;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [maxDate]);

  const [displayYear, setDisplayYear] = React.useState(() => value.getFullYear());

  React.useEffect(() => {
    setDisplayYear(value.getFullYear());
  }, [value]);

  function prevMonth() {
    onChange(new Date(value.getFullYear(), value.getMonth() - 1, 1));
  }

  function nextMonth() {
    const next = new Date(value.getFullYear(), value.getMonth() + 1, 1);
    if (next <= max) onChange(next);
  }

  function selectMonth(monthIndex: number) {
    onChange(new Date(displayYear, monthIndex, 1));
    onOpenChange(false);
  }

  const nextMonthDisabled = new Date(value.getFullYear(), value.getMonth() + 1, 1) > max;
  const prevYearDisabled = displayYear <= 2000;
  const nextYearDisabled = displayYear >= max.getFullYear();

  return (
    <AnchoredPopover
      trigger={
        <MonthPickerTrigger
          value={value}
          open={open}
          nextMonthDisabled={nextMonthDisabled}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onOpenChange={onOpenChange}
        />
      }
      open={open}
      onOpenChange={onOpenChange}
      align="start"
      side="bottom"
      sideOffset={6}
      contentClassName="w-[220px] p-3"
    >
      {/* Year navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDisplayYear((y) => y - 1)}
          disabled={prevYearDisabled}
          className={cn(
            'text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover flex size-6 items-center justify-center rounded transition-colors',
            prevYearDisabled &&
              'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-inherit',
          )}
          aria-label="Previous year"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <span className="text-text-primary text-xs font-semibold tabular-nums">{displayYear}</span>

        <button
          type="button"
          onClick={() => setDisplayYear((y) => y + 1)}
          disabled={nextYearDisabled}
          className={cn(
            'text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover flex size-6 items-center justify-center rounded transition-colors',
            nextYearDisabled &&
              'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-inherit',
          )}
          aria-label="Next year"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* Month grid */}
      <div className="grid gap-1">
        {MONTH_ROWS.map((row, ri) => (
          <div key={ri} className="grid grid-cols-4 gap-1">
            {row.map((monthIndex) => {
              const isActive =
                value.getFullYear() === displayYear && value.getMonth() === monthIndex;
              const isDisabled = new Date(displayYear, monthIndex, 1) > max;

              return (
                <button
                  key={monthIndex}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectMonth(monthIndex)}
                  className={cn(
                    'rounded-md py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : isDisabled
                        ? 'text-text-disabled cursor-not-allowed opacity-40'
                        : 'text-text-primary hover:bg-bg-surface-hover cursor-pointer',
                  )}
                >
                  {MONTHS[monthIndex]}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </AnchoredPopover>
  );
}
