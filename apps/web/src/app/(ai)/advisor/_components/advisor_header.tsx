'use client';

// ── AdvisorHeader ─────────────────────────────────────────────────────────────
// Top bar for the advisor page. Adapts across breakpoints:
//  mobile  : shows history (☰) + tools (⚙) sheet trigger buttons
//  tablet  : shows tools button; history panel is inline
//  desktop : shows only logo + tab switcher; both panels are always visible

import * as React from 'react';
import { PanelLeft, SlidersHorizontal, ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from '@bprogress/next';
import { Badge, Button, Separator } from '@ui/components';
import { cn } from '@ui/lib/utils';

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
  const router = useRouter();

  return (
    <header className="border-border-subtle bg-bg-elevated flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
      {/* Back to dashboard */}
      <button
        type="button"
        onClick={() => router.back()}
        className="text-text-tertiary hover:bg-bg-surface-hover hover:text-text-primary flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="size-4" />
      </button>

      <Separator orientation="vertical" className="h-4 opacity-30" />

      {/* History button — mobile only, and only when on advisor tab */}
      {activeTab === 'advisor' && (
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 cursor-pointer md:hidden"
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
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="bg-primary flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm">
          <Image
            src="/logo-icon-white.png"
            alt="FinTrack"
            width={16}
            height={16}
            className="h-4 w-auto"
          />
        </div>
        <span className="text-text-primary hidden truncate text-sm font-semibold sm:block">
          Fintrack Advisor
        </span>
      </div>

      {/* ── Tab switcher (centre, visible on all breakpoints) ──────────────── */}
      {/*
       * Styled as a segmented control rather than full-width tabs.
       * On desktop the main tab content is driven from advisor_tabs.tsx,
       * but the switcher lives here so it's always in the header.
       */}
      <div className="border-border-light bg-bg-surface flex shrink-0 overflow-hidden rounded-lg border">
        {(['advisor', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              'cursor-pointer px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-150',
              activeTab === tab
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover',
            )}
            aria-label={tab === 'insights' ? 'Insights' : 'Advisor'}
          >
            {/* Icon on mobile, label on sm+ */}
            {tab === 'advisor' ? (
              <>
                <MessageCircle className="size-3.5 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">Advisor</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">Insights</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Tools button — hidden on desktop (lg+) where right panel is always visible */}
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 cursor-pointer lg:hidden"
        onClick={onToolsOpen}
        aria-label="Open tools panel"
      >
        <SlidersHorizontal className="size-4" />
      </Button>
    </header>
  );
}
