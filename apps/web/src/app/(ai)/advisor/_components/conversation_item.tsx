'use client';

// ── ConversationItem ──────────────────────────────────────────────────────────
// Single row in the conversation history list: title + relative time, with a
// three-dot menu to rename (inline edit) or delete (confirm dialog). No preview
// or message-count — those go stale on every turn.

import * as React from 'react';
import {
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/components';
import { cn } from '@ui/lib/utils';
import { relativeTime } from '../_lib/advisor.helpers';
import type { ConversationThread } from '../_lib/advisor.types';

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD = 10;

interface ConversationItemProps {
  thread: ConversationThread;
  isActive: boolean;
  onClick: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  isRenaming?: boolean;
}

export function ConversationItem({
  thread,
  isActive,
  onClick,
  onRename,
  onDelete,
  isDeleting,
  isRenaming,
}: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(thread.title);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const longPressTimerRef = React.useRef<number | null>(null);
  const longPressStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = React.useRef(false);
  const isPending = Boolean(isDeleting || isRenaming);

  const clearLongPressTimer = React.useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startRename = () => {
    if (isPending) return;
    setDraft(thread.title);
    setIsEditing(true);
  };

  React.useEffect(() => clearLongPressTimer, [clearLongPressTimer]);

  const handleLongPressStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (isPending) return;
    if (event.pointerType === 'mouse' || event.button !== 0) return;
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  };

  const handleLongPressMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!longPressStartRef.current) return;
    const dx = Math.abs(event.clientX - longPressStartRef.current.x);
    const dy = Math.abs(event.clientY - longPressStartRef.current.y);
    if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
      clearLongPressTimer();
      longPressStartRef.current = null;
    }
  };

  const handleLongPressEnd = () => {
    clearLongPressTimer();
    longPressStartRef.current = null;
  };

  const commitRename = () => {
    if (isPending) return;
    const next = draft.trim();
    setIsEditing(false);
    if (next && next !== thread.title) onRename(thread.id, next);
  };

  // ── Inline rename mode ──────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="bg-bg-surface flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2.5">
        <MessageSquare className="text-primary size-3.5 shrink-0" aria-hidden />
        <input
          ref={inputRef}
          value={draft}
          maxLength={120}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="text-text-primary min-w-0 flex-1 bg-transparent text-[13px] leading-tight font-medium outline-none"
        />
      </div>
    );
  }

  // ── Normal row ──────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={cn(
          'group flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2.5',
          'transition-colors duration-150',
          isActive
            ? 'bg-primary/10 text-text-primary'
            : 'text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary',
          isPending && 'pointer-events-none opacity-55',
        )}
        aria-busy={isPending}
      >
        <button
          type="button"
          disabled={isPending}
          onPointerDown={handleLongPressStart}
          onPointerMove={handleLongPressMove}
          onPointerUp={handleLongPressEnd}
          onPointerCancel={handleLongPressEnd}
          onPointerLeave={handleLongPressEnd}
          onClick={(event) => {
            if (isPending) return;
            if (longPressTriggeredRef.current) {
              event.preventDefault();
              event.stopPropagation();
              longPressTriggeredRef.current = false;
              return;
            }
            onClick();
          }}
          className="flex min-w-0 flex-1 cursor-pointer touch-manipulation items-center gap-2.5 text-left select-none disabled:cursor-not-allowed"
        >
          <MessageSquare
            className={cn('size-3.5 shrink-0', isActive ? 'text-primary' : 'text-text-disabled')}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-[13px] leading-tight font-medium">
            {thread.title}
          </span>
          <span className="text-text-disabled shrink-0 text-[10px]">
            {relativeTime(thread.updatedAt)}
          </span>
          {isPending ? (
            <Loader2 className="text-primary size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : null}
        </button>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Conversation options"
              disabled={isPending}
              className={cn(
                'text-text-disabled hover:text-text-primary hover:bg-bg-surface-hover flex size-6 shrink-0 cursor-pointer items-center justify-center rounded transition-all outline-none',
                'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                menuOpen && 'opacity-100',
                isPending && 'cursor-not-allowed opacity-100',
              )}
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-md p-1.5">
            <DropdownMenuItem
              className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
              onClick={() => {
                setMenuOpen(false);
                startRename();
              }}
            >
              <Pencil className="size-3.5 shrink-0" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
              onClick={() => {
                if (isPending) return;
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-3.5 shrink-0" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (isDeleting) return;
          setDeleteOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10">
              <TriangleAlert className="size-6 text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete &quot;{thread.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This conversation and all its messages will be permanently deleted. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={isDeleting}
              disabled={isDeleting}
              onClick={() => onDelete(thread.id)}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
