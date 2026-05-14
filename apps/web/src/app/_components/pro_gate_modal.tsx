'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  BrainCircuit,
  FileDown,
  FileText,
  Lock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Button, Dialog, DialogContent } from '@ui/components';
import { Usage } from '@fintrack/types/constants/plan.constants';

// ── Feature config ────────────────────────────────────────────────────────────

interface FeatureConfig {
  title: string;
  description: string;
  icon: React.ElementType;
  imageSrc?: string;
}

const FEATURE_CONFIG: Partial<Record<Usage, FeatureConfig>> = {
  [Usage.CSV_EXPORT]: {
    title: 'Export Your Data',
    description:
      'Download your financial data as a CSV — perfect for tax prep, record-keeping, or sharing with your accountant.',
    icon: FileDown,
  },
  [Usage.PDF_REPORTS]: {
    title: 'PDF Reports',
    description:
      'Generate beautiful PDF summaries of your spending patterns and financial activity, ready to print or share.',
    icon: FileText,
  },
  [Usage.AI_INSIGHTS_QUERIES_PER_MONTH]: {
    title: 'AI Insights',
    description:
      'Unlock personalised spending forecasts, intelligent anomaly detection, and AI-powered financial guidance to optimise your money.',
    icon: BrainCircuit,
  },
  [Usage.AI_CHAT_MESSAGES_PER_MONTH]: {
    title: 'AI Chat',
    description:
      'Chat with your personal AI financial advisor for unlimited insights, budget recommendations, and real-time spending analysis.',
    icon: MessageSquare,
  },
  [Usage.ANALYTICS_ALL_TIME]: {
    title: 'Full Analytics History',
    description:
      'Access your complete transaction history with advanced filtering, multi-year trend analysis, and custom date ranges.',
    icon: BarChart3,
  },
  [Usage.ANALYTICS_MONTHS_LIMIT]: {
    title: 'Extended Analytics',
    description:
      'Go beyond 6 months of history. See year-over-year comparisons and long-term financial trends in full detail.',
    icon: BarChart3,
  },
};

const DEFAULT_CONFIG: FeatureConfig = {
  title: 'Pro Feature',
  description: 'Upgrade to Pro to unlock this feature and get the most out of FinTrack.',
  icon: Sparkles,
};

// ── Component ─────────────────────────────────────────────────────────────────

export interface ProGateModalProps {
  feature: Usage;
  open: boolean;
  onClose: () => void;
  /** Override the feature title */
  title?: string;
  /** Override the feature description */
  description?: string;
  /** Override the marketing image shown at the top of the modal */
  imageSrc?: string;
}

export function ProGateModal({ feature, open, onClose, title, description, imageSrc }: ProGateModalProps) {
  const config = FEATURE_CONFIG[feature] ?? DEFAULT_CONFIG;
  const Icon = config.icon;
  const resolvedImage = imageSrc ?? config.imageSrc;
  const resolvedTitle = title ?? config.title;
  const resolvedDescription = description ?? config.description;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton className="overflow-hidden p-0 sm:max-w-sm">
        {/* ── Illustration area ── */}
        {resolvedImage ? (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={resolvedImage}
              alt={config.title}
              fill
              className="object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div className="from-bg-surface to-bg-deep flex h-40 items-center justify-center bg-linear-to-b">
            <div className="border-border-subtle bg-bg-elevated flex size-16 items-center justify-center rounded-2xl border shadow-lg">
              <Lock className="text-text-tertiary size-7" />
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex flex-col gap-4 px-6 pt-4 pb-6">
          {/* Pro badge */}
          <span className="bg-warning/10 text-warning inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="size-3" />
            Pro Feature
          </span>

          {/* Title + description */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-text-primary text-[17px] font-semibold leading-snug tracking-tight">
              Locked: {resolvedTitle}
            </h2>
            <p className="text-text-secondary text-[13px] leading-relaxed">
              {resolvedDescription}
            </p>
          </div>

          {/* Feature highlight row */}
          <div className="border-border-subtle bg-bg-surface flex items-center gap-3 rounded-xl border px-3.5 py-3">
            <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Icon className="text-primary size-4" />
            </div>
            <p className="text-text-secondary text-[12px] leading-snug">
              Available on the{' '}
              <span className="text-text-primary font-semibold">Pro plan</span> — upgrade to
              unlock {resolvedTitle.toLowerCase()} and more.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 pt-1">
            <Button asChild className="w-full gap-2">
              <Link href="/pricing" onClick={onClose}>
                <Sparkles className="size-3.5" />
                Upgrade to Pro
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-tertiary w-full"
              onClick={onClose}
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
