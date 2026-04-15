'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarIcon,
  CloudUpload,
  ImageIcon,
  RotateCcw,
  ScanLine,
  X,
} from 'lucide-react';
import {
  Button,
  Calendar,
  Field,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { onlyNumbers } from '@fintrack/utils/format';
import { format } from '@fintrack/utils/date';
import { PageHeader } from '@/app/_components/page-header';

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
const MAX_BYTES = 1 * 1024 * 1024;
const SCAN_MS = 3_500; // swap for real BE polling when OCR endpoint is ready
const genSourceId = () => `trnx_${Math.random().toString(36).slice(2, 10)}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'idle' | 'scanning' | 'done';

interface ExtractedData {
  amount: string;
  merchant: string;
  date: string;
  description: string;
  categorySlug: string;
}

// ---------------------------------------------------------------------------
// Left panel — upload zone / file preview
// ---------------------------------------------------------------------------

interface LeftPanelProps {
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

function LeftPanel({
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
    // Show thumbnail + change option
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

        {/* File info + reset */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-text-primary truncate text-[12px] font-medium">{file.name}</p>
            <p className="text-text-disabled text-[11px]">
              {(file.size / 1024).toFixed(0)} KB
            </p>
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

  // Upload zone
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
        'flex cursor-pointer select-none flex-col items-center justify-between rounded-2xl border-2 border-dashed p-5 md:min-h-0 md:flex-1',
        'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        isDragging
          ? 'scale-[1.02] border-primary bg-[rgba(124,122,255,0.06)]'
          : 'border-border-subtle hover:border-border-light hover:bg-bg-surface/40',
      )}
    >
      {/* Icon + text */}
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

      {/* Button */}
      <div
        className="flex w-full flex-col gap-2 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
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

// ---------------------------------------------------------------------------
// Right panel — scan preview + extracted form
// ---------------------------------------------------------------------------

interface RightPanelProps {
  phase: Phase;
  file: File | null;
  fileUrl: string | null;
  dotCount: number;
  // form state
  amount: string;
  setAmount: (v: string) => void;
  type: 'INCOME' | 'EXPENSE';
  setType: (v: 'INCOME' | 'EXPENSE') => void;
  categorySlug: string;
  setCategorySlug: (v: string) => void;
  merchant: string;
  setMerchant: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  dateOpen: boolean;
  setDateOpen: (v: boolean) => void;
  categories: Array<{ slug: string; name: string }>;
  catsLoading: boolean;
}

function RightPanel({
  phase,
  file,
  fileUrl,
  dotCount,
  amount,
  setAmount,
  type,
  setType,
  categorySlug,
  setCategorySlug,
  merchant,
  setMerchant,
  description,
  setDescription,
  date,
  setDate,
  dateOpen,
  setDateOpen,
  categories,
  catsLoading,
}: RightPanelProps) {
  const isPdf = file?.type === 'application/pdf';

  // ── Idle placeholder ──────────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <div className="border-border-subtle flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed md:flex-1 md:min-h-0">
        <div className="bg-bg-surface flex size-14 items-center justify-center rounded-2xl">
          <ScanLine className="text-text-disabled size-7" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-[13px] font-medium">
            Ready to scan
          </p>
          <p className="text-text-disabled mt-0.5 text-[12px]">
            Upload a receipt on the left to get started
          </p>
        </div>
      </div>
    );
  }

  // ── Preview area (shared between scanning + done) ────────────────────────

  const previewArea = (
    <div className="relative h-[180px] overflow-hidden rounded-xl md:h-auto md:min-h-0 md:flex-1">
      {isPdf ? (
        <embed
          src={fileUrl ?? ''}
          type="application/pdf"
          className="h-full w-full"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fileUrl ?? ''}
          alt="Receipt"
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Scan animation — only active while scanning */}
      {phase === 'scanning' && (
        <div
          className="receipt-scan-bar absolute left-0 right-0"
          style={{
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
            boxShadow: [
              '0 0 20px 6px rgba(124,122,255,0.4)',
              '0 0 5px 2px rgba(255,255,255,0.3)',
            ].join(', '),
          }}
        />
      )}

      {/* Corner marks — only while scanning */}
      {phase === 'scanning' && (
        <>
          <div className="border-primary/70 absolute top-2.5 left-2.5 size-5 rounded-tl-card border-t-2 border-l-2" />
          <div className="border-primary/70 absolute top-2.5 right-2.5 size-5 rounded-tr-card border-t-2 border-r-2" />
          <div className="border-primary/70 absolute bottom-2.5 left-2.5 size-5 rounded-bl-card border-b-2 border-l-2" />
          <div className="border-primary/70 absolute bottom-2.5 right-2.5 size-5 rounded-br-card border-b-2 border-r-2" />
        </>
      )}

      {/* Scanning status badge */}
      {phase === 'scanning' && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <span className="relative flex size-1.5 shrink-0">
            <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" />
            <span className="bg-primary relative inline-flex size-1.5 rounded-full" />
          </span>
          <span className="text-[11px] font-medium text-white">
            Reading receipt{'.'.repeat(dotCount)}
          </span>
        </div>
      )}

      {/* Done badge */}
      {phase === 'done' && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-success/20 px-3 py-1.5 backdrop-blur-sm">
          <span className="bg-success size-1.5 rounded-full" />
          <span className="text-success text-[11px] font-medium">Scan complete</span>
        </div>
      )}
    </div>
  );

  // ── Scanning — preview + skeleton form ──────────────────────────────────

  if (phase === 'scanning') {
    return (
      <div className="flex flex-col gap-4 md:min-h-0 md:flex-1">
        {previewArea}
        <div className="no-scrollbar flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // ── Done — preview + editable form ──────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 md:min-h-0 md:flex-1">
      {previewArea}

      {/* Form */}
      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
        {/* Amount + type */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label>Amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(onlyNumbers(e.target.value))}
              required
            />
          </Field>
          <Field>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'INCOME' | 'EXPENSE')}>
              <SelectTrigger size="default" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Category */}
        <Field>
          <Label>Category</Label>
          {catsLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        {/* Date */}
        <Field>
          <Label>Date</Label>
          <AnchoredPopover
            open={dateOpen}
            onOpenChange={setDateOpen}
            modal={false}
            contentClassName="w-auto p-0"
            trigger={
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-text-tertiary',
                )}
              >
                <CalendarIcon className="size-4" />
                {date ? format(date, 'MMMM D, YYYY') : 'Pick a date'}
              </Button>
            }
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setDateOpen(false);
              }}
              defaultMonth={date}
            />
          </AnchoredPopover>
        </Field>

        {/* Merchant */}
        <Field>
          <Label>Merchant</Label>
          <Input
            placeholder="e.g. Shoprite, Netflix"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </Field>

        {/* Description */}
        <Field>
          <Label>Description</Label>
          <Input
            placeholder="Optional note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScanView — main export
// ---------------------------------------------------------------------------

export function ScanView() {
  const router = useRouter();

  // ── File state ────────────────────────────────────────────────────────────
  const galleryRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const [phase, setPhase] = React.useState<Phase>('idle');
  const [file, setFile] = React.useState<File | null>(null);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [amount, setAmount] = React.useState('');
  const [type, setType] = React.useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [categorySlug, setCategorySlug] = React.useState('');
  const [merchant, setMerchant] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [dateOpen, setDateOpen] = React.useState(false);

  // Animated dots while scanning
  const [dotCount, setDotCount] = React.useState(1);
  React.useEffect(() => {
    if (phase !== 'scanning') return;
    const id = setInterval(() => setDotCount((d) => (d % 3) + 1), 480);
    return () => clearInterval(id);
  }, [phase]);

  // Blob URL cleanup
  React.useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  // ── Queries / mutations ──────────────────────────────────────────────────
  const { data: catData, isLoading: catsLoading } = api_client.category.getAll.useQuery();
  const categories = catData?.data ?? [];

  const utils = api_client.useUtils();
  const createMutation = api_client.transaction.create.useMutation({
    onSuccess: () => {
      toast.success('Transaction added from receipt');
      utils.transaction.getAll.invalidate();
      router.push('/finances/transactions');
    },
    onError: (err) => toast.error('Failed to save', { description: err.message }),
  });

  // ── File handling ────────────────────────────────────────────────────────
  const applyFile = (f: File) => {
    if (!ACCEPTED_MIME.has(f.type)) {
      toast.error('File not accepted', {
        description: 'Only images (JPEG, PNG, WebP, GIF) and PDF files are supported.',
      });
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error('File too large', {
        description: `Maximum is 1 MB — yours is ${(f.size / 1024 / 1024).toFixed(1)} MB.`,
      });
      return;
    }

    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setFileUrl(url);
    setPhase('scanning');

    // Simulate OCR — replace with real BE polling when endpoint is ready
    setTimeout(() => {
      setPhase('done');
      // Pre-fill date with today; amount/merchant/category come from OCR response
      setDate(new Date());
    }, SCAN_MS);
  };

  const reset = React.useCallback(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setPhase('idle');
    setAmount('');
    setType('EXPENSE');
    setCategorySlug('');
    setMerchant('');
    setDescription('');
    setDate(new Date());
  }, [fileUrl]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) applyFile(f);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Element | null)) {
      setIsDragging(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const canSubmit = phase === 'done' && !!amount && !!categorySlug && !!date;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !categorySlug || !amount) return;

    createMutation.mutate({
      amount: parseFloat(amount),
      date: format(date, 'YYYY-MM-DD'),
      type,
      source: 'MANUAL',
      sourceId: genSourceId(),
      categorySlug,
      merchant: merchant || undefined,
      description: description || undefined,
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Scan-line animation keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scan-bar-sweep {
            0%   { top: 0px; }
            100% { top: calc(100% - 3px); }
          }
          .receipt-scan-bar {
            animation: scan-bar-sweep 1.9s ease-in-out infinite alternate;
          }
        `,
      }} />

      {/* Hidden file input — on mobile the OS sheet offers Camera / Gallery / Files */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={onInputChange}
      />

      <div className="flex flex-col overflow-auto md:h-dvh md:overflow-hidden">
        <PageHeader
          breadcrumbs={[
            { label: 'Transactions', href: '/finances/transactions' },
            { label: 'Scan Receipt' },
          ]}
        />

        <div className="flex flex-1 flex-col px-6 pb-6 pt-6 md:min-h-0 md:overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col md:min-h-0 md:flex-1">
            {/* Main card */}
            <div className="glass-card rounded-card border-border-subtle flex flex-col overflow-hidden border md:min-h-0 md:flex-1 md:flex-row">

              {/* Left — upload / preview */}
              <div className="border-border-subtle flex flex-col p-4 md:min-h-0 md:w-[38%] md:overflow-hidden md:border-r">
                <p className="text-text-secondary mb-3 text-[11px] font-semibold uppercase tracking-wider">
                  Receipt
                </p>
                <LeftPanel
                  phase={phase}
                  file={file}
                  fileUrl={fileUrl}
                  isDragging={isDragging}
                  galleryRef={galleryRef}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onReset={reset}
                />
              </div>

              {/* Right — scanner + extracted details (stacks below on mobile) */}
              <div className="border-border-subtle flex flex-col border-t p-4 md:min-h-0 md:flex-1 md:border-t-0 md:overflow-hidden">
                <p className="text-text-secondary mb-3 text-[11px] font-semibold uppercase tracking-wider">
                  {phase === 'idle'
                    ? 'Details'
                    : phase === 'scanning'
                      ? 'Scanning…'
                      : 'Extracted Details'}
                </p>
                <RightPanel
                  phase={phase}
                  file={file}
                  fileUrl={fileUrl}
                  dotCount={dotCount}
                  amount={amount}
                  setAmount={setAmount}
                  type={type}
                  setType={setType}
                  categorySlug={categorySlug}
                  setCategorySlug={setCategorySlug}
                  merchant={merchant}
                  setMerchant={setMerchant}
                  description={description}
                  setDescription={setDescription}
                  date={date}
                  setDate={setDate}
                  dateOpen={dateOpen}
                  setDateOpen={setDateOpen}
                  categories={categories}
                  catsLoading={catsLoading}
                />
              </div>
            </div>

            {/* Footer actions */}
            {phase === 'done' && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="text-text-tertiary gap-1.5 hover:text-text-secondary"
                >
                  <X className="size-3.5" />
                  Start over
                </Button>
                <Button
                  type="submit"
                  loading={createMutation.isPending}
                  disabled={!canSubmit}
                >
                  Add Transaction
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
