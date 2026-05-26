'use client';

// ── ConversationItem ──────────────────────────────────────────────────────────
// Single row in the conversation history list.
// Shows: title (truncated), relative timestamp, and message count badge.

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { relativeTime, truncate } from '../_lib/advisor.helpers';
import type { ConversationThread } from '../_lib/advisor.types';

interface ConversationItemProps {
  thread: ConversationThread;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ thread, isActive, onClick }: ConversationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base: full-width, left-aligned, min 44px touch target
        'flex w-full min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-left',
        'transition-colors duration-150',
        isActive
          ? 'bg-primary/10 text-text-primary'
          : 'text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary',
      )}
    >
      {/* Icon */}
      <MessageSquare
        className={cn('mt-0.5 size-3.5 shrink-0', isActive ? 'text-primary' : 'text-text-disabled')}
        aria-hidden
      />

      {/* Text content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Title row */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[13px] font-medium leading-tight truncate">
            {thread.title}
          </span>
          {/* Message count badge */}
          <span className="shrink-0 rounded-full bg-bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary tabular-nums">
            {thread.messageCount}
          </span>
        </div>

        {/* Last message preview + timestamp */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] text-text-tertiary truncate leading-tight">
            {truncate(thread.lastMessage, 42)}
          </span>
          <span className="shrink-0 text-[10px] text-text-disabled">
            {relativeTime(thread.updatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
