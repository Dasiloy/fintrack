'use client';

import * as React from 'react';
import { CloudUpload, ImageIcon, RotateCcw } from 'lucide-react';
import { Button } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';

import type { Phase } from './scan.types';

export interface LeftPanelProps {
  phase: Phase;
  file: File | null;
  fileUrl: string | null;
  isDragging: boolean;
  galleryRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onReset: () => void;
}

export function LeftPanel({
  phase,
  file,
  fileUrl,
  isDragging,
  galleryRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onReset,
}: LeftPanelProps) {
  const isPdf = file?.type === 'application/pdf';

  if (phase !== 'idle' && file) {
    return (
      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1">
        <div className="border-border-subtle bg-bg-surface relative h-[200px] overflow-hidden rounded-2xl border md:h-auto md:min-h-0 md:flex-1">
          {isPdf ? (
            <iframe
              src={`${fileUrl ?? ''}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title="PDF preview"
              className="no-scrollbar pointer-events-none h-full w-full border-0"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl ?? ''}
              alt="Uploaded receipt"
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-text-primary truncate text-[12px] font-medium">{file.name}</p>
            <p className="text-text-disabled text-[11px]">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-text-tertiary hover:text-text-primary shrink-0 gap-1.5"
          >
            <RotateCcw className="size-3" />
            Change
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          className="w-full gap-2"
          onClick={() => galleryRef.current?.click()}
        >
          <ImageIcon className="size-3.5" />
          Upload New Receipt
        </Button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload receipt — click or drag a file here"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => galleryRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') galleryRef.current?.click();
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-between rounded-2xl border-2 border-dashed p-5 select-none md:min-h-0 md:flex-1',
        'focus-visible:ring-primary/50 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none',
        isDragging
          ? 'border-primary scale-[1.02] bg-[rgba(124,122,255,0.06)]'
          : 'border-border-subtle hover:border-border-light hover:bg-bg-surface/40',
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div
          className={cn(
            'flex size-14 items-center justify-center rounded-2xl transition-all duration-200',
            isDragging ? 'bg-[rgba(124,122,255,0.15)]' : 'bg-bg-surface',
          )}
        >
          <CloudUpload
            className={cn(
              'size-7 transition-colors duration-200',
              isDragging ? 'text-primary' : 'text-text-tertiary',
            )}
          />
        </div>
        <div>
          <p className="text-text-primary text-[13px] font-semibold">
            {isDragging ? 'Release to upload' : 'Drop receipt here'}
          </p>
          <p className="text-text-tertiary mt-0.5 text-[12px]">or tap to choose</p>
        </div>
        <p className="text-text-disabled text-[11px]">JPEG · PNG · PDF · Max 1 MB</p>
      </div>

      <div className="flex w-full flex-col gap-2 pt-4" onClick={(e) => e.stopPropagation()}>
        <Button
          type="button"
          size="sm"
          className="w-full gap-2"
          onClick={() => galleryRef.current?.click()}
        >
          <ImageIcon className="size-3.5" />
          Choose File
        </Button>
      </div>
    </div>
  );
}
