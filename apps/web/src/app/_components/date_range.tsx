'use client';

import { cn } from '@ui/lib/utils';
import { AnchoredPopover, Calendar, type DateRange as DateRangeType } from '@ui/components';
import { useMemo } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { format } from '@fintrack/utils/date';

interface DateRangeProps {
  rangeOpen: boolean;
  label?: string;
  date?: DateRangeType;
  onClear?: VoidFunction;
  onApply?: VoidFunction;
  showClear?: boolean;
  onDateSelect: (date: DateRangeType) => void;
  onRangeOpenStateChange: (state: boolean) => void;
}

function DateRange({
  rangeOpen,
  onRangeOpenStateChange,
  date,
  label,
  onDateSelect,
  onApply,
  onClear,
  showClear = true,
}: DateRangeProps) {
  const hasDate = useMemo(() => {
    if (!date) return false;
    return !!(date.from || date.to);
  }, [date]);

  const dateLabel = useMemo(() => {
    if (!date) return label ?? 'Date range';
    if (date.from && date.to)
      return `${format(date.from, 'MMM D, YYYY')} – ${format(date.to, 'MMM D, YYYY')}`;
    if (date.from) return `From ${format(date.from, 'MMM D, YYYY')}`;
  }, [date]);

  const selected = useMemo(() => {
    if (!date) return undefined;
    return date.from
      ? {
          from: date.from,
          to: date.to,
        }
      : undefined;
  }, [date]);

  return (
    <div className="flex items-center gap-1">
      <AnchoredPopover
        open={rangeOpen}
        onOpenChange={onRangeOpenStateChange}
        align="end"
        contentClassName="w-auto p-0"
        trigger={
          <button
            type="button"
            className={cn(
              'rounded-button flex h-8 items-center gap-2 border px-3 text-[12px] transition-colors duration-150',
              hasDate
                ? 'border-border-light text-text-primary'
                : 'border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border-light',
            )}
          >
            <CalendarDays className="size-3.5 shrink-0" />
            {dateLabel}
          </button>
        }
      >
        <Calendar
          mode="range"
          selected={selected}
          numberOfMonths={1}
          onSelect={(range: any) => onDateSelect(range)}
        />
        {!!(onClear && onApply) && (
          <div className="border-border-subtle flex items-center justify-end gap-2 border-t px-3 py-2.5">
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-text-secondary hover:text-text-primary h-7 cursor-pointer rounded-md px-3 text-[12px] transition-colors"
              >
                Clear
              </button>
            )}
            {onApply && (
              <button
                type="button"
                disabled={!selected}
                onClick={onApply}
                className={cn(
                  'h-7 cursor-pointer rounded-md px-4 text-[12px] font-medium text-white transition-colors',
                  selected ? 'bg-primary hover:opacity-90' : 'bg-primary/40 cursor-default',
                )}
              >
                Apply
              </button>
            )}
          </div>
        )}
      </AnchoredPopover>

      {hasDate && showClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-text cursor-pointer-disabled hover:text-text-primary hover:bg-bg-surface-hover flex size-7 items-center justify-center rounded transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export { type DateRangeProps, DateRange };
