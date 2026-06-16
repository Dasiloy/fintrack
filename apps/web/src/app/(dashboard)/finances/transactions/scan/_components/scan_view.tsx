'use client';

import * as React from 'react';
import { getSession } from 'next-auth/react';
import { fileToBase64 } from '@fintrack/utils/file';
import { useRouter } from '@bprogress/next';
import { X } from 'lucide-react';
import { Button, toast } from '@ui/components';
import { env } from '@/env';
import { api_client } from '@/lib/trpc_app/api_client';
import { format } from '@fintrack/utils/date';
import { PageHeader } from '@/app/_components/page-header';
import { UsageBanner } from '@/app/_components/usage_banner';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { isForcedIncomeCategory } from '@fintrack/types/constants/category.constants';
import { usePlan } from '@/app/providers/plan_usage_provider';

import { ACCEPTED_MIME, MAX_BYTES, type OcrPayload, type Phase } from './scan.types';
import { LeftPanel } from './left_panel';
import { RightPanel } from './right_panel';

export function ScanView() {
  const router = useRouter();
  const plan = usePlan();

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

  // Picking a category (re)defaults the type: forced-income (Income, Savings &
  // Investments) → INCOME (locked in the panel), anything else → EXPENSE.
  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    setType(isForcedIncomeCategory(slug) ? 'INCOME' : 'EXPENSE');
  };
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [dateOpen, setDateOpen] = React.useState(false);

  // ── OCR state ─────────────────────────────────────────────────────────────
  const [draftId, setDraftId] = React.useState<string | null>(null);
  const esRef = React.useRef<EventSource | null>(null);
  const clientTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminalReceivedRef = React.useRef(false);

  // Animated dots while scanning
  const [dotCount, setDotCount] = React.useState(1);
  React.useEffect(() => {
    if (phase !== 'scanning') return;
    const id = setInterval(() => setDotCount((d) => (d % 3) + 1), 480);
    return () => clearInterval(id);
  }, [phase]);

  // Blob URL + EventSource cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      esRef.current?.close();
      if (clientTimerRef.current) clearTimeout(clientTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Queries / mutations ───────────────────────────────────────────────────
  const { data: catData, isLoading: catsLoading } = api_client.category.getAll.useQuery();
  const categories = catData?.data ?? [];

  const utils = api_client.useUtils();
  const uploadMutation = api_client.transaction.uploadReceipt.useMutation();
  const createMutation = api_client.transaction.create.useMutation({
    onSuccess: () => {
      toast.success('Transaction added from receipt');
      utils.transaction.getAll.invalidate();
      utils.transaction.getSummary.invalidate();
      router.push('/finances/transactions');
    },
    onError: (err) => toast.error('Failed to save', { description: err.message }),
  });

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = React.useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    terminalReceivedRef.current = false;
    if (clientTimerRef.current) {
      clearTimeout(clientTimerRef.current);
      clientTimerRef.current = null;
    }
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setDraftId(null);
    setPhase('idle');
    setAmount('');
    setType('EXPENSE');
    setCategorySlug('');
    setMerchant('');
    setDescription('');
    setDate(new Date());
  }, [fileUrl]);

  // ── EventSource ───────────────────────────────────────────────────────────
  const openEventSource = React.useCallback(
    (id: string, token: string) => {
      const es = new EventSource(
        `${env.NEXT_PUBLIC_API_GATEWAY_URL}/api/transaction/draft/${id}/stream?token=${encodeURIComponent(token)}`,
      );
      esRef.current = es;

      clientTimerRef.current = setTimeout(() => {
        es.close();
        esRef.current = null;
        toast.error('Scan timed out', {
          description: 'No response from server. Please try again.',
        });
        reset();
      }, 60_000);

      const clearTimer = () => {
        if (clientTimerRef.current) {
          clearTimeout(clientTimerRef.current);
          clientTimerRef.current = null;
        }
      };

      es.onmessage = (event: MessageEvent<string>) => {
        const payload = JSON.parse(event.data) as OcrPayload;

        if (payload.status === 'COMPLETED') {
          terminalReceivedRef.current = true;
          es.close();
          esRef.current = null;
          clearTimer();
          if (payload.amount != null) setAmount(String(payload.amount));
          if (payload.date) setDate(new Date(payload.date));
          if (payload.merchant) setMerchant(payload.merchant);
          if (payload.description) setDescription(payload.description);
          if (payload.categorySlug) {
            setCategorySlug(payload.categorySlug);
            // Forced-income categories (Income, Savings & Investments) lock type to INCOME.
            if (isForcedIncomeCategory(payload.categorySlug)) setType('INCOME');
          }
          setPhase('done');
        } else if (payload.status === 'FAILED') {
          terminalReceivedRef.current = true;
          es.close();
          esRef.current = null;
          clearTimer();
          toast.error('Scan failed', {
            description: payload.failureReason ?? 'Could not extract receipt data.',
          });
          reset();
        }
      };

      es.onerror = () => {
        // Server closes the connection after sending a terminal event — ignore it
        // if onmessage already handled the result.
        if (terminalReceivedRef.current) return;
        es.close();
        esRef.current = null;
        clearTimer();
        toast.error('Connection lost', { description: 'Failed to receive scan results.' });
        reset();
      };
    },
    [reset],
  );

  // ── File handling ─────────────────────────────────────────────────────────
  const applyFile = async (f: File) => {
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
    setPhase('uploading');

    try {
      const [base64, session] = await Promise.all([fileToBase64(f), getSession()]);
      const token = session?.accessToken ?? '';

      const { draftId: id } = await uploadMutation.mutateAsync({
        feature: Usage.RECEIPT_UPLOADS_PER_MONTH,
        file: base64,
        filename: f.name,
        mimeType: f.type,
      });
      setDraftId(id);
      setPhase('scanning');
      openEventSource(id, token);
    } catch (error) {
      URL.revokeObjectURL(url);
      setFile(null);
      setFileUrl(null);
      setPhase('idle');
      const isForbidden =
        error != null &&
        typeof error === 'object' &&
        'data' in error &&
        (error as { data?: { code?: string } }).data?.code === 'FORBIDDEN';
      if (isForbidden) {
        toast.error('Monthly limit reached', {
          description:
            'You have used all your receipt scans for this month. Upgrade to Pro for unlimited scans.',
        });
      } else {
        toast.error('Upload failed', {
          description: 'Could not upload receipt. Please try again.',
        });
      }
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void applyFile(f);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) void applyFile(f);
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const canSubmit = phase === 'done' && !!draftId && !!amount && !!categorySlug && !!date;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !categorySlug || !amount || !draftId) return;

    createMutation.mutate({
      amount: parseFloat(amount),
      date: format(date, 'YYYY-MM-DD'),
      type,
      source: 'OCR',
      sourceId: draftId,
      categorySlug,
      merchant: merchant || undefined,
      description: description || undefined,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
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

        <UsageBanner
          used={plan?.usage?.[Usage.RECEIPT_UPLOADS_PER_MONTH]?.count ?? 0}
          limit={(plan?.limits?.[Usage.RECEIPT_UPLOADS_PER_MONTH] ?? 10) as number}
          variant="quota"
          label="receipt scans"
          className="mx-6 mt-4"
        />

        <div className="flex flex-1 flex-col px-6 pt-6 pb-6 md:min-h-0 md:overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col md:min-h-0 md:flex-1">
            <div className="glass-card rounded-card border-border-subtle flex flex-col overflow-hidden border md:min-h-0 md:flex-1 md:flex-row">
              {/* Left — upload / preview */}
              <div className="border-border-light flex flex-col p-4 md:min-h-0 md:w-[38%] md:overflow-hidden md:border-r">
                <p className="text-text-secondary mb-3 text-[11px] font-semibold tracking-wider uppercase">
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

              {/* Right — scanner + extracted details */}
              <div className="border-border-light flex flex-col border-t p-4 md:min-h-0 md:flex-1 md:overflow-hidden md:border-t-0">
                <p className="text-text-secondary mb-3 text-[11px] font-semibold tracking-wider uppercase">
                  {phase === 'idle'
                    ? 'Details'
                    : phase === 'uploading'
                      ? 'Uploading…'
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
                  setCategorySlug={handleCategoryChange}
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

            {phase === 'done' && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="text-text-tertiary hover:text-text-secondary gap-1.5"
                >
                  <X className="size-3.5" />
                  Start over
                </Button>
                <Button type="submit" loading={createMutation.isPending} disabled={!canSubmit}>
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
