'use client';

// ── ContextPanel ──────────────────────────────────────────────────────────────
// Right panel shell — used both as a ResizablePanel (desktop) and inside a
// Sheet (mobile/tablet). Contains three collapsible sections:
//   1. Tool toggles (Postgres + oracle)
//   2. Market signals (NGN rate, CPI, CBN rate)
//   3. Budget snapshot (utilisation mini-bars)
//
// When `isCollapsed` is true (desktop only, driven by the ResizablePanel's
// collapse state), renders a minimal vertical strip with an expand button so
// the user can reopen the panel without dragging the resize handle.

import * as React from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { ScrollArea } from '@ui/components';
import { ContextToolsSection } from './context_tools_section';
import { ContextOracleSection } from './context_oracle_section';
import { ContextBudgetSection } from './context_budget_section';
import type { AdvisorTool } from '../_lib/advisor.types';

interface ContextPanelProps {
  tools: AdvisorTool[];
  onToolToggle: (id: string) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function ContextPanel({
  tools,
  onToolToggle,
  isCollapsed = false,
  onToggle,
}: ContextPanelProps) {
  if (isCollapsed) {
    return (
      <div className="flex h-full flex-col items-center border-l border-border-subtle bg-bg-elevated pt-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex size-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-surface-hover hover:text-text-secondary"
          aria-label="Expand context panel"
        >
          <PanelRightOpen className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-border-subtle bg-bg-elevated">
      {/* Panel heading */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle px-4">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-text-tertiary">
          Context
        </span>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="flex size-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-surface-hover hover:text-text-secondary"
            aria-label="Collapse context panel"
          >
            <PanelRightClose className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* Scrollable sections */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <ContextToolsSection tools={tools} onToolToggle={onToolToggle} />
        <ContextOracleSection />
        <ContextBudgetSection />
      </ScrollArea>
    </div>
  );
}
