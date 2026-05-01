'use client';

import { cn } from '@ui/lib/utils/cn';
import { formatCurrency } from '@fintrack/utils/format';
import { frequencyLabel, frequencyShort, nextRunUrgency } from '../helpers';
import type { BillCardProps } from '../types';
import { DueChip } from './deu_chip';
import { BillMenu } from './bill_menu';

export function BillCard({ item, onView, onEdit, onToggle, onDelete, isDeleting }: BillCardProps) {
  const accentColor = item.category?.color ?? '#6366f1';
  const initial = (item.merchant ?? item.name ?? '?')[0]?.toUpperCase() ?? '?';
  const urgency = nextRunUrgency(item.nextRunAt, item.isActive);
  const isExpense = item.type === 'EXPENSE';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView(item)}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl border p-4',
        'bg-bg-surface border-border-subtle transition-all duration-200',
        'hover:border-border-light focus-visible:ring-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none',
        !item.isActive && 'opacity-55',
      )}
    >
      {/* ── Row 1: avatar · name + category chip · menu ── */}
      <div className="flex items-start gap-3 pt-0.5">
        {/* Coloured initial avatar */}
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold select-none"
          style={{
            background: item.isActive
              ? `color-mix(in srgb, ${accentColor} 80%, #000)`
              : 'var(--color-bg-surface-hover)',
            color: item.isActive ? 'white' : 'var(--color-text-disabled)',
          }}
        >
          {initial}
        </div>

        {/* Name + chips */}
        <div className="min-w-0 flex-1">
          <p className="text-text-primary truncate text-[14px] leading-5 font-semibold">
            {item.merchant ?? item.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {/* Category chip */}
            <span
              className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] leading-none font-semibold"
              style={{
                background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                color: accentColor,
                border: `1px solid color-mix(in srgb, ${accentColor} 22%, transparent)`,
              }}
            >
              {item.category?.name ?? 'Uncategorised'}
            </span>
            {/* Paused pill */}
            {!item.isActive && (
              <span
                className="bg-bg-surface-hover text-text-disabled inline-flex items-center rounded-full border border-dashed px-2 py-[2px] text-[10px] leading-none font-medium"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                Paused
              </span>
            )}
          </div>
        </div>

        {/* Menu — fades in on hover */}
        <div className="shrink-0 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
          <BillMenu
            item={item}
            onView={onView}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* ── Row 2: amount · frequency · due chip ── */}
      <div className="flex items-end justify-between gap-2">
        {/* Amount + frequency suffix */}
        <div className="min-w-0">
          <p
            className={cn(
              'truncate text-[22px] leading-none font-bold tracking-tight tabular-nums',
              isExpense ? 'text-text-primary' : 'text-success',
            )}
          >
            {formatCurrency(item.amount)}
            <span className="text-text-disabled ml-0.5 text-[12px] font-normal">
              {frequencyShort(item.frequency)}
            </span>
          </p>
          <p className="text-text-disabled mt-1 text-[11px]">{frequencyLabel(item.frequency)}</p>
        </div>

        {/* Next-run chip */}
        <DueChip nextRunAt={item.nextRunAt} urgency={urgency} isActive={item.isActive} />
      </div>
    </div>
  );
}
