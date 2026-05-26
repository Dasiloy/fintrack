'use client';

// ── AdvisorHeader ─────────────────────────────────────────────────────────────
// Top bar for the advisor page. Adapts across breakpoints:
//  mobile  : shows history (☰) + tools (⚙) sheet trigger buttons
//  tablet  : shows tools button; history panel is inline
//  desktop : shows only logo + tab switcher; both panels are always visible

import * as React from 'react';
import { PanelLeft, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, Button, Separator } from '@ui/components';
import { cn } from '@ui/lib/utils';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';

interface AdvisorHeaderProps {
  activeTab: 'insights' | 'advisor';
  onTabChange: (tab: 'insights' | 'advisor') => void;
  onHistoryOpen: () => void;
  onToolsOpen: () => void;
}

export function AdvisorHeader({
  activeTab,
  onTabChange,
  onHistoryOpen,
  onToolsOpen,
}: AdvisorHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border-subtle bg-bg-elevated px-3 sm:px-4">

      {/* Back to dashboard */}
      <Link
        href={DASHBOARD_ROUTES.DASHBOARD}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="size-4" />
      </Link>

      <Separator orientation="vertical" className="h-4 opacity-30" />

      {/* History button — mobile only, and only when on advisor tab */}
      {activeTab === 'advisor' && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-9 shrink-0 cursor-pointer"
          onClick={onHistoryOpen}
          aria-label="Open conversation history"
        >
          <PanelLeft className="size-4" />
        </Button>
      )}

      {activeTab === 'advisor' && (
        <Separator orientation="vertical" className="h-4 opacity-30 md:hidden" />
      )}

      {/* Logo + title */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
          <Image
            src="/logo-icon-white.png"
            alt="FinTrack"
            width={16}
            height={16}
            className="h-4 w-auto"
          />
        </div>
        <span className="text-text-primary font-semibold text-sm truncate">
          Fintrack Advisor
        </span>
        <Badge
          variant="outline"
          className="hidden sm:inline-flex text-[10px] h-4 px-1.5 shrink-0"
        >
          Beta
        </Badge>
      </div>

      {/* ── Tab switcher (centre, visible on all breakpoints) ──────────────── */}
      {/*
       * Styled as a segmented control rather than full-width tabs.
       * On desktop the main tab content is driven from advisor_tabs.tsx,
       * but the switcher lives here so it's always in the header.
       */}
      <div className="flex shrink-0 overflow-hidden rounded-lg border border-border-light bg-bg-surface">
        {(['advisor', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              'cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors duration-150 capitalize',
              activeTab === tab
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover',
            )}
          >
            {tab === 'insights' ? 'Insights' : 'Advisor'}
          </button>
        ))}
      </div>

      {/* Tools button — hidden on desktop (lg+) where right panel is always visible */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden size-9 shrink-0 cursor-pointer"
        onClick={onToolsOpen}
        aria-label="Open tools panel"
      >
        <SlidersHorizontal className="size-4" />
      </Button>
    </header>
  );
}
