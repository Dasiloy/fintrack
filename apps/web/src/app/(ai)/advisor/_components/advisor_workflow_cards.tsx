'use client';

import * as React from 'react';
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  CheckSquare2,
  CircleAlert,
  Loader2,
  Square,
} from 'lucide-react';
import { cn } from '@ui/lib/utils';
import {
  normalizeWorkflowCandidates,
  workflowStageState,
  workflowStatusPresentation,
} from '../_lib/advisor.helpers';
import type { AdvisorWorkflowResponse, AdvisorWorkflowRun } from '../_lib/advisor.types';
import { RichInlineText } from './rich_text';

export function WorkflowResponseCard({
  response,
  onApproveCandidates,
}: {
  response: AdvisorWorkflowResponse;
  onApproveCandidates?: (candidateIds: string[]) => void;
}) {
  const candidates = normalizeWorkflowCandidates(response.candidates ?? []);
  const hasProcessingCandidate = candidates.some((candidate) => candidate.state === 'processing');
  const approvedCount = candidates.filter((candidate) => candidate.state === 'approved').length;
  const failedCount = candidates.filter((candidate) => candidate.state === 'failed').length;
  const processingCount = candidates.filter((candidate) => candidate.state === 'processing').length;
  const hasApprovedCandidate = approvedCount > 0;
  const hasTerminalCandidate = approvedCount > 0 || failedCount > 0;
  const [selectedCandidateIds, setSelectedCandidateIds] = React.useState<Set<string>>(
    () =>
      new Set(
        candidates
          .filter((candidate) => candidate.selected && !candidate.state)
          .map((candidate) => candidate.id),
      ),
  );
  const selectedCount = selectedCandidateIds.size;
  const candidateStatusSummary = workflowCandidateStatusSummary({
    selectedCount,
    totalCount: candidates.length,
    processingCount,
    approvedCount,
    failedCount,
  });

  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidateIds((current) => {
      const next = new Set(current);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  };

  return (
    <div className="border-border-subtle bg-bg-surface overflow-hidden rounded-2xl rounded-tl-sm text-left shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
      <div className="border-border-subtle grid grid-cols-[auto_1fr] gap-3 border-b px-3.5 py-3">
        <span className="border-success/15 bg-success/10 text-success flex size-9 shrink-0 items-center justify-center rounded-lg border">
          <BarChart3 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <span className="text-text-disabled text-[10px] font-semibold tracking-[0.08em] uppercase">
            Workflow result
          </span>
          <p className="text-text-primary mt-0.5 text-[13px] leading-5 font-semibold">
            {response.title}
          </p>
          <p className="text-text-tertiary mt-1 line-clamp-3 text-[11px] leading-[1.65]">
            <RichInlineText text={response.summary} />
          </p>
        </div>
      </div>

      {response.metrics.length > 0 && (
        <div className="divide-border-subtle border-border-subtle grid grid-cols-3 divide-x border-b">
          {response.metrics.map((metric) => (
            <div key={`${metric.label}-${metric.value}`} className="min-w-0 px-3 py-2.5">
              <p className="text-text-disabled text-[9px] font-semibold tracking-[0.04em] uppercase">
                {metric.label}
              </p>
              <p className="text-text-primary mt-0.5 truncate text-[12px] font-semibold">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="divide-border-subtle divide-y">
        {response.sections.slice(0, 3).map((section) => (
          <div key={section.title} className="px-3.5 py-3">
            <p className="text-text-secondary text-[11px] font-semibold">{section.title}</p>
            <ul className="mt-2 space-y-1.5">
              {section.items.slice(0, 3).map((item) => (
                <li
                  key={item}
                  className="text-text-tertiary grid grid-cols-[8px_1fr] gap-2 text-[11px] leading-[1.65]"
                >
                  <span className="bg-primary/50 mt-2 size-1 rounded-full" />
                  <span>
                    <RichInlineText text={item} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {candidates.length > 0 && (
          <div className="bg-bg-elevated/45 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-text-secondary text-[11px] font-semibold">Change candidates</p>
              <span className="text-text-disabled text-[10px] font-medium">
                {candidateStatusSummary}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {candidates.map((candidate) => {
                const selected = selectedCandidateIds.has(candidate.id);
                const locked =
                  candidate.state === 'processing' ||
                  candidate.state === 'approved' ||
                  candidate.state === 'failed';
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => {
                      if (!locked) toggleCandidate(candidate.id);
                    }}
                    disabled={locked}
                    className={cn(
                      'grid w-full grid-cols-[18px_1fr] gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                      locked && 'cursor-not-allowed',
                      selected
                        ? 'border-primary/20 bg-primary/4'
                        : 'border-border-subtle bg-bg-surface',
                      candidate.state === 'approved' && 'border-success/20 bg-success/4',
                      candidate.state === 'processing' && 'border-warning/20 bg-warning/4',
                      candidate.state === 'failed' && 'border-error/20 bg-error/4',
                    )}
                  >
                    {candidate.state === 'processing' ? (
                      <Loader2 className="text-warning mt-0.5 size-3.5 animate-spin" aria-hidden />
                    ) : candidate.state === 'approved' ? (
                      <CheckCircle2 className="text-success mt-0.5 size-3.5" aria-hidden />
                    ) : candidate.state === 'failed' ? (
                      <CircleAlert className="text-error mt-0.5 size-3.5" aria-hidden />
                    ) : selected ? (
                      <CheckSquare2 className="text-primary mt-0.5 size-3.5" aria-hidden />
                    ) : (
                      <Square className="text-text-disabled mt-0.5 size-3.5" aria-hidden />
                    )}
                    <span className="min-w-0">
                      <span className="text-text-primary block text-[11px] leading-4 font-semibold">
                        <RichInlineText text={candidate.title} />
                      </span>
                      {candidate.detail && (
                        <span className="text-text-tertiary mt-1 block text-[10px] leading-[1.6]">
                          <RichInlineText text={candidate.detail} />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={
                !onApproveCandidates ||
                selectedCount === 0 ||
                hasProcessingCandidate ||
                hasTerminalCandidate
              }
              onClick={() => onApproveCandidates?.([...selectedCandidateIds])}
              className={cn(
                'mt-2.5 flex min-h-[34px] w-full cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
                onApproveCandidates &&
                  selectedCount > 0 &&
                  !hasProcessingCandidate &&
                  !hasTerminalCandidate
                  ? 'bg-success/10 text-success hover:bg-success/20'
                  : 'bg-bg-surface text-text-disabled cursor-not-allowed',
              )}
            >
              {hasProcessingCandidate
                ? 'Confirming selected'
                : hasTerminalCandidate
                  ? workflowCandidateButtonLabel({
                      totalCount: candidates.length,
                      approvedCount,
                      failedCount,
                    })
                  : 'Approve selected'}
            </button>
          </div>
        )}

        {response.recommendation && (
          <div className="bg-success/4 px-3.5 py-3">
            <p className="text-success text-[11px] font-semibold">
              {response.recommendation.title}
            </p>
            <p className="text-text-secondary mt-1.5 text-[11px] leading-[1.65]">
              <RichInlineText text={response.recommendation.detail} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkflowRunCard({ workflow }: { workflow: AdvisorWorkflowRun }) {
  const status = workflowStatusPresentation(workflow.status);
  const StatusIcon = workflowStatusIcon(workflow.status);

  return (
    <div className="border-primary/10 bg-primary/2.5 overflow-hidden rounded-2xl rounded-tr-sm border text-left shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
      <div className="border-border-subtle grid grid-cols-[auto_1fr] gap-3 border-b px-3.5 py-3">
        <span className="border-primary/10 bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border">
          <CalendarCheck className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-text-disabled text-[10px] font-semibold tracking-[0.08em] uppercase">
            Review request
          </span>
          <p className="text-text-primary mt-0.5 text-[13px] leading-5 font-semibold">
            {workflow.title}
          </p>
          <p className="text-text-tertiary mt-0.5 text-[11px] leading-4">{workflow.description}</p>
        </div>
      </div>

      <div className="divide-border-subtle divide-y">
        <div className="sm:divide-border-subtle grid sm:grid-cols-2 sm:divide-x">
          {workflow.summaryItems.map((item) => (
            <div key={item.label} className="min-w-0 px-3.5 py-3">
              <p className="text-text-disabled text-[10px] font-semibold tracking-[0.04em] uppercase">
                {item.label}
              </p>
              <p className="text-text-secondary mt-0.5 line-clamp-2 text-[11px] leading-4 font-semibold">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {workflow.focusItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3.5 py-3">
            {workflow.focusItems.map((item) => (
              <span
                key={item}
                className="border-border-subtle bg-bg-elevated text-text-tertiary rounded-md border px-2 py-1 text-[10px] font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="px-3.5 py-3">
          <div className="flex items-center gap-1.5">
            <StatusIcon className={cn('size-3.5 shrink-0', status.iconClass)} aria-hidden />
            <span className={cn('text-[11px] font-semibold', status.textClass)}>
              {workflow.statusLabel}
            </span>
          </div>
          <div className="mt-2.5 space-y-2">
            {workflow.stages.map((stage, index) => {
              const stageState = workflowStageState(workflow, index);
              return (
                <div
                  key={stage}
                  className={cn(
                    'grid grid-cols-[14px_1fr] items-center gap-2 text-[10px]',
                    stageState === 'current' ? 'text-text-secondary' : 'text-text-disabled',
                  )}
                >
                  <span
                    className={cn(
                      'mx-auto size-1.5 rounded-full',
                      stageState === 'done' && 'bg-success',
                      stageState === 'current' && workflow.status !== 'failed' && 'bg-primary',
                      stageState === 'current' && workflow.status === 'failed' && 'bg-error',
                      stageState === 'pending' && 'bg-border-strong',
                    )}
                  />
                  <span className={cn(stageState === 'current' && 'font-medium')}>{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function workflowStatusIcon(status: AdvisorWorkflowRun['status']) {
  if (status === 'failed') return CircleAlert;
  if (status === 'completed') return CheckCircle2;
  return Loader2;
}

function workflowCandidateStatusSummary({
  selectedCount,
  totalCount,
  processingCount,
  approvedCount,
  failedCount,
}: {
  selectedCount: number;
  totalCount: number;
  processingCount: number;
  approvedCount: number;
  failedCount: number;
}): string {
  if (processingCount > 0) {
    return `${processingCount}/${totalCount} confirming`;
  }

  if (approvedCount > 0 || failedCount > 0) {
    const parts = [
      approvedCount > 0 ? `${approvedCount}/${totalCount} approved` : null,
      failedCount > 0 ? `${failedCount}/${totalCount} failed` : null,
    ].filter(Boolean);
    return parts.join(' · ');
  }

  return `${selectedCount}/${totalCount} selected`;
}

function workflowCandidateButtonLabel({
  totalCount,
  approvedCount,
  failedCount,
}: {
  totalCount: number;
  approvedCount: number;
  failedCount: number;
}): string {
  if (failedCount > 0 && approvedCount > 0) return 'Partially approved';
  if (failedCount > 0) return 'Approval failed';
  if (approvedCount === totalCount) return 'All approved';
  return `${approvedCount} approved`;
}
