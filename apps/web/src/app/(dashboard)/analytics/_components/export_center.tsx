'use client';

import * as React from 'react';
import {
  FileSpreadsheet,
  FileText,
  ImageIcon,
  BarChart3,
  Target,
  TrendingUp,
  Download,
  Eye,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { downloadFromBase64 } from '@fintrack/utils/file';
import { type ExportPreviewData } from './export_preview.types';
import { ExportPreviewSheet } from './export_preview_sheet';

type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'image';

type ExportDocType =
  | 'transaction-history'
  | 'monthly-summary'
  | 'spending-breakdown'
  | 'budget-performance'
  | 'goal-progress'
  | 'net-worth';

interface ExportDocDef {
  id: ExportDocType;
  title: string;
  description: string;
  bestFor: string;
  icon: LucideIcon;
  iconColor: string;
  formats: ExportFormat[];
  defaultFormat: ExportFormat;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel',
  pdf: 'PDF',
  image: 'Image',
};

const DOCS: ExportDocDef[] = [
  {
    id: 'transaction-history',
    title: 'Transaction History',
    description:
      'Every transaction in the selected time range — date, amount, category, and merchant. One clean row per transaction.',
    bestFor: 'Tax prep, spreadsheet imports, bank reconciliation',
    icon: FileSpreadsheet,
    iconColor: '#30d158',
    formats: ['csv', 'xlsx'],
    defaultFormat: 'csv',
  },
  {
    id: 'monthly-summary',
    title: 'Monthly Summary',
    description:
      'Income vs. expenses per month, savings rate trend, and your financial health score — each metric explained in plain English.',
    bestFor: 'Monthly reviews, sharing with a financial advisor',
    icon: FileText,
    iconColor: '#7c7aff',
    formats: ['pdf'],
    defaultFormat: 'pdf',
  },
  {
    id: 'spending-breakdown',
    title: 'Spending Snapshot',
    description:
      'Your income allocation and net worth trajectory charts as a high-res image, with numbers labelled — no app needed to read it.',
    bestFor: 'Sharing progress, social media, visual snapshots',
    icon: ImageIcon,
    iconColor: '#ff9f0a',
    formats: ['image'],
    defaultFormat: 'image',
  },
  {
    id: 'budget-performance',
    title: 'Budget Performance',
    description:
      'Every budget category next to its limit. Over-budget items flagged in red, under-budget in green, with a total utilisation summary.',
    bestFor: "Reviewing last month before planning next month's budgets",
    icon: BarChart3,
    iconColor: '#ff453a',
    formats: ['pdf', 'xlsx'],
    defaultFormat: 'pdf',
  },
  {
    id: 'goal-progress',
    title: 'Goal Progress',
    description:
      'All active goals with target amount, amount saved, monthly contribution history, projected completion date, and on-track status.',
    bestFor: 'Annual reviews, sharing long-term goal progress',
    icon: Target,
    iconColor: '#30d158',
    formats: ['pdf'],
    defaultFormat: 'pdf',
  },
  {
    id: 'net-worth',
    title: 'Net Worth Statement',
    description:
      'Cumulative income minus expenses month by month — a running balance sheet with a plain-English interpretation of your wealth-building progress.',
    bestFor: 'Financial milestones, tracking wealth over years',
    icon: TrendingUp,
    iconColor: '#7c7aff',
    formats: ['pdf', 'image'],
    defaultFormat: 'pdf',
  },
];

interface CardState {
  format: ExportFormat;
  status: 'idle' | 'previewing' | 'downloading' | 'regenerating';
  previewBase64: string | null;
  previewMimeType: string | null;
  previewFilename: string | null;
  previewGeneratedAt: string | null;
  previewData: ExportPreviewData | null;
  previewOpen: boolean;
}

interface ExportCenterProps {
  months?: number;
}

export function ExportCenter({ months }: ExportCenterProps) {
  const generateMutation = api_client.export.generate.useMutation();

  const [cardState, setCardState] = React.useState<Record<ExportDocType, CardState>>(
    () =>
      Object.fromEntries(
        DOCS.map((d) => [
          d.id,
          {
            format: d.defaultFormat,
            status: 'idle',
            previewBase64: null,
            previewMimeType: null,
            previewFilename: null,
            previewGeneratedAt: null,
            previewData: null,
            previewOpen: false,
          },
        ]),
      ) as Record<ExportDocType, CardState>,
  );

  const setFormat = (id: ExportDocType, format: ExportFormat) =>
    setCardState((prev) => ({ ...prev, [id]: { ...prev[id], format } }));

  const closePreview = (id: ExportDocType) =>
    setCardState((prev) => ({ ...prev, [id]: { ...prev[id], previewOpen: false } }));

  const buildInput = (doc: ExportDocDef, format: ExportFormat, force = false) => {
    const effectiveMonths = months ?? 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - effectiveMonths);
    return {
      type: doc.id,
      format,
      months: effectiveMonths,
      startDate: startDate.toISOString().slice(0, 10),
      force,
    };
  };

  const handlePreview = async (doc: ExportDocDef) => {
    const format = cardState[doc.id]!.format;
    setCardState((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: 'previewing' } }));
    try {
      const res = await generateMutation.mutateAsync(buildInput(doc, format));
      const payload = res.data!;
      setCardState((prev) => ({
        ...prev,
        [doc.id]: {
          ...prev[doc.id],
          status: 'idle',
          previewBase64: payload.bufferBase64,
          previewMimeType: payload.mimeType,
          previewFilename: payload.filename,
          previewGeneratedAt: payload.generatedAt,
          previewData: payload.previewData ?? null,
          previewOpen: true,
        },
      }));
    } catch (err) {
      setCardState((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: 'idle' } }));
      toast.error('Export failed', { description: (err as Error).message });
    }
  };

  const handleDownload = async (doc: ExportDocDef) => {
    const format = cardState[doc.id]!.format;
    setCardState((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: 'downloading' } }));
    try {
      const res = await generateMutation.mutateAsync(buildInput(doc, format));
      const payload = res.data!;
      downloadFromBase64(payload.bufferBase64, payload.filename, payload.mimeType);
    } catch (err) {
      toast.error('Export failed', { description: (err as Error).message });
    } finally {
      setCardState((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: 'idle' } }));
    }
  };

  const handleRegenerate = async (doc: ExportDocDef) => {
    const format = cardState[doc.id]!.format;
    setCardState((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: 'regenerating' } }));
    try {
      const res = await generateMutation.mutateAsync(buildInput(doc, format, true));
      const payload = res.data!;
      setCardState((prev) => ({
        ...prev,
        [doc.id]: {
          ...prev[doc.id],
          status: 'idle',
          previewBase64: payload.bufferBase64,
          previewMimeType: payload.mimeType,
          previewFilename: payload.filename,
          previewGeneratedAt: payload.generatedAt,
          previewData: payload.previewData ?? null,
        },
      }));
    } catch (err) {
      setCardState((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: 'idle' } }));
      toast.error('Regenerate failed', { description: (err as Error).message });
    }
  };

  return (
    <>
      <div className="glass-card rounded-card overflow-hidden">
        {/* Header */}
        <div className="border-b border-border-subtle px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Download className="text-primary size-3.5" />
            </span>
            <div>
              <p className="text-text-primary text-[13px] font-semibold">Export &amp; Download</p>
              <p className="text-text-tertiary text-[11px]">
                Your financial data in formats built for how you actually use it
              </p>
            </div>
          </div>
        </div>

        {/* Document cards grid */}
        <div className="grid grid-cols-1 gap-px bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          {DOCS.map((doc) => {
            const state = cardState[doc.id]!;
            const Icon = doc.icon;
            const isBusy = state.status !== 'idle';

            return (
              <div key={doc.id} className="bg-bg-surface flex flex-col gap-3 p-4">
                {/* Card header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${doc.iconColor}1a` }}
                    >
                      <Icon className="size-4" style={{ color: doc.iconColor }} />
                    </span>
                    <p className="text-text-primary truncate text-[12px] font-semibold leading-tight">
                      {doc.title}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-text-tertiary text-[11px] leading-relaxed">{doc.description}</p>

                {/* Best for */}
                <p className="text-text-disabled text-[10px]">
                  <span className="text-text-tertiary font-medium">Best for:</span> {doc.bestFor}
                </p>

                {/* Format + actions — pinned to bottom */}
                <div className="mt-auto flex flex-col gap-2 pt-1">
                  {/* Format selector */}
                  {doc.formats.length > 1 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-disabled text-[10px]">Format</span>
                      <div className="flex gap-0.5 rounded-md bg-bg-elevated p-0.5">
                        {doc.formats.map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setFormat(doc.id, fmt)}
                            className={cn(
                              'cursor-pointer rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors',
                              state.format === fmt
                                ? 'bg-primary/15 text-primary shadow-sm'
                                : 'text-text-disabled hover:text-text-tertiary',
                            )}
                          >
                            {FORMAT_LABELS[fmt]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-disabled text-[10px]">
                      Format:{' '}
                      <span className="text-text-tertiary font-medium">
                        {FORMAT_LABELS[doc.formats[0]!]}
                      </span>
                    </p>
                  )}

                  {/* Preview + Download buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePreview(doc)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-[11px] font-medium text-text-tertiary transition-colors hover:border-primary/30 hover:text-primary',
                        isBusy && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      {state.status === 'previewing' ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          Loading…
                        </>
                      ) : (
                        <>
                          <Eye className="size-3" />
                          Preview
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDownload(doc)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg border border-primary/25 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/5',
                        isBusy && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      {state.status === 'downloading' ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Download className="size-3" />
                          {FORMAT_LABELS[state.format]}
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-text-disabled text-center text-[9px] leading-tight">
                    Date range limited to 6 months on the free plan
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview sheets — one per card, rendered outside the grid */}
      {DOCS.map((doc) => {
        const state = cardState[doc.id]!;
        if (!state.previewBase64 || !state.previewMimeType || !state.previewFilename) return null;
        return (
          <ExportPreviewSheet
            key={doc.id}
            open={state.previewOpen}
            onClose={() => closePreview(doc.id)}
            base64={state.previewBase64}
            mimeType={state.previewMimeType}
            filename={state.previewFilename}
            generatedAt={state.previewGeneratedAt ?? undefined}
            previewData={state.previewData}
            onRegenerate={() => handleRegenerate(doc)}
            isRegenerating={state.status === 'regenerating'}
          />
        );
      })}
    </>
  );
}
