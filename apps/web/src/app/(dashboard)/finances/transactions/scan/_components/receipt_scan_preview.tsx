'use client';

import * as React from 'react';

import type { Phase } from './scan.types';

const SCAN_BAR_STYLE: React.CSSProperties = {
  height: 3,
  background: [
    'linear-gradient(90deg,',
    'transparent 0%,',
    'rgba(124,122,255,0.25) 8%,',
    'rgba(124,122,255,0.85) 38%,',
    '#fff 50%,',
    'rgba(124,122,255,0.85) 62%,',
    'rgba(124,122,255,0.25) 92%,',
    'transparent 100%)',
  ].join(' '),
  boxShadow: ['0 0 20px 6px rgba(124,122,255,0.4)', '0 0 5px 2px rgba(255,255,255,0.3)'].join(', '),
};

export interface ReceiptScanPreviewProps {
  fileUrl: string | null;
  isPdf: boolean;
  phase: Exclude<Phase, 'idle'>;
  dotCount: number;
}

export function ReceiptScanPreview({ fileUrl, isPdf, phase, dotCount }: ReceiptScanPreviewProps) {
  return (
    <div className="relative h-[180px] overflow-hidden rounded-xl md:h-auto md:min-h-0 md:flex-1">
      {isPdf ? (
        <embed src={fileUrl ?? ''} type="application/pdf" className="h-full w-full" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fileUrl ?? ''}
          alt="Receipt"
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      <div className="absolute inset-0 bg-black/20" />

      {/* ── Uploading overlay ──────────────────────────────────────── */}
      {phase === 'uploading' && (
        <div className="animate-in fade-in-0 duration-300 absolute inset-0">
          {/* Amber shimmer fill */}
          <div className="receipt-upload-shimmer absolute inset-0 bg-amber-400/15" />

          {/* Amber corner marks */}
          <div className="absolute top-2.5 left-2.5 size-5 rounded-tl-[4px] border-t-2 border-l-2 border-amber-400/70" />
          <div className="absolute top-2.5 right-2.5 size-5 rounded-tr-[4px] border-t-2 border-r-2 border-amber-400/70" />
          <div className="absolute bottom-2.5 left-2.5 size-5 rounded-bl-[4px] border-b-2 border-l-2 border-amber-400/70" />
          <div className="absolute right-2.5 bottom-2.5 size-5 rounded-br-[4px] border-b-2 border-r-2 border-amber-400/70" />

          {/* Badge */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
            <span className="relative flex size-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
            </span>
            <span className="text-[11px] font-medium text-white">Uploading receipt…</span>
          </div>
        </div>
      )}

      {/* ── Scanning overlay ───────────────────────────────────────── */}
      {phase === 'scanning' && (
        <div className="animate-in fade-in-0 duration-300 absolute inset-0">
          <div className="receipt-scan-bar absolute right-0 left-0" style={SCAN_BAR_STYLE} />

          <div className="border-primary/70 rounded-tl-card absolute top-2.5 left-2.5 size-5 border-t-2 border-l-2" />
          <div className="border-primary/70 rounded-tr-card absolute top-2.5 right-2.5 size-5 border-t-2 border-r-2" />
          <div className="border-primary/70 rounded-bl-card absolute bottom-2.5 left-2.5 size-5 border-b-2 border-l-2" />
          <div className="border-primary/70 rounded-br-card absolute right-2.5 bottom-2.5 size-5 border-r-2 border-b-2" />

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
            <span className="relative flex size-1.5 shrink-0">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" />
              <span className="bg-primary relative inline-flex size-1.5 rounded-full" />
            </span>
            <span className="text-[11px] font-medium text-white">
              Reading receipt{'.'.repeat(dotCount)}
            </span>
          </div>
        </div>
      )}

      {/* ── Done overlay ───────────────────────────────────────────── */}
      {phase === 'done' && (
        <div className="animate-in fade-in-0 duration-300 absolute inset-0">
          <div className="bg-success/20 absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <span className="bg-success size-1.5 rounded-full" />
            <span className="text-success text-[11px] font-medium">Scan complete</span>
          </div>
        </div>
      )}
    </div>
  );
}
