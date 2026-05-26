'use client';

// ── ChatApprovalCard ──────────────────────────────────────────────────────────
// HITL (Human-in-the-Loop) action proposal card. Renders below the assistant
// message that proposes an agentic action. Once actioned the state is permanent
// (no undo in stub — mirrors real system behaviour where changes are committed).

import * as React from 'react';
import { Check, X, Zap } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { getActionLabel } from '../_lib/advisor.helpers';
import type { AdvisorAction } from '../_lib/advisor.types';

interface ChatApprovalCardProps {
  action: AdvisorAction;
  /** Initial state; once the user acts the card is locked */
  initialState?: 'pending' | 'approved' | 'rejected';
  onApprove?: () => void;
  onReject?: () => void;
}

export function ChatApprovalCard({
  action,
  initialState = 'pending',
  onApprove,
  onReject,
}: ChatApprovalCardProps) {
  const [state, setState] = React.useState<'pending' | 'approved' | 'rejected'>(initialState);

  const handleApprove = () => {
    setState('approved');
    onApprove?.();
  };

  const handleReject = () => {
    setState('rejected');
    onReject?.();
  };

  const label = getActionLabel(action);

  return (
    <div
      className={cn(
        'mt-2 rounded-xl border p-3 transition-colors',
        state === 'pending' && 'border-primary/20 bg-primary/5',
        state === 'approved' && 'border-success/20 bg-success/5',
        state === 'rejected' && 'border-border-subtle bg-bg-elevated',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full',
            state === 'pending' && 'bg-primary/15',
            state === 'approved' && 'bg-success/15',
            state === 'rejected' && 'bg-bg-surface',
          )}
        >
          {state === 'approved' ? (
            <Check className="size-3 text-success" aria-hidden />
          ) : state === 'rejected' ? (
            <X className="size-3 text-text-disabled" aria-hidden />
          ) : (
            <Zap className="size-3 text-primary" aria-hidden />
          )}
        </div>
        <span
          className={cn(
            'text-[11px] font-semibold uppercase tracking-wide',
            state === 'pending' && 'text-primary',
            state === 'approved' && 'text-success',
            state === 'rejected' && 'text-text-disabled',
          )}
        >
          {state === 'pending' ? 'Proposed Action' : state === 'approved' ? 'Approved' : 'Rejected'}
        </span>
      </div>

      {/* Action label */}
      <p
        className={cn(
          'text-[13px] font-medium leading-snug mb-1',
          state === 'rejected' ? 'text-text-disabled line-through' : 'text-text-primary',
        )}
      >
        {label}
      </p>

      {/* Reason */}
      <p
        className={cn(
          'text-[11px] leading-relaxed mb-3',
          state === 'rejected' ? 'text-text-disabled' : 'text-text-tertiary',
        )}
      >
        {action.reason}
      </p>

      {/* Action buttons — hidden once actioned */}
      {state === 'pending' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApprove}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-[12px] font-semibold text-success transition-colors hover:bg-success/20 min-h-[36px]"
          >
            <Check className="size-3.5" aria-hidden />
            Approve
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-error/10 px-3 py-1.5 text-[12px] font-semibold text-error transition-colors hover:bg-error/20 min-h-[36px]"
          >
            <X className="size-3.5" aria-hidden />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
