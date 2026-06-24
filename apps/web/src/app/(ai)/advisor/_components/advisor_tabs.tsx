'use client';

// ── AdvisorTabs ───────────────────────────────────────────────────────────────
// Center panel: renders either the InsightsPanel or ChatPanel based on activeTab.
// The tab switcher itself lives in AdvisorHeader (always visible in the top bar),
// so this component just renders the correct content.

import * as React from 'react';
import { InsightsPanel } from './insights_panel';
import { ChatPanel } from './chat_panel';

interface AdvisorTabsProps {
  activeTab: 'insights' | 'advisor';
  onTabChange: (tab: 'insights' | 'advisor') => void;
  expandedSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  activeConversationId: string | null;
  loadHistory: boolean;
  onFirstMessageSent: () => void;
  onConversationUpdated: () => void;
  onConversationStarted: (conversationId: string) => void;
}

export function AdvisorTabs({
  activeTab,
  onTabChange: _onTabChange,
  expandedSections,
  onToggleSection,
  activeConversationId,
  loadHistory,
  onFirstMessageSent,
  onConversationUpdated,
  onConversationStarted,
}: AdvisorTabsProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg-deep">
      {activeTab === 'insights' ? (
        <InsightsPanel
          expandedSections={expandedSections}
          onToggleSection={onToggleSection}
        />
      ) : (
        <ChatPanel
          activeConversationId={activeConversationId}
          loadHistory={loadHistory}
          onFirstMessageSent={onFirstMessageSent}
          onConversationUpdated={onConversationUpdated}
          onConversationStarted={onConversationStarted}
        />
      )}
    </div>
  );
}
