'use client';

// ── ChatInput ─────────────────────────────────────────────────────────────────
// Pinned-to-bottom input bar for the advisor chat.
//
// Auto-resize: resets height to "auto" each render so scrollHeight reflects
// actual content, then applies that value (capped at ~5 lines). Without the
// reset, scrollHeight only ever grows — the textarea never shrinks.
//
// Safe-area padding: pb-[calc(0.75rem+env(safe-area-inset-bottom))] ensures the
// input stays above the iOS home indicator when the soft keyboard is open.

import * as React from 'react';
import { Send, Paperclip, X, FileText, Image } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import type { PendingAttachment } from '../_lib/advisor.types';
import { formatFileSize } from '../_lib/advisor.helpers';

interface ChatInputProps {
  value: string;
  attachments: PendingAttachment[];
  isStreaming: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach: (attachment: PendingAttachment) => void;
  onRemoveAttachment: (id: string) => void;
}

export function ChatInput({
  value,
  attachments,
  isStreaming,
  onChange,
  onSend,
  onAttach,
  onRemoveAttachment,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-resize: reset to "auto" first to get true scrollHeight, then apply.
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter or Enter (without Shift) sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!value.trim() && attachments.length === 0) || isStreaming) return;
    onSend();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const type = file.type.startsWith('image/') ? 'image' : 'pdf';
      onAttach({
        id: crypto.randomUUID(),
        name: file.name,
        type,
        sizeKb: Math.round(file.size / 1024),
      });
    });
    // Reset so the same file can be re-attached
    e.target.value = '';
  };

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isStreaming;

  return (
    // sticky bottom-0 keeps this pinned when the parent is flex-col
    // safe-area-inset-bottom prevents iOS soft keyboard from covering input
    <div className="sticky bottom-0 border-t border-border-subtle bg-bg-elevated px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {/* Pending attachments */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface px-2 py-1.5"
            >
              {att.type === 'image' ? (
                <Image className="size-3.5 text-info" aria-hidden />
              ) : (
                <FileText className="size-3.5 text-error" aria-hidden />
              )}
              <span className="max-w-[120px] truncate text-[11px] text-text-secondary">
                {att.name}
              </span>
              <span className="text-[10px] text-text-disabled">{formatFileSize(att.sizeKb)}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(att.id)}
                className="cursor-pointer text-text-disabled hover:text-text-tertiary transition-colors"
                aria-label={`Remove ${att.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Attach file"
        />

        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-1 flex size-8 cursor-pointer shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-secondary"
          aria-label="Attach file"
        >
          <Paperclip className="size-4" aria-hidden />
        </button>

        {/* Auto-resize textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your financial advisor…"
          rows={1}
          disabled={isStreaming}
          className={cn(
            'flex-1 resize-none bg-transparent text-[13px] text-text-primary placeholder:text-text-disabled outline-none',
            'min-h-[32px] max-h-[120px] py-1',
            isStreaming && 'opacity-50',
          )}
          aria-label="Message"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            'mb-1 flex size-8 cursor-pointer shrink-0 items-center justify-center rounded-lg transition-colors',
            canSend
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-bg-elevated text-text-disabled',
          )}
          aria-label="Send message"
        >
          <Send className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* Hint */}
      <p className="mt-1.5 text-center text-[10px] text-text-disabled">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
