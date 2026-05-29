'use client';

// ── AdvisorPageClient ─────────────────────────────────────────────────────────
// Root client component for the AI Advisor page.
// Owns all top-level page state and orchestrates the responsive 3-panel layout.
//
// Layout behaviour by breakpoint (mobile-first):
//  < md  : single-column center panel; side panels open as Sheets
//  md–lg : left sidebar inline (~240px) + center; right panel in a Sheet
//  lg+   : full 3-panel ResizablePanelGroup with drag handles
//
// History sidebar (left panel) is only shown on the Advisor (chat) tab.
// Insights tab gets the full-width center + context-only right panel.
//
// ⚠️  react-resizable-panels v4 overrides `display` via inline styles, so
//     applying `hidden` directly on <ResizablePanelGroup> has no effect.
//     The group is wrapped in a <div> that controls visibility instead.
//     autoSaveId persists the layout to localStorage so it survives HMR/refresh.

import * as React from 'react';
import type { PanelImperativeHandle } from '@ui/components';
import { Sheet, SheetContent } from '@ui/components';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@ui/components';
import { ProGateModal } from '@/app/_components/pro_gate_modal';
import { Usage } from '@fintrack/types/constants/plan.constants';

import { AdvisorHeader } from './advisor_header';
import { ConversationSidebar } from './conversation_sidebar';
import { InsightsSidebarNav } from './insights_sidebar_nav';
import { AdvisorTabs } from './advisor_tabs';
import { ContextPanel } from './context_panel';

import type { AdvisorPageState, AdvisorTool } from '../_lib/advisor.types';
import { ADVISOR_TOOLS } from '../_lib/advisor.constants';

interface AdvisorPageClientProps {
  isPro: boolean;
}

