'use client';

// ── InsightsRecommendationsList ───────────────────────────────────────────────
// Ranked recommendations section. Items sorted high → medium → low priority.

import * as React from 'react';
import { ChevronDown, Lightbulb, Zap } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { getPriorityColor, getPriorityBg } from '../_lib/advisor.helpers';
import type { InsightRecommendation } from '../_lib/advisor.helpers';

interface InsightsRecommendationsListProps {
  recommendations: InsightRecommendation[];
  expanded: boolean;
  onToggle: () => void;
}

export function InsightsRecommendationsList({
  recommendations,
  expanded,
  onToggle,
}: InsightsRecommendationsListProps) {
  // Sort: high first, then medium, then low
  const sorted = [...recommendations].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left hover:bg-bg-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-success/10">
          <Lightbulb className="size-3.5 text-success" aria-hidden />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-text-primary">
          Recommendations
        </span>
        {recommendations.length > 0 && (
          <span className="mr-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success tabular-nums">
            {recommendations.length}
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
          {sorted.length === 0 ? (
            <p className="text-[12px] text-text-disabled py-1">
              No recommendations at this time.
            </p>
          ) : (
            sorted.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2.5"
              >
                {/* Priority dot */}
                <div className="mt-1 flex shrink-0 flex-col items-center gap-1">
                  <div
                    className={cn('size-2 rounded-full', {
                      'bg-error': rec.priority === 'high',
                      'bg-warning': rec.priority === 'medium',
                      'bg-info': rec.priority === 'low',
                    })}
                  />
                </div>

                {/* Text */}
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <p className="text-[12px] leading-relaxed text-text-secondary">
                    {rec.text}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize',
                        getPriorityBg(rec.priority),
                        getPriorityColor(rec.priority),
                      )}
                    >
                      {rec.priority} priority
                    </span>
                    {rec.actionable && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Zap className="size-2.5" aria-hidden />
                        Actionable
                      </span>
                    )}
                    <span className="rounded-full bg-bg-surface px-1.5 py-0.5 text-[10px] text-text-disabled capitalize">
                      {rec.category}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
