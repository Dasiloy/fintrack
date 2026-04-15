'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@ui/lib/utils/cn';
import { PageHeader } from '@/app/_components/page-header';

// steps
import { UploadStep } from './upload_step';
import { ScanningStep } from './scanning_step';
import { ReviewStep } from './review_step';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedData {
  amount: string;
  merchant: string;
  date: string;
  description: string;
  categorySlug: string;
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

type ScanStep = 'upload' | 'scanning' | 'review';

const STEPS: { key: ScanStep; label: string; n: number }[] = [
  { key: 'upload', label: 'Upload', n: 1 },
  { key: 'scanning', label: 'Scan', n: 2 },
  { key: 'review', label: 'Review', n: 3 },
];

function StepIndicator({ current }: { current: ScanStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-[12px] font-semibold transition-all duration-300',
                  done
                    ? 'bg-primary text-white'
                    : active
                      ? 'border-primary border bg-[rgba(124,122,255,0.1)] text-[#7C7AFF]'
                      : 'border-border-subtle bg-bg-surface text-text-disabled border',
                )}
              >
                {done ? <Check className="size-3.5" /> : s.n}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium',
                  active ? 'text-primary' : done ? 'text-text-secondary' : 'text-text-disabled',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2.5 mb-5 h-px w-10 transition-colors duration-300',
                  i < currentIdx ? 'bg-primary' : 'bg-border-subtle',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScanStepper
// ---------------------------------------------------------------------------

const EMPTY_EXTRACTED: ExtractedData = {
  amount: '',
  merchant: '',
  date: '',
  description: '',
  categorySlug: '',
};

export function ScanStepper() {
  const router = useRouter();
  const [step, setStep] = React.useState<ScanStep>('upload');
  const [file, setFile] = React.useState<File | null>(null);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [extracted, setExtracted] = React.useState<ExtractedData>(EMPTY_EXTRACTED);

  // Revoke blob URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const handleFileAccepted = (accepted: File) => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(accepted);
    setFile(accepted);
    setFileUrl(url);
    setStep('scanning');
  };

  const handleScanComplete = (data: ExtractedData) => {
    setExtracted(data);
    setStep('review');
  };

  const handleStartOver = React.useCallback(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setExtracted(EMPTY_EXTRACTED);
    setStep('upload');
  }, [fileUrl]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: 'Transactions', href: '/finances/transactions' },
          { label: 'Scan Receipt' },
        ]}
      />

      <div className="flex flex-1 flex-col overflow-auto px-6 pt-6 pb-8">
        {/* Step indicator */}
        <div className="mb-8 flex justify-center">
          <StepIndicator current={step} />
        </div>

        {/* Active step */}
        <div className="flex flex-1 flex-col items-center">
          {step === 'upload' && <UploadStep onFileAccepted={handleFileAccepted} />}

          {step === 'scanning' && file !== null && fileUrl !== null && (
            <ScanningStep
              file={file}
              fileUrl={fileUrl}
              onComplete={handleScanComplete}
              onCancel={handleStartOver}
            />
          )}

          {step === 'review' && (
            <ReviewStep
              initialData={extracted}
              onSuccess={() => router.push('/finances/transactions')}
              onStartOver={handleStartOver}
            />
          )}
        </div>
      </div>
    </div>
  );
}
