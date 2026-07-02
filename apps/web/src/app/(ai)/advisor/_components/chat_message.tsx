'use client';

// ── ChatMessage ───────────────────────────────────────────────────────────────
// Renders a single chat message bubble.
//   - User messages: right-aligned, primary-tinted background
//   - Assistant messages: left-aligned with avatar, neutral background
//
// Markdown-like text: **bold** and newline handling

import { BrainCircuit } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { RichText } from './rich_text';
import type { AdvisorMessage } from '../_lib/advisor.types';
import { formatTime } from '../_lib/advisor.helpers';
import { ChatFileAttachment } from './chat_file_attachment';
import { ChatApprovalCard } from './chat_approval_card';
import { WorkflowResponseCard, WorkflowRunCard } from './advisor_workflow_cards';

interface ChatMessageProps {
  message: AdvisorMessage;
  /** Called when user approves or rejects an action — parent updates actionState */
  onActionApprove?: (messageId: string) => void;
  onActionReject?: (messageId: string) => void;
  onWorkflowCandidateApprove?: (messageId: string, candidateIds: string[]) => void;
  onRecommendationClick?: (recommendation: string) => void;
}

export function ChatMessage({
  message,
  onActionApprove,
  onActionReject,
  onWorkflowCandidateApprove,
  onRecommendationClick,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const files = [...(message.generatedFiles ?? []), ...(message.attachments ?? [])];
  const hasFiles = files.length > 0;

  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar — assistant only */}
      {!isUser && (
        <div className="bg-primary/15 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
          <BrainCircuit className="text-primary size-3.5" aria-hidden />
        </div>
      )}

      {/* Bubble + attachments */}
      <div className={cn('flex max-w-[80%] flex-col gap-2', isUser && 'items-end')}>
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-[13px] leading-relaxed',
            isUser
              ? 'bg-primary/5 text-text-primary rounded-tr-sm'
              : 'bg-bg-surface text-text-primary rounded-tl-sm',
            !message.content?.trim() || message.workflow || message.workflowResponse
              ? 'hidden'
              : '',
          )}
        >
          <RichText
            text={message.content}
            onRecommendationClick={!isUser ? onRecommendationClick : undefined}
          />
        </div>

        {message.workflow && (
          <div className="w-full max-w-[360px]">
            <WorkflowRunCard workflow={message.workflow} />
          </div>
        )}

        {message.workflowResponse && !isUser && (
          <div className="w-full max-w-[440px]">
            <WorkflowResponseCard
              response={message.workflowResponse}
              onApproveCandidates={
                onWorkflowCandidateApprove
                  ? (candidateIds) => onWorkflowCandidateApprove(message.id, candidateIds)
                  : undefined
              }
            />
          </div>
        )}

        {/* Generated file attachments */}
        {hasFiles && (
          <div className={cn('flex w-full max-w-xs flex-col gap-1.5', isUser && 'items-end')}>
            {files.map((file) => (
              <ChatFileAttachment key={file.name} file={file} />
            ))}
          </div>
        )}

        {/* HITL approval card */}
        {message.proposedAction && (
          <div className="w-full max-w-sm">
            <ChatApprovalCard
              action={message.proposedAction}
              state={message.actionState ?? 'pending'}
              onApprove={() => onActionApprove?.(message.id)}
              onReject={() => onActionReject?.(message.id)}
            />
          </div>
        )}

        {/* Timestamp */}
        <span className="text-text-disabled text-[10px]">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
