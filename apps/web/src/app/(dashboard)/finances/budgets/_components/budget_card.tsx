'use client';

import * as React from 'react';
import { Pencil, Trash2, TriangleAlert } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { formatCurrency } from '@fintrack/utils/format';
import type { Budget } from '@fintrack/types/protos/finance/budget';
import { RING_RADIUS, RING_STROKE, RING_CIRCUMFERENCE, ringColorClass } from '../helpers';

// ─── props ────────────────────────────────────────────────────────────────────

interface BudgetCategoryCardProps {
  budget: Budget;
  onOpen: (id: string, editMode?: boolean) => void;
  onDelete: (id: string) => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export function BudgetCategoryCard({ budget, onOpen, onDelete }: BudgetCategoryCardProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const limit = Number(budget.amount);
  const spent = parseFloat(budget.spent) || 0;
  const ratio = limit > 0 ? spent / limit : 0;
  const remaining = Math.max(limit - spent, 0);
  const pct = Math.min(Math.round(ratio * 100), 100);
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(ratio, 1));
  const color = budget.category?.color ?? '#7c7aff';
  const threshold = budget.alertThreshold ?? 0.8;
  const isBreaching = ratio >= threshold;

  // Reset confirm-delete when menu closes
  React.useEffect(() => {
    if (!menuOpen) setConfirmDelete(false);
  }, [menuOpen]);

  return (
    <div
      role="button"
      onClick={() => onOpen(budget.id)}
      className="border-border-subtle bg-bg-surface group relative flex cursor-pointer flex-col rounded-xl border p-4 transition-shadow hover:shadow-lg"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {/* Category color dot */}
          <span
            className="mt-0.5 block size-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />

          <div className="min-w-0">
            <p className="text-text-primary truncate text-[13px] leading-tight font-semibold">
              {budget.category?.name ?? '—'}
            </p>
            <p className="text-text-tertiary truncate text-[11px] leading-tight">{budget.name}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isBreaching && (
            <TriangleAlert
              className="text-warning size-3.5 shrink-0"
              aria-label="Alert threshold reached"
            />
          )}

          {/* Kebab menu */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'text-text-disabled hover:text-text-primary hover:bg-bg-surface-hover flex size-6 cursor-pointer items-center justify-center rounded transition-all duration-150 outline-none',
                  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                )}
              >
                <span className="flex flex-col items-center justify-center gap-[3px]">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block size-[3px] rounded-full bg-current" />
                  ))}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-36 rounded-md p-1.5">
              <DropdownMenuItem
                className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onOpen(budget.id, true);
                }}
              >
                <Pencil className="size-3.5 shrink-0" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (confirmDelete) {
                    setMenuOpen(false);
                    onDelete(budget.id);
                  } else {
                    setConfirmDelete(true);
                  }
                }}
              >
                <Trash2 className="size-3.5 shrink-0" />
                {confirmDelete ? 'Confirm?' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Ring ── */}
      <div className="my-4 flex flex-col items-center gap-1">
        <div className="relative flex items-center justify-center">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            fill="none"
            className={cn('-rotate-90', ringColorClass(ratio, threshold))}
          >
            {/* Track */}
            <circle
              cx="48"
              cy="48"
              r={RING_RADIUS}
              stroke="currentColor"
              strokeWidth={RING_STROKE}
              className="opacity-15"
            />
            {/* Progress */}
            <circle
              cx="48"
              cy="48"
              r={RING_RADIUS}
              stroke="currentColor"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          {/* Center label */}
          <div className="absolute flex flex-col items-center">
            <span
              className={cn(
                'text-[18px] leading-none font-bold tabular-nums',
                ringColorClass(ratio, threshold),
              )}
            >
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Amounts ── */}
      <div className="mt-auto space-y-0.5">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-text-tertiary text-[11px]">Spent</span>
          <span className="text-text-primary text-[13px] font-semibold tabular-nums">
            {formatCurrency(spent)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-text-tertiary text-[11px]">Limit</span>
          <span className="text-text-secondary text-[12px] tabular-nums">
            {formatCurrency(limit)}
          </span>
        </div>
        <div className="border-border-subtle mt-1.5 border-t pt-1.5">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-text-tertiary text-[11px]">Remaining</span>
            <span
              className={cn(
                'text-[12px] font-medium tabular-nums',
                ratio >= 1 ? 'text-error' : 'text-text-primary',
              )}
            >
              {ratio >= 1 ? '—' : formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