export function AdvisorPageClient({ isPro }: AdvisorPageClientProps) {
  const [pageState, setPageState] = React.useState<AdvisorPageState>({
    activeTab: 'advisor',
    activeConversationId: null,
    historySheetOpen: false,
    toolsSheetOpen: false,
  });

  const [tools, setTools] = React.useState<AdvisorTool[]>(ADVISOR_TOOLS);
  const [isContextCollapsed, setIsContextCollapsed] = React.useState(false);
  const contextPanelRef = React.useRef<PanelImperativeHandle | null>(null);

  // Insights section expand/collapse — lifted here so InsightsSidebarNav and
  // InsightsPanel can share the same state. All sections start closed.
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    summary: false,
    anomalies: false,
    goal_alerts: false,
    cash_flow: false,
    recommendations: false,
    macro: false,
  });
  const toggleSection = React.useCallback((id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleTool = React.useCallback((id: string) => {
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  }, []);

  const toggleContextPanel = React.useCallback(() => {
    if (contextPanelRef.current?.isCollapsed()) {
      contextPanelRef.current.expand();
    } else {
      contextPanelRef.current?.collapse();
    }
  }, []);

  // Guards the New Conversation action: true once the user sends their first
  // message in a null-id session. Starts true if a real conversation is selected.
  const [chatHasMessages, setChatHasMessages] = React.useState(
    pageState.activeConversationId !== null,
  );

  const update = (patch: Partial<AdvisorPageState>) =>
    setPageState((prev) => ({ ...prev, ...patch }));

  // Selecting a conversation always switches to the Advisor (chat) tab.
  // Stub conversations always carry messages, so the guard is lifted immediately.
  const selectConversation = (id: string) => {
    setChatHasMessages(true);
    update({ activeConversationId: id, activeTab: 'advisor' });
  };

  // No-op when already in the empty state (null id, no messages sent yet).
  // This prevents double-clicking "New Conversation" from doing anything.
  const newConversation = () => {
    if (pageState.activeConversationId === null && !chatHasMessages) return;
    setChatHasMessages(false);
    update({ activeConversationId: null, activeTab: 'advisor' });
  };

  // Called by ChatPanel when the user sends their very first message.
  // Lifts the guard so a subsequent "New Conversation" click works.
  const handleFirstMessageSent = React.useCallback(() => {
    setChatHasMessages(true);
  }, []);

  const isAdvisorTab = pageState.activeTab === 'advisor';

  return (
    <div className="flex h-full flex-col">
      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <AdvisorHeader
        activeTab={pageState.activeTab}
        onTabChange={(tab) => update({ activeTab: tab })}
        onHistoryOpen={() => update({ historySheetOpen: true })}
        onToolsOpen={() => update({ toolsSheetOpen: true })}
      />

      {/* ── Mobile / Tablet Sheets ─────────────────────────────────────────── */}

      {/* History sheet — only relevant on advisor tab */}
      <Sheet
        open={pageState.historySheetOpen}
        onOpenChange={(open) => update({ historySheetOpen: open })}
      >
        <SheetContent side="left" className="w-72 p-0">
          <ConversationSidebar
            threads={[]}
            activeId={pageState.activeConversationId}
            onSelect={(id) => {
              selectConversation(id);
              update({ historySheetOpen: false });
            }}
            onNewConversation={() => {
              newConversation();
              update({ historySheetOpen: false });
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={pageState.toolsSheetOpen}
        onOpenChange={(open) => update({ toolsSheetOpen: open })}
      >
        <SheetContent side="right" className="w-80 p-0">
          <ContextPanel tools={tools} onToolToggle={toggleTool} />
        </SheetContent>
      </Sheet>

      {/* ── Main content area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {/* ── Mobile / Tablet layout (< lg) ────────────────────────────────── */}
        <div className="flex h-full lg:hidden">
          {/* Inline left sidebar — md only; content swaps based on active tab */}
          <div className="border-border-subtle hidden shrink-0 flex-col border-r md:flex md:w-60">
            {isAdvisorTab ? (
              <ConversationSidebar
                threads={[]}
                activeId={pageState.activeConversationId}
                onSelect={selectConversation}
                onNewConversation={newConversation}
              />
            ) : (
              <InsightsSidebarNav
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />
            )}
          </div>

          {/* Center content */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AdvisorTabs
              activeTab={pageState.activeTab}
              onTabChange={(tab) => update({ activeTab: tab })}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              activeConversationId={pageState.activeConversationId}
              onFirstMessageSent={handleFirstMessageSent}
            />
          </div>
        </div>

        {/* ── Desktop 3-panel layout (lg+) ─────────────────────────────────── */}
        <div className="hidden h-full overflow-hidden lg:flex">
          <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
            {/* Left: content swaps per tab; panel is always present to keep index stable */}
            <ResizablePanel defaultSize="20" minSize="14" maxSize="28" className="min-w-0">
              {isAdvisorTab ? (
                <ConversationSidebar
                  threads={[]}
                  activeId={pageState.activeConversationId}
                  onSelect={selectConversation}
                  onNewConversation={newConversation}
                />
              ) : (
                <InsightsSidebarNav
                  expandedSections={expandedSections}
                  onToggleSection={toggleSection}
                />
              )}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center: tabs */}
            <ResizablePanel defaultSize="55" minSize="40" className="min-w-0">
              <AdvisorTabs
                activeTab={pageState.activeTab}
                onTabChange={(tab) => update({ activeTab: tab })}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
                activeConversationId={pageState.activeConversationId}
                onFirstMessageSent={handleFirstMessageSent}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right: context + tools — collapsible via button or drag */}
            <ResizablePanel
              panelRef={contextPanelRef}
              defaultSize="25"
              minSize="18"
              maxSize="35"
              collapsible
              collapsedSize="4"
              className="min-w-0"
              onResize={(size) => setIsContextCollapsed(size.asPercentage <= 4)}
            >
              <ContextPanel
                tools={tools}
                onToolToggle={toggleTool}
                isCollapsed={isContextCollapsed}
                onToggle={toggleContextPanel}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* ── Persistent pro gate ────────────────────────────────────────────── */}
      <ProGateModal
        feature={Usage.AI_CHAT_MESSAGES_PER_MONTH}
        title="AI Advisor"
        description="Chat with your personal AI financial advisor for unlimited insights, budget recommendations, and real-time spending analysis."
        open={!isPro}
        onClose={() => {}}
      />
    </div>
  );
}
