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
import {
  Send,
  Square,
  X,
  FileText,
  Image,
  Sheet,
  RotateCcw,
  Loader2,
  Plus,
  Upload,
  WandSparkles,
  CircleAlert,
} from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { AdvisorWorkflowTools } from './advisor_workflow_tools';
import type { AdvisorWorkflowTool } from './advisor_workflow_tools';
import { AdvisorWorkflowDialog } from './advisor_workflow_dialog';
import type { AdvisorWorkflowSubmission } from './advisor_workflow_dialog';
import type {
  FailedPendingAttachment,
  PendingAttachment,
  UploadingPendingAttachment,
} from '../_lib/advisor.types';
import { formatFileSize } from '../_lib/advisor.helpers';

interface ChatInputProps {
  value: string;
  attachments: PendingAttachment[];
  uploadingAttachments: UploadingPendingAttachment[];
  failedAttachments: FailedPendingAttachment[];
  streamError: string | null;
  isStreaming: boolean;
  isUploading: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Stop the in-flight stream. When provided, the send button becomes a stop
   *  button while streaming. */
  onStop?: () => void;
  onAttach: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onRetryFailedAttachment: (id: string) => void;
  onRemoveFailedAttachment: (id: string) => void;
  onDismissStreamError: () => void;
  onWorkflowSelect?: (submission: AdvisorWorkflowSubmission) => void;
}

