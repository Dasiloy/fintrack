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
// Markdown-subset renderer for advisor replies. Supports the small set of
// Markdown the advisor is prompted to use, styled for easy reading:
//   - ### headings, "- " bullet lists, "1." numbered lists, paragraphs
//   - **bold** (accent colour — the "this matters" highlight), *italic*, `code`
//   - ₦ amounts emphasised so figures pop
// Deliberately not a full Markdown engine (no tables/code-blocks) — the prompt
// keeps output within this subset.

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'bullet'; items: string[] }
  | { kind: 'numbered'; items: string[] }
  | { kind: 'para'; lines: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;

  for (const rawLine of text.split('\n')) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      current = null; // blank line ends the current block
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      blocks.push({ kind: 'heading', text: trimmed.replace(/^#{1,6}\s+/, '') });
      current = null;
    } else if (/^[-*]\s+/.test(trimmed)) {
      if (current?.kind !== 'bullet') {
        current = { kind: 'bullet', items: [] };
        blocks.push(current);
      }
      current.items.push(trimmed.replace(/^[-*]\s+/, ''));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (current?.kind !== 'numbered') {
        current = { kind: 'numbered', items: [] };
        blocks.push(current);
      }
      current.items.push(trimmed.replace(/^\d+\.\s+/, ''));
    } else {
      if (current?.kind !== 'para') {
        current = { kind: 'para', lines: [] };
        blocks.push(current);
      }
      current.lines.push(trimmed);
    }
  }

  return blocks;
}

function RichText({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <>
      {blocks.map((block, bi) => {
        const spacing = bi > 0 ? 'mt-2' : '';
        switch (block.kind) {
          case 'heading':
            return (
              <p
                key={bi}
                className={cn(
                  'text-text-primary text-[13px] font-semibold',
                  bi > 0 && 'mt-3',
                )}
              >
                {renderInline(block.text)}
              </p>
            );
          case 'bullet':
            return (
              <ul key={bi} className={cn('space-y-1', spacing)}>
                {block.items.map((item, ii) => (
                  <li key={ii} className="flex gap-2">
                    <span className="bg-text-disabled mt-[7px] size-1 shrink-0 rounded-full" />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'numbered':
            return (
              <ol key={bi} className={cn('space-y-1', spacing)}>
                {block.items.map((item, ii) => (
                  <li key={ii} className="flex gap-2">
                    <span className="text-text-tertiary shrink-0 tabular-nums">
                      {ii + 1}.
                    </span>
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={bi} className={spacing}>
                {block.lines.map((line, li) => (
                  <React.Fragment key={li}>
                    {li > 0 && <br />}
                    {renderInline(line)}
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </>
  );
}

// Inline tokens, rendered in the advisor's semantic colours:
//   **bold**     → accent (the single "this matters" highlight)
//   ++positive++ → success colour (a win, on track, money saved)
//   ==caution==  → warning colour (over budget, behind, a risk)
//   `code`, *italic*
// Plain runs get ₦ amounts emphasised. A coloured span is left uniform (no
// nested amount highlighting), so its colour reads cleanly. Order matters —
// `**` is matched before `*`.
function renderInline(text: string): React.ReactNode {
  const parts = text.split(
    /(\*\*[^*]+\*\*|\+\+[^+]+\+\+|==[^=]+==|`[^`]+`|\*[^*\n]+\*)/g,
  );

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-primary font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('++') && part.endsWith('++')) {
      return (
        <strong key={i} className="text-success font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('==') && part.endsWith('==')) {
      return (
        <strong key={i} className="text-warning font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="bg-bg-elevated text-text-primary rounded px-1 py-0.5 font-mono text-[12px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{highlightAmounts(part, i)}</React.Fragment>;
  });
}

// Emphasises Naira amounts (e.g. ₦12,500) so figures stand out in body text.
function highlightAmounts(text: string, keyPrefix: number): React.ReactNode {
  const parts = text.split(/(₦[\d,]+(?:\.\d+)?)/g);
  return parts.map((part, i) =>
    /^₦[\d,]/.test(part) ? (
      <span key={`${keyPrefix}-${i}`} className="text-text-primary font-semibold">
        {part}
      </span>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    ),
  );
}
