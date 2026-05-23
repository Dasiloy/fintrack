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
  Lock,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@ui/lib/utils/cn';
import { useProGate } from '@/hooks/use_pro_gate';
import { ProGateModal } from '@/app/_components/pro_gate_modal';
import { Usage } from '@fintrack/types/constants/plan.constants';

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
  proOnly: boolean;
  freeNote?: string;
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
    proOnly: true,
  },
  {
    id: 'monthly-summary',
    title: 'Monthly Summary',
    description:
      'Income vs. expenses per month, savings rate trend, and your financial health score — each metric explained in plain English. Reads like a personal finance newsletter.',
    bestFor: 'Monthly reviews, sharing with a financial advisor',
    icon: FileText,
    iconColor: '#7c7aff',
    formats: ['pdf'],
    defaultFormat: 'pdf',
    proOnly: true,
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
    proOnly: true,
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
    proOnly: true,
  },
  {
    id: 'goal-progress',
    title: 'Goal Progress',
    description:
      'All active goals with target amount, amount saved, monthly contribution history, projected completion date, and on-track status — in plain terms.',
    bestFor: 'Annual reviews, sharing long-term goal progress',
    icon: Target,
    iconColor: '#30d158',
    formats: ['pdf'],
    defaultFormat: 'pdf',
    proOnly: true,
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
    proOnly: true,
  },
];

interface CardState {
  format: ExportFormat;
  status: 'idle' | 'loading';
}

interface ExportCenterProps {
  months?: number;
  isProUser: boolean;
}

export function ExportCenter({ isProUser }: ExportCenterProps) {
  const proGate = useProGate(Usage.PDF_REPORTS);

  const [cardState, setCardState] = React.useState<Record<ExportDocType, CardState>>(
    () =>
      Object.fromEntries(DOCS.map((d) => [d.id, { format: d.defaultFormat, status: 'idle' }])) as Record<
        ExportDocType,
        CardState
      >,
  );

  const setFormat = (id: ExportDocType, format: ExportFormat) =>
    setCardState((prev) => ({ ...prev, [id]: { ...prev[id], format } }));

  const handleDownload = (doc: ExportDocDef) => {
    if (doc.proOnly && !isProUser) {
      proGate.openModal();
      return;
    }
    // Backend generation is wired up in the next sprint.
    // Show a brief loading state so the interaction feels complete.
    setCardState((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: 'loading' } }));
    setTimeout(
      () => setCardState((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: 'idle' } })),
      900,
    );
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

        {/* Document cards grid — 1 col mobile, 2 col sm, 3 col lg */}
        <div className="grid grid-cols-1 gap-px bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          {DOCS.map((doc) => {
            const state = cardState[doc.id];
            const isLocked = doc.proOnly && !isProUser;
            const Icon = doc.icon;

            return (
              <div
                key={doc.id}
                className={cn(
                  'bg-bg-surface flex flex-col gap-3 p-4 transition-opacity',
                  isLocked && 'opacity-60',
                )}
              >
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
                  {doc.proOnly ? (
                    <span className="bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                      Pro
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#30d158] [background:rgba(48,209,88,0.1)]">
                      Free
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-text-tertiary text-[11px] leading-relaxed">{doc.description}</p>

                {/* Best for */}
                <p className="text-text-disabled text-[10px]">
                  <span className="text-text-tertiary font-medium">Best for:</span> {doc.bestFor}
                </p>

                {/* Format + download — pinned to bottom */}
                <div className="mt-auto flex flex-col gap-2 pt-1">
                  {/* Format selector — only shown when more than one format */}
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
                      <span className="text-text-tertiary font-medium">{FORMAT_LABELS[doc.formats[0]!]}</span>
                    </p>
                  )}

                  {/* Download button */}
                  <button
                    type="button"
                    disabled={state.status === 'loading'}
                    onClick={() => handleDownload(doc)}
                    className={cn(
                      'flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors',
                      isLocked
                        ? 'border-border-subtle text-text-tertiary cursor-pointer'
                        : 'border-primary/25 text-primary hover:bg-primary/5',
                      state.status === 'loading' && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {state.status === 'loading' ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        Preparing…
                      </>
                    ) : isLocked ? (
                      <>
                        <Lock className="size-3 opacity-60" />
                        Unlock with Pro
                      </>
                    ) : (
                      <>
                        <Download className="size-3" />
                        Download {FORMAT_LABELS[state.format]}
                      </>
                    )}
                  </button>

                  {/* Free-tier note shown only on the free card for non-pro users */}
                  {doc.freeNote && !isProUser && (
                    <p className="text-text-disabled text-center text-[9px] leading-tight">{doc.freeNote}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ProGateModal feature={Usage.PDF_REPORTS} open={proGate.open} onClose={proGate.onClose} />
    </>
  );
}