export function ChatInput({
  value,
  attachments,
  uploadingAttachments,
  failedAttachments,
  streamError,
  isStreaming,
  isUploading,
  onChange,
  onSend,
  onStop,
  onAttach,
  onRemoveAttachment,
  onRetryFailedAttachment,
  onRemoveFailedAttachment,
  onDismissStreamError,
  onWorkflowSelect,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const isBusy = isStreaming || isUploading;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [workflowOpen, setWorkflowOpen] = React.useState(false);
  const [selectedWorkflow, setSelectedWorkflow] =
    React.useState<AdvisorWorkflowTool | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = React.useState(false);

  // Auto-resize: reset to "auto" first to get true scrollHeight, then apply.
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  React.useEffect(() => {
    if (!menuOpen && !workflowOpen) return;

    const closeIfOutside = (event: Event) => {
      const root = menuRef.current;
      if (!root) return;

      const path = event.composedPath?.() ?? [];
      const target = event.target as Node | null;
      const isInside = path.includes(root) || (target ? root.contains(target) : false);

      if (!isInside) {
        setMenuOpen(false);
        setWorkflowOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setWorkflowOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeIfOutside, true);
    document.addEventListener('mousedown', closeIfOutside, true);
    document.addEventListener('touchstart', closeIfOutside, true);
    document.addEventListener('click', closeIfOutside, true);
    window.addEventListener('pointerdown', closeIfOutside, true);
    window.addEventListener('click', closeIfOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside, true);
      document.removeEventListener('mousedown', closeIfOutside, true);
      document.removeEventListener('touchstart', closeIfOutside, true);
      document.removeEventListener('click', closeIfOutside, true);
      window.removeEventListener('pointerdown', closeIfOutside, true);
      window.removeEventListener('click', closeIfOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [menuOpen, workflowOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter or Enter (without Shift) sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!value.trim() && attachments.length === 0) || isBusy) return;
    onSend();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onAttach(files);
    // Reset so the same file can be re-attached
    e.target.value = '';
  };

  const handleUploadClick = () => {
    setMenuOpen(false);
    setWorkflowOpen(false);
    fileInputRef.current?.click();
  };

  const handleWorkflowToolSelect = (workflow: AdvisorWorkflowTool) => {
    setSelectedWorkflow(workflow);
    setWorkflowDialogOpen(true);
    setMenuOpen(false);
    setWorkflowOpen(false);
  };

  const handleWorkflowPrompt = (submission: AdvisorWorkflowSubmission) => {
    onWorkflowSelect?.(submission);
  };

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isBusy;

  return (
    // sticky bottom-0 keeps this pinned when the parent is flex-col
    // safe-area-inset-bottom prevents iOS soft keyboard from covering input
    <div
      ref={menuRef}
      className="sticky bottom-0 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      {/* Pending attachments */}
      {(attachments.length > 0 ||
        uploadingAttachments.length > 0 ||
        failedAttachments.length > 0) && (
        <div className="mx-auto mb-2 flex max-w-4xl flex-wrap gap-1.5">
          {uploadingAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface/70 px-2 py-1.5 opacity-75"
            >
              <Loader2
                className="text-primary size-3.5 animate-spin"
                aria-hidden
              />
              <span className="max-w-[120px] truncate text-[11px] text-text-secondary">
                {att.name}
              </span>
              <span className="text-[10px] text-text-disabled">
                Uploading
              </span>
            </div>
          ))}
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface px-2 py-1.5"
            >
              {att.kind === 'image' ? (
                <Image className="size-3.5 text-info" aria-hidden />
              ) : att.kind === 'excel' || att.kind === 'csv' ? (
                <Sheet className="size-3.5 text-success" aria-hidden />
              ) : (
                <FileText className="size-3.5 text-error" aria-hidden />
              )}
              <span className="max-w-[120px] truncate text-[11px] text-text-secondary">
                {att.name}
              </span>
              <span className="text-[10px] text-text-disabled">
                {formatFileSize(Math.round(att.sizeBytes / 1024))}
              </span>
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
          {failedAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 rounded-lg border border-error/30 bg-error/5 px-2 py-1.5"
            >
              <FileText className="size-3.5 text-error" aria-hidden />
              <span
                className="max-w-[120px] truncate text-[11px] text-text-secondary"
                title={att.reason}
              >
                {att.name}
              </span>
              <span className="text-[10px] text-error">Failed</span>
              <button
                type="button"
                onClick={() => onRetryFailedAttachment(att.id)}
                disabled={isBusy}
                className="cursor-pointer text-text-disabled transition-colors hover:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Retry ${att.name}`}
              >
                <RotateCcw className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveFailedAttachment(att.id)}
                className="cursor-pointer text-text-disabled transition-colors hover:text-text-tertiary"
                aria-label={`Remove ${att.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {streamError && (
        <div className="mx-auto flex max-w-4xl items-start gap-2 rounded-t-2xl border border-error/25 border-b-0 bg-error/10 px-3 py-2 text-error shadow-sm">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 text-[11px] leading-4">{streamError}</p>
          <button
            type="button"
            onClick={onDismissStreamError}
            className="text-error/70 hover:text-error flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
            aria-label="Dismiss advisor error"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}

      {(menuOpen || workflowOpen) && (
        <div className="absolute inset-x-3 bottom-[calc(100%-0.25rem)] z-20 mx-auto flex max-w-4xl justify-start pl-1">
          {workflowOpen ? (
            <div className="w-fit max-w-[calc(100vw-2rem)]">
              <AdvisorWorkflowTools
                variant="panel"
                disabled={isBusy}
                onSelect={handleWorkflowToolSelect}
              />
            </div>
          ) : (
            <div className="w-[210px] rounded-2xl bg-bg-surface/35 p-1.5 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.45)] ring-1 ring-border-subtle/60 backdrop-blur-md">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isBusy}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload className="size-3.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[12px] font-semibold text-text-primary">
                    Upload
                  </span>
                  <span className="block text-[10px] text-text-tertiary">
                    Files and documents
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setWorkflowOpen(true);
                }}
                disabled={isBusy || !onWorkflowSelect}
                className="mt-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <WandSparkles className="size-3.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[12px] font-semibold text-text-primary">
                    Workflow
                  </span>
                  <span className="block text-[10px] text-text-tertiary">
                    Guided review
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input row */}
      <div
        className={cn(
          'mx-auto flex max-w-4xl items-center gap-2 bg-bg-surface px-3 py-2 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.8)] ring-1 ring-border-subtle',
          streamError ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl',
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,application/pdf,text/csv,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
          multiple
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Attach file"
        />

        {/* Action button */}
        <button
          type="button"
          onClick={() => {
            setWorkflowOpen(false);
            setMenuOpen((open) => !open);
          }}
          disabled={isBusy}
          className={cn(
            'flex size-9 cursor-pointer shrink-0 items-center justify-center rounded-xl text-text-tertiary transition-all hover:bg-bg-elevated hover:text-text-secondary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
            (menuOpen || workflowOpen) && 'bg-bg-elevated text-primary',
          )}
          aria-label="Open advisor actions"
          aria-expanded={menuOpen || workflowOpen}
        >
          <Plus
            className={cn(
              'size-4 transition-transform duration-200',
              (menuOpen || workflowOpen) && 'rotate-45',
            )}
            aria-hidden
          />
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
            'min-h-[36px] max-h-[120px] py-2 leading-5',
            isStreaming && 'opacity-50',
          )}
          aria-label="Message"
        />

        {/* Send / Stop button — becomes Stop while streaming (if onStop given). */}
        {isStreaming && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary/90"
            aria-label="Stop generating"
          >
            <Square className="size-3 fill-current" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'flex size-10 cursor-pointer shrink-0 items-center justify-center rounded-xl transition-all active:scale-[0.98]',
              canSend
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-bg-elevated text-text-disabled',
            )}
            aria-label="Send message"
          >
            <Send className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* Hint */}
      <p className="mt-1.5 text-center text-[10px] text-text-disabled">
        Press Enter to send · Shift+Enter for new line
      </p>

      <AdvisorWorkflowDialog
        workflow={selectedWorkflow}
        open={workflowDialogOpen}
        onOpenChange={setWorkflowDialogOpen}
        onSubmit={handleWorkflowPrompt}
      />
    </div>
  );
}
