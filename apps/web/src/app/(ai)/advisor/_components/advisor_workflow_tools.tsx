'use client';

import * as React from 'react';
import { CalendarCheck, FileSearch, Landmark, LineChart, Scale } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@ui/lib/utils';

export type AdvisorWorkflowId =
  | 'bill-subscription-auditor'
  | 'document-review-workspace'
  | 'cash-flow-forecast'
  | 'budget-rebalancer'
  | 'monthly-money-review';

export interface AdvisorWorkflowTool {
  id: AdvisorWorkflowId;
  label: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
}

const WORKFLOW_TOOLS: AdvisorWorkflowTool[] = [
  {
    id: 'bill-subscription-auditor',
    label: 'Bill audit',
    description: 'Find duplicate, stale, or rising recurring costs',
    prompt:
      'Run a bill and subscription auditor. Check my recurring bills and recent spending for duplicate, stale, unusual, or rising recurring costs, then recommend one practical action.',
    icon: Landmark,
  },
  {
    id: 'cash-flow-forecast',
    label: 'Cash flow',
    description: 'Project near-term inflows, bills, and risks',
    prompt:
      'Run a cash flow forecast for the next 30 days. Compare expected income, recurring bills, budgets, and goal commitments, then flag any risk points.',
    icon: LineChart,
  },
  {
    id: 'budget-rebalancer',
    label: 'Rebalance',
    description: 'Suggest one clean budget adjustment',
    prompt:
      'Run a budget rebalancer for this month. Compare my spending against budget limits and suggest one useful budget adjustment if the numbers support it.',
    icon: Scale,
  },
  {
    id: 'document-review-workspace',
    label: 'Docs review',
    description: 'Review uploaded statements, bills, or receipts',
    prompt:
      'Review the documents I attach. Extract the important amounts, dates, merchants, and financial changes, then summarize what I should do next.',
    icon: FileSearch,
  },
  {
    id: 'monthly-money-review',
    label: 'Month review',
    description: 'Summarize wins, risks, and next best action',
    prompt:
      'Run my monthly money review. Summarize my budget performance, recurring bills, goals, splits, and transactions, then recommend one next best action.',
    icon: CalendarCheck,
  },
];

interface AdvisorWorkflowToolsProps {
  disabled?: boolean;
  onSelect: (tool: AdvisorWorkflowTool) => void;
  className?: string;
  variant?: 'rail' | 'panel';
}

export function AdvisorWorkflowTools({
  disabled = false,
  onSelect,
  className,
  variant = 'rail',
}: AdvisorWorkflowToolsProps) {
  const isPanel = variant === 'panel';

  return (
    <section className={cn('space-y-2', className)} aria-label="Advisor workflow tools">
      {!isPanel && (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-text-disabled text-[11px] font-semibold tracking-[0.08em] uppercase">
            Start workflow
          </p>
          <p className="text-text-disabled hidden text-[11px] sm:block">Pick a focused review</p>
        </div>
      )}

      <div
        className={cn(
          'ft-scrollbar',
          isPanel
            ? 'flex max-h-[320px] flex-col gap-3 overflow-y-auto py-1'
            : '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1',
        )}
      >
        {WORKFLOW_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(tool)}
            className={cn(
              'group flex cursor-pointer items-center text-left transition-all duration-200',
              isPanel
                ? 'bg-bg-surface/35 hover:bg-bg-surface/55 w-fit gap-2 rounded-full py-1.5 pr-3 pl-1.5 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.45)] backdrop-blur-md'
                : 'bg-bg-elevated hover:bg-bg-surface max-w-[210px] min-w-[178px] flex-1 items-start gap-2.5 rounded-xl px-3 py-2.5 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.45)] hover:shadow-[0_12px_24px_-16px_rgba(15,23,42,0.5)]',
              'hover:-translate-y-0.5',
              'active:translate-y-0 active:scale-[0.99]',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
            )}
          >
            <span
              className={cn(
                'flex shrink-0 items-center justify-center transition-colors',
                isPanel
                  ? 'bg-primary/10 text-primary group-hover:bg-primary/15 group-hover:text-primary/90 size-8 rounded-full'
                  : 'bg-bg-surface text-text-tertiary group-hover:text-primary mt-0.5 size-8 rounded-lg',
              )}
            >
              <tool.icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'text-text-primary block truncate font-semibold',
                  isPanel ? 'max-w-[118px] text-[12px]' : 'text-[12px]',
                )}
              >
                {tool.label}
              </span>
              {!isPanel && (
                <span className="text-text-tertiary mt-0.5 line-clamp-2 block text-[11px] leading-snug">
                  {tool.description}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
