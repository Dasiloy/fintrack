'use client';

// ── InsightsGoalAlertList ─────────────────────────────────────────────────────
// Goal pacing alert section. Shows goals that are behind or at risk.

import * as React from 'react';
import { ChevronDown, Target, ArrowRight } from 'lucide-react';
import { cn } from '@ui/lib/utils';

interface InsightsGoalAlertListProps {
  goalAlerts: string[];
  expanded: boolean;
  onToggle: () => void;
}

export function InsightsGoalAlertList({ goalAlerts, expanded, onToggle }: InsightsGoalAlertListProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left hover:bg-bg-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-error/10">
          <Target className="size-3.5 text-error" aria-hidden />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-text-primary">
          Goal Alerts
        </span>
        {goalAlerts.length > 0 && (
          <span className="mr-1 rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] font-semibold text-error tabular-nums">
            {goalAlerts.length}
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
          {goalAlerts.length === 0 ? (
            <p className="text-[12px] text-text-disabled py-1">
              All goals are on track.
            </p>
          ) : (
            goalAlerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2.5"
              >
                <Target className="mt-0.5 size-3.5 shrink-0 text-error" aria-hidden />
                <p className="flex-1 text-[12px] leading-relaxed text-text-secondary">
                  {alert}
                </p>
                {/* "Fix it" CTA — stub navigation */}
                <button
                  type="button"
                  className="mt-0.5 flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
                  aria-label="Go to goals page"
                >
                  Fix it
                  <ArrowRight className="size-3" aria-hidden />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
