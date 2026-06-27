'use client';

// ── ChatApprovalCard ──────────────────────────────────────────────────────────
// HITL (Human-in-the-Loop) action proposal card. Renders below the assistant
// message that proposes an agentic action. Once actioned the state is permanent
// (no undo in stub — mirrors real system behaviour where changes are committed).

import { Check, Loader2, X, Zap } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { getActionLabel } from '../_lib/advisor.helpers';
import type { AdvisorAction, AdvisorActionState } from '../_lib/advisor.types';

interface ChatApprovalCardProps {
  action: AdvisorAction;
  state?: AdvisorActionState;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ChatApprovalCard({
  action,
  state = 'pending',
  onApprove,
  onReject,
}: ChatApprovalCardProps) {
  const label = getActionLabel(action);
  const canAct = state === 'pending' || state === 'failed';
  const isProcessing = state === 'processing';
  const showActions = canAct || isProcessing;

  return (
    <div
      className={cn(
        'mt-2 rounded-xl p-3 transition-all',
        state === 'pending' && 'bg-bg-elevated shadow-[0_2px_8px_rgba(15,23,42,0.04)]',
        state === 'processing' && 'bg-warning/10 shadow-[0_2px_10px_rgba(245,158,11,0.08)]',
        state === 'approved' && 'bg-success/10 shadow-[0_2px_10px_rgba(34,197,94,0.09)]',
        state === 'rejected' && 'bg-bg-elevated/70 shadow-[0_1px_6px_rgba(15,23,42,0.03)]',
        state === 'failed' && 'bg-error/10 shadow-[0_2px_10px_rgba(239,68,68,0.08)]',
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full',
            state === 'pending' && 'bg-primary/10',
            state === 'processing' && 'bg-warning/15',
            state === 'approved' && 'bg-success/15',
            state === 'rejected' && 'bg-bg-surface',
            state === 'failed' && 'bg-error/15',
          )}
        >
          {state === 'approved' ? (
            <Check className="text-success size-3" aria-hidden />
          ) : state === 'rejected' ? (
            <X className="text-text-disabled size-3" aria-hidden />
          ) : state === 'processing' ? (
            <Loader2 className="text-warning size-3 animate-spin" aria-hidden />
          ) : state === 'failed' ? (
            <X className="text-error size-3" aria-hidden />
          ) : (
            <Zap className="text-primary size-3" aria-hidden />
          )}
        </div>
        <span
          className={cn(
            'text-[11px] font-semibold tracking-wide uppercase',
            state === 'pending' && 'text-primary',
            state === 'processing' && 'text-warning',
            state === 'approved' && 'text-success',
            state === 'rejected' && 'text-text-disabled',
            state === 'failed' && 'text-error',
          )}
        >
          {state === 'pending'
            ? 'Proposed Action'
            : state === 'processing'
              ? 'In Progress'
              : state === 'approved'
                ? 'Approved'
                : state === 'failed'
                  ? 'Action Failed'
                  : 'Cancelled'}
        </span>
      </div>

      {/* Action label */}
      <p
        className={cn(
          'mb-1 text-[13px] leading-snug font-medium',
          state === 'rejected' ? 'text-text-disabled line-through' : 'text-text-primary',
        )}
      >
        {label}
      </p>

      {/* Reason */}
      <p
        className={cn(
          'mb-3 text-[11px] leading-relaxed',
          state === 'rejected' ? 'text-text-disabled' : 'text-text-tertiary',
        )}
      >
        {action.reason}
      </p>

      {state === 'failed' && (
        <p className="text-error mb-3 text-[11px] leading-relaxed">
          I could not confirm that change. Please try again.
        </p>
      )}

      {/* Action buttons stay visible while processing, but are disabled. */}
      {showActions && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={canAct ? onApprove : undefined}
            disabled={!canAct}
            className={cn(
              'flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
              canAct
                ? 'bg-success/10 text-success hover:bg-success/20 cursor-pointer'
                : 'bg-warning/10 text-warning/70 cursor-not-allowed opacity-70',
            )}
          >
            {isProcessing ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="size-3.5" aria-hidden />
            )}
            {isProcessing ? 'Working' : 'Approve'}
          </button>
          <button
            type="button"
            onClick={canAct ? onReject : undefined}
            disabled={!canAct}
            className={cn(
              'flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
              canAct
                ? 'bg-error/10 text-error hover:bg-error/20 cursor-pointer'
                : 'bg-warning/10 text-warning/70 cursor-not-allowed opacity-70',
            )}
          >
            <X className="size-3.5" aria-hidden />
            Reject
          </button>
        </div>
      )}
      {isProcessing && (
        <p className="text-warning mt-3 text-[11px] leading-relaxed">
          Confirming this with the advisor...
        </p>
      )}
    </div>
  );
}
