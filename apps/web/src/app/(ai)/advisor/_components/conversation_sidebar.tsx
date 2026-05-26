'use client';

// ── ConversationSidebar ───────────────────────────────────────────────────────
// Left panel: list of past conversation threads + "New Conversation" button.
// Rendered in two contexts:
//  1. Inline sidebar (md+ tablet, lg+ desktop ResizablePanel)
//  2. Inside a Sheet (mobile — full-height, slides in from the left)

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, ScrollArea } from '@ui/components';
import { ConversationItem } from './conversation_item';
import type { ConversationThread } from '../_lib/advisor.types';

interface ConversationSidebarProps {
  threads: ConversationThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  threads,
  activeId,
  onSelect,
  onNewConversation,
}: ConversationSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-bg-elevated">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-3">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
          History
        </span>
      </div>

      {/* ── New conversation button ──────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={onNewConversation}
        >
          <Plus className="size-3.5" aria-hidden />
          <span className="text-xs">New conversation</span>
        </Button>
      </div>

      {/* ── Thread list ─────────────────────────────────────────────────────── */}
      {/*
       * ScrollArea provides a styled scrollbar that blends with the dark theme.
       * flex-1 ensures it fills remaining height while the header and button stay fixed.
       */}
      <ScrollArea className="flex-1 px-2 pb-3">
        {threads.length === 0 ? (
          <p className="px-3 py-4 text-center text-[12px] text-text-disabled">
            No conversations yet
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {threads.map((thread) => (
              <ConversationItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === activeId}
                onClick={() => onSelect(thread.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
