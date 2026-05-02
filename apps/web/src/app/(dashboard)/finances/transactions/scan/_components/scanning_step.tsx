'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@ui/components';
import { format } from '@fintrack/utils/date';
import type { ExtractedData } from './scan_stepper';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Simulated scan duration in ms — replace this block with real BE polling
// when the OCR endpoint is ready. The BE contract: POST /upload returns
// { draftId }, then poll transaction.getDraft({ draftId }) until status=READY.
const SCAN_DURATION_MS = 3_500;

// ---------------------------------------------------------------------------
// ScanningStep
// ---------------------------------------------------------------------------

interface ScanningStepProps {
  file: File;
  fileUrl: string;
  onComplete: (data: ExtractedData) => void;
  onCancel: () => void;
}

export function ScanningStep({ file, fileUrl, onComplete, onCancel }: ScanningStepProps) {
  const isPdf = file.type === 'application/pdf';

  // Animated "Reading..." dots
  const [dotCount, setDotCount] = React.useState(1);
  React.useEffect(() => {
    const id = setInterval(() => setDotCount((d) => (d % 3) + 1), 480);
    return () => clearInterval(id);
  }, []);

  // Simulate OCR — swap for real polling when BE is ready
  React.useEffect(() => {
    const id = setTimeout(() => {
      onComplete({
        amount: '',
        merchant: '',
        date: format(new Date(), 'YYYY-MM-DD'),
        description: '',
        categorySlug: '',
      });
    }, SCAN_DURATION_MS);
    return () => clearTimeout(id);
  }, [onComplete]);

  return (
    <>
      {/* Inject scan-line keyframes scoped to a unique class */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scan-line-sweep {
            0%   { top: 0px; }
            100% { top: calc(100% - 3px); }
          }
          .receipt-scan-line {
            animation: scan-line-sweep 1.9s ease-in-out infinite alternate;
          }
        `,
      }} />

      <div className="w-full max-w-[360px]">
        <div className="glass-card rounded-card overflow-hidden">

          {/* ── Receipt preview + scan animation ── */}
          <div className="relative overflow-hidden" style={{ height: 300 }}>

            {/* Receipt image or PDF placeholder */}
            {isPdf ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-bg-surface">
                <FileText className="size-14 text-text-disabled" />
                <p className="text-text-tertiary max-w-[220px] truncate text-[13px]">
                  {file.name}
                </p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl}
                alt="Receipt preview"
                className="h-full w-full object-cover"
                draggable={false}
              />
            )}

            {/* Subtle dark overlay so the scan line pops */}
            <div className="absolute inset-0 bg-black/25" />

            {/* Scan line */}
            <div
              className="receipt-scan-line absolute left-0 right-0"
              style={{
                height: 3,
                background: [
                  'linear-gradient(90deg,',
                  'transparent 0%,',
                  'rgba(124,122,255,0.2) 8%,',
                  'rgba(124,122,255,0.8) 35%,',
                  '#ffffff 50%,',
                  'rgba(124,122,255,0.8) 65%,',
                  'rgba(124,122,255,0.2) 92%,',
                  'transparent 100%)',
                ].join(' '),
                boxShadow: [
                  '0 0 18px 6px rgba(124,122,255,0.45)',
                  '0 0 5px 2px rgba(255,255,255,0.35)',
                ].join(', '),
              }}
            />

            {/* Corner viewfinder marks */}
            {(
              [
                'top-3 left-3 border-t-2 border-l-2 rounded-tl',
                'top-3 right-3 border-t-2 border-r-2 rounded-tr',
                'bottom-3 left-3 border-b-2 border-l-2 rounded-bl',
                'bottom-3 right-3 border-b-2 border-r-2 rounded-br',
              ] as const
            ).map((cls) => (
              <div
                key={cls}
                className={`absolute size-5 border-primary/70 ${cls}`}
              />
            ))}
          </div>

          {/* ── Status strip ── */}
          <div className="flex flex-col items-center gap-2.5 px-6 py-5">
            <div className="flex items-center gap-2.5">
              {/* Pulsing dot */}
              <span className="relative flex size-2 shrink-0">
                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                <span className="bg-primary relative inline-flex size-2 rounded-full" />
              </span>
              <p className="text-text-primary text-[14px] font-medium">
                Reading your receipt{'.'.repeat(dotCount)}
              </p>
            </div>
            <p className="text-text-disabled text-[12px]">
              This usually takes a few seconds
            </p>
          </div>
        </div>

        {/* Cancel */}
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-text-tertiary hover:text-text-secondary"
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
