'use client';

// ── InsightsMacroCard ─────────────────────────────────────────────────────────
// Macro economic context section: NGN/USD rate, food CPI, CBN policy rate.
// Starts collapsed by default (supplementary information).

import * as React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { relativeTime } from '../_lib/advisor.helpers';
import type { MacroContext } from '../_lib/advisor.helpers';

interface InsightsMacroCardProps {
  context: MacroContext | null;
  expanded: boolean;
  onToggle: () => void;
}

export function InsightsMacroCard({ context, expanded, onToggle }: InsightsMacroCardProps) {
  if (!context) return null;
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left hover:bg-bg-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
          <Globe className="size-3.5 text-text-tertiary" aria-hidden />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-text-primary">
          Macro Context
        </span>
        <span className="mr-1 text-[11px] text-text-disabled">
          Updated {relativeTime(new Date(context.fetchedAt))}
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-text-tertiary transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="grid grid-cols-3 gap-px bg-border-subtle px-4 py-3">
          {/* Each stat rendered as a mini card */}
          <MacroStat
            label="USD/NGN"
            value={
              context.ngnUsdRate != null
                ? `₦${context.ngnUsdRate.toLocaleString()}`
                : '—'
            }
            subtext="Live rate"
          />
          <MacroStat
            label="Food CPI"
            value={context.foodCpiYoY != null ? `+${context.foodCpiYoY}%` : '—'}
            subtext="YoY inflation"
            highlight={context.foodCpiYoY != null && context.foodCpiYoY > 15}
          />
          <MacroStat
            label="CBN Rate"
            value={
              context.cbnPolicyRate != null ? `${context.cbnPolicyRate}%` : '—'
            }
            subtext="Policy rate"
          />
        </div>
      )}
    </div>
  );
}

// ── Internal helper ───────────────────────────────────────────────────────────

interface MacroStatProps {
  label: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}

function MacroStat({ label, value, subtext, highlight = false }: MacroStatProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-bg-elevated p-3">
      <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
        {label}
      </span>
      <span
        className={cn(
          'text-[15px] font-semibold tabular-nums',
          highlight ? 'text-warning' : 'text-text-primary',
        )}
      >
        {value}
      </span>
      <span className="text-[10px] text-text-disabled">{subtext}</span>
    </div>
  );
}
