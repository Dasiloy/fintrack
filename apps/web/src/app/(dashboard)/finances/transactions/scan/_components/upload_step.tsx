'use client';

import * as React from 'react';
import { Camera, CloudUpload, ImageIcon } from 'lucide-react';
import { Button, toast } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'application/pdf',
]);

const MAX_BYTES = 1 * 1024 * 1024; // 1 MB

function validate(file: File): string | null {
  if (!ACCEPTED_MIME.has(file.type)) {
    return 'Only images (JPEG, PNG, WebP, GIF, BMP) and PDF files are supported.';
  }
  if (file.size > MAX_BYTES) {
    return `File too large — maximum is 1 MB (yours is ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// UploadStep
// ---------------------------------------------------------------------------

interface UploadStepProps {
  onFileAccepted: (file: File) => void;
}

export function UploadStep({ onFileAccepted }: UploadStepProps) {
  const galleryRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const accept = (file: File) => {
    const err = validate(file);
    if (err) {
      toast.error('File not accepted', { description: err });
      return;
    }
    onFileAccepted(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) accept(f);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // only fire when leaving the zone itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) accept(f);
    e.target.value = ''; // reset so same file can be re-selected
  };

  return (
    <div className="w-full max-w-[440px]">
      {/* Hidden inputs */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={onInputChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={onInputChange}
      />

      {/* Drop zone */}
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
          'glass-card rounded-card cursor-pointer select-none border-2 border-dashed',
          'flex flex-col items-center px-8 py-12 text-center',
          'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isDragging
            ? 'scale-[1.015] border-primary bg-[rgba(124,122,255,0.06)]'
            : 'border-border-subtle hover:border-border-light hover:bg-bg-surface/40',
        )}
      >
        {/* Icon container */}
        <div
          className={cn(
            'mb-5 flex size-[68px] items-center justify-center rounded-2xl transition-all duration-200',
            isDragging ? 'bg-[rgba(124,122,255,0.15)]' : 'bg-bg-surface',
          )}
        >
          <CloudUpload
            className={cn(
              'size-8 transition-colors duration-200',
              isDragging ? 'text-primary' : 'text-text-tertiary',
            )}
          />
        </div>

        {/* Text */}
        <p className="text-text-primary mb-1.5 text-[15px] font-semibold">
          {isDragging ? 'Release to upload' : 'Drop your receipt here'}
        </p>
        <p className="text-text-tertiary mb-7 text-[13px]">
          or choose an option below
        </p>

        {/* Buttons — stop propagation so clicking them doesn't open the gallery input twice */}
        <div
          className="flex flex-col gap-2.5 sm:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="size-3.5" />
            Use Camera
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={() => galleryRef.current?.click()}
          >
            <ImageIcon className="size-3.5" />
            Upload from Gallery
          </Button>
        </div>

        {/* Constraints note */}
        <p className="text-text-disabled mt-7 text-[11px]">
          JPEG · PNG · WebP · PDF&ensp;·&ensp;Max 1 MB&ensp;·&ensp;Single file only
        </p>
      </div>
    </div>
  );
}
