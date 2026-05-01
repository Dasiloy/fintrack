'use client';

import { Clock } from 'lucide-react';
import { cn } from '@ui/lib/utils/cn';
import { nextRunLabel } from '../helpers';
import type { DueChipProps } from '../types';

export function DueChip({ nextRunAt, urgency, isActive }: DueChipProps) {
  if (!isActive || !nextRunAt) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-[4px] text-[11px] leading-none font-medium',
        urgency === 'overdue' && 'bg-error/10 text-error',
        urgency === 'soon' && 'bg-warning/10 text-warning',
        urgency === 'upcoming' && 'bg-bg-surface-hover text-text-tertiary',
        urgency === 'none' && 'bg-bg-surface-hover text-text-disabled',
      )}
    >
      <Clock className="size-3 shrink-0" />
      {nextRunLabel(nextRunAt)}
    </span>
  );
}
