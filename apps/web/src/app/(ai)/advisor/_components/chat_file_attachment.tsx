'use client';

// ── ChatFileAttachment ────────────────────────────────────────────────────────
// Compact attachment card inside a chat message. Clicking opens a short-lived
// signed URL in a new tab.

import * as React from 'react';
import { FileText, Download, Sheet, Image, Loader2 } from 'lucide-react';
import { toast } from '@ui/components';
import { cn } from '@ui/lib/utils';
import { formatFileSize } from '../_lib/advisor.helpers';
import type { GeneratedFile } from '../_lib/advisor.types';
import { api_client } from '@/lib/trpc_app/api_client';

interface ChatFileAttachmentProps {
  file: GeneratedFile;
}

export function ChatFileAttachment({ file }: ChatFileAttachmentProps) {
  const isPdf = file.kind === 'pdf';
  const isImage = file.kind === 'image';
  const viewMutation = api_client.advisor.getAttachmentUrl.useMutation({
    onSuccess(data) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    },
    onError() {
      toast.error('Could not open attachment');
    },
  });

  const openAttachment = async () => {
    if (viewMutation.isPending) return;
    viewMutation.mutateAsync({
      publicId: file.publicId,
      format: file.format,
    });
  };

  return (
    <button
      type="button"
      onClick={openAttachment}
      disabled={viewMutation.isPending}
      className={cn(
        'group bg-bg-elevated hover:bg-bg-surface-hover/20 flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-left shadow-[0_4px_14px_rgba(15,23,42,0.06)] transition-colors',
        viewMutation.isPending && 'cursor-wait opacity-70',
      )}
      aria-label={`Open ${file.name}`}
    >
      {/* File type icon */}
      <div
        className={cn(
          'bg-bg-surface flex size-7 shrink-0 items-center justify-center rounded-lg',
          isPdf || isImage ? 'bg-error/10' : 'bg-success/10',
        )}
      >
        {isImage ? (
          <Image className="text-error size-4" aria-hidden />
        ) : isPdf ? (
          <FileText className="text-error size-4" aria-hidden />
        ) : (
          <Sheet className="text-success size-4" aria-hidden />
        )}
      </div>

      {/* File name + size */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-text-primary truncate text-[11px] font-medium">{file.name}</span>
        <span className="text-text-disabled text-[9px]">
          {file.kind.toUpperCase()} · {formatFileSize(Math.round(file.sizeBytes / 1024))}
        </span>
      </div>

      {viewMutation.isPending ? (
        <Loader2 className="text-primary size-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Download
          className="text-text-disabled group-hover:text-text-tertiary size-3.5 shrink-0 transition-colors"
          aria-hidden
        />
      )}
    </button>
  );
}
