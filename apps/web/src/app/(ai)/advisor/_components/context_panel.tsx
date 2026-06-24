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
import { AdvisorPermissionsPanel } from './advisor_permissions_panel';
import { ContextOracleSection } from './context_oracle_section';
import { ContextBudgetSection } from './context_budget_section';

interface ContextPanelProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function ContextPanel({ isCollapsed = false, onToggle }: ContextPanelProps) {
  if (isCollapsed) {
    return (
      <div className="border-border-subtle bg-bg-elevated flex h-full flex-col items-center border-l pt-2">
        <button
          type="button"
          onClick={onToggle}
          className="text-text-tertiary hover:bg-bg-surface-hover hover:text-text-secondary flex size-8 items-center justify-center rounded-md transition-colors"
          aria-label="Expand context panel"
        >
          <PanelRightOpen className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="border-border-subtle bg-bg-elevated flex h-full flex-col overflow-hidden border-l">
      {/* Panel heading */}
      <div className="border-border-subtle flex h-12 shrink-0 items-center justify-between border-b px-4">
        <span className="text-text-tertiary text-[12px] font-semibold tracking-wide uppercase">
          Context
        </span>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="text-text-tertiary hover:bg-bg-surface-hover hover:text-text-secondary flex size-7 items-center justify-center rounded-md transition-colors"
            aria-label="Collapse context panel"
          >
            <PanelRightClose className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* Scrollable sections */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <AdvisorPermissionsPanel />
        <ContextOracleSection />
        <ContextBudgetSection />
      </ScrollArea>
    </div>
  );
}
