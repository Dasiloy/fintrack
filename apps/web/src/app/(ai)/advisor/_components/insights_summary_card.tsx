'use client';

// ── InsightsSummaryCard ───────────────────────────────────────────────────────
// Prose summary section — the advisor's overall narrative for the period.

import * as React from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { cn } from '@ui/lib/utils';

interface InsightsSummaryCardProps {
  summary: string;
  expanded: boolean;
  onToggle: () => void;
}

export function InsightsSummaryCard({ summary, expanded, onToggle }: InsightsSummaryCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      {/* Section header — acts as collapse trigger */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left hover:bg-bg-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="size-3.5 text-primary" aria-hidden />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-text-primary">
          Summary
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-text-tertiary transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {/* Collapsible body */}
      {expanded && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-[13px] leading-relaxed text-text-secondary">{summary}</p>
        </div>
      )}
    </div>
  );
}
