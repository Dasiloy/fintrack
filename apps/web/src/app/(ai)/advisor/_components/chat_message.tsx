'use client';

// ── ChatMessage ───────────────────────────────────────────────────────────────
// Renders a single chat message bubble.
//   - User messages: right-aligned, primary-tinted background
//   - Assistant messages: left-aligned with avatar, neutral background
//
// Markdown-like text: **bold** and newline handling — full markdown parser is
// out of scope for the stub; these patterns cover all content in STUB_MESSAGES.

import * as React from 'react';
import { BrainCircuit } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { formatTime } from '../_lib/advisor.helpers';
import { ChatFileAttachment } from './chat_file_attachment';
import { ChatApprovalCard } from './chat_approval_card';
import type { AdvisorMessage } from '../_lib/advisor.types';

interface ChatMessageProps {
  message: AdvisorMessage;
  /** Called when user approves or rejects an action — parent updates actionState */
  onActionApprove?: (messageId: string) => void;
  onActionReject?: (messageId: string) => void;
}

export function ChatMessage({ message, onActionApprove, onActionReject }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-2.5',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar — assistant only */}
      {!isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <BrainCircuit className="size-3.5 text-primary" aria-hidden />
        </div>
      )}

      {/* Bubble + attachments */}
      <div className={cn('flex max-w-[80%] flex-col gap-2', isUser && 'items-end')}>
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-[13px] leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-primary/10 text-text-primary'
              : 'rounded-tl-sm bg-bg-surface text-text-primary',
          )}
        >
          <RichText text={message.content} />
        </div>

        {/* Generated file attachments */}
        {message.generatedFiles && message.generatedFiles.length > 0 && (
          <div className={cn('flex w-full max-w-xs flex-col gap-1.5', isUser && 'items-end')}>
            {message.generatedFiles.map((file) => (
              <ChatFileAttachment key={file.name} file={file} />
            ))}
          </div>
        )}

        {/* HITL approval card */}
        {message.proposedAction && (
          <div className="w-full max-w-sm">
            <ChatApprovalCard
              action={message.proposedAction}
              initialState={message.actionState ?? 'pending'}
              onApprove={() => onActionApprove?.(message.id)}
              onReject={() => onActionReject?.(message.id)}
            />
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-text-disabled">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}

// ── RichText ──────────────────────────────────────────────────────────────────
// Minimal markdown-like renderer for assistant messages.
// Handles: **bold**, newlines → <br />, and bullet lists (lines starting with -).

function RichText({ text }: { text: string }) {
  // Split on double-newlines to get paragraphs; single newlines become <br>
  const paragraphs = text.split('\n\n');

  return (
    <>
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n');
        return (
          <p key={pi} className={cn(pi > 0 && 'mt-2')}>
            {lines.map((line, li) => (
              <React.Fragment key={li}>
                {li > 0 && <br />}
                <InlineText text={line} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

// Handles **bold** within a single line of text.
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
