'use client';

// ── InsightsAnomalyList ───────────────────────────────────────────────────────
// Spending anomaly section. Renders each anomaly as a dismissible chip/card.

import * as React from 'react';
import { ChevronDown, AlertTriangle, X } from 'lucide-react';
import { cn } from '@ui/lib/utils';

interface InsightsAnomalyListProps {
  anomalies: string[];
  expanded: boolean;
  onToggle: () => void;
}

export function InsightsAnomalyList({ anomalies, expanded, onToggle }: InsightsAnomalyListProps) {
  // Track dismissed anomaly indices locally
  const [dismissed, setDismissed] = React.useState<Set<number>>(new Set());

  const visible = anomalies.filter((_, i) => !dismissed.has(i));

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-bg-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-warning/10">
          <AlertTriangle className="size-3.5 text-warning" aria-hidden />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-text-primary">
          Anomalies
        </span>
        {/* Count badge */}
        {visible.length > 0 && (
          <span className="mr-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning tabular-nums">
            {visible.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            'size-4 text-text-tertiary transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
          {visible.length === 0 ? (
            <p className="text-[12px] text-text-disabled py-1">
              No anomalies detected — all clear.
            </p>
          ) : (
            visible.map((anomaly, visibleIdx) => {
              // Map back to original index for dismiss tracking
              const originalIdx = anomalies.findIndex(
                (a, i) => a === anomaly && !dismissed.has(i),
              );
              return (
                <div
                  key={originalIdx}
                  className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5"
                >
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
                  <p className="flex-1 text-[12px] leading-relaxed text-text-secondary">
                    {anomaly}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDismissed((prev) => new Set([...prev, originalIdx]))}
                    className="mt-0.5 shrink-0 text-text-disabled hover:text-text-tertiary transition-colors"
                    aria-label="Dismiss anomaly"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
