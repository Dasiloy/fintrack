'use client';

// ── ChatFileAttachment ────────────────────────────────────────────────────────
// Renders a generated file card (PDF or CSV) inside a chat message.
// Download href is a stub — real implementation will hit a signed S3 URL.

import * as React from 'react';
import { FileText, Download, Sheet } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { formatFileSize } from '../_lib/advisor.helpers';
import type { GeneratedFile } from '../_lib/advisor.types';

interface ChatFileAttachmentProps {
  file: GeneratedFile;
}

export function ChatFileAttachment({ file }: ChatFileAttachmentProps) {
  const isPdf = file.type === 'pdf';

  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className={cn(
        'group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
        isPdf
          ? 'border-error/20 bg-error/5 hover:bg-error/10'
          : 'border-success/20 bg-success/5 hover:bg-success/10',
      )}
      aria-label={`Download ${file.name}`}
    >
      {/* File type icon */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          isPdf ? 'bg-error/10' : 'bg-success/10',
        )}
      >
        {isPdf ? (
          <FileText className={cn('size-4', isPdf ? 'text-error' : 'text-success')} aria-hidden />
        ) : (
          <Sheet className="size-4 text-success" aria-hidden />
        )}
      </div>

      {/* File name + size */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[12px] font-medium text-text-primary">{file.name}</span>
        <span className="text-[10px] text-text-disabled">
          {file.type.toUpperCase()} · {formatFileSize(file.sizeKb)}
        </span>
      </div>

      {/* Download icon */}
      <Download
        className="size-3.5 shrink-0 text-text-disabled transition-colors group-hover:text-text-tertiary"
        aria-hidden
      />
    </a>
  );
}
