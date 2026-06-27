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
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
  renamingId?: string | null;
  /** Before the persisted list has hydrated — show skeleton rows, not "empty". */
  isLoading?: boolean;
}

export function ConversationSidebar({
  threads,
  activeId,
  onSelect,
  onNewConversation,
  onRename,
  onDelete,
  deletingId,
  renamingId,
  isLoading,
}: ConversationSidebarProps) {
  return (
    <div className="bg-bg-elevated flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="border-border-subtle flex items-center gap-2 border-b px-3 py-3">
        <span className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
          History
        </span>
      </div>

      {/* ── New conversation button ──────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full justify-start gap-2"
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
        {isLoading ? (
          // Persisted list not hydrated yet — skeleton rows avoid an
          // "empty → list" flash on refresh (SSR + first client render match).
          <div className="flex flex-col gap-1.5 px-1 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-bg-surface h-9 animate-pulse rounded-lg"
                style={{ opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <p className="text-text-disabled px-3 py-4 text-center text-[12px]">
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
                onRename={onRename}
                onDelete={onDelete}
                isDeleting={deletingId === thread.id}
                isRenaming={renamingId === thread.id}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
