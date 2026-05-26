'use client';

// ── InsightsCashFlowCard ──────────────────────────────────────────────────────
// Cash flow forecast section — single sentence describing expected available
// funds after recurring bills for the rest of the month.

import * as React from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { cn } from '@ui/lib/utils';

interface InsightsCashFlowCardProps {
  forecast: string | null;
  expanded: boolean;
  onToggle: () => void;
}

export function InsightsCashFlowCard({ forecast, expanded, onToggle }: InsightsCashFlowCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-bg-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-info/10">
          <TrendingUp className="size-3.5 text-info" aria-hidden />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-text-primary">
          Cash Flow Forecast
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
        <div className="px-4 pb-4 pt-1">
          {forecast ? (
            <div className="flex items-center gap-3 rounded-lg bg-info/5 border border-info/20 px-4 py-3">
              <TrendingUp className="size-5 shrink-0 text-info" aria-hidden />
              <p className="text-[13px] leading-snug text-text-primary font-medium">
                {forecast}
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-text-disabled py-1">
              Not enough data for a cash flow forecast yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
