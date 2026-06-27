'use client';

import { BrainCircuit } from 'lucide-react';
// ── AdvisorThinkingIndicator ──────────────────────────────────────────────────
// Fluid "the advisor is working" indicator. A continuous shimmer sweeps the
// label (Claude-style), and the label advances through friendly, abstracted
// stages so the user perceives real progress.
//
// These stages are deliberately generic — they convey "something is happening on
// your question" without exposing server internals (tool calls, node names…).
// They move forward and hold on the last stage if the answer takes a while.

import * as React from 'react';

const STAGES = [
  'Thinking',
  'Reading your question',
  'Understanding what you need',
  'Looking into your finances',
  'Reviewing your recent activity',
  'Checking recent transactions',
  'Checking your budgets and goals',
  'Reviewing recurring bills',
  'Checking your cash flow',
  'Working through the numbers',
  'Comparing categories',
  'Spotting patterns in your spending',
  'Looking for useful signals',
  'Checking for trade-offs',
  'Weighing your options',
  'Building a practical recommendation',
  'Checking the details',
  'Making the answer clear',
  'Putting your answer together',
  'Almost there',
] as const;

const ATTACHMENT_STAGES = [
  'Viewing documents',
  'Opening attached files',
  'Checking document formats',
  'Preparing documents for review',
  'Extracting documents',
  'Reading document text',
  'Analyzing document content',
  'Scanning statements and receipts',
  'Reading tables and statements',
  'Finding transaction rows',
  'Looking for amounts and dates',
  'Checking account details',
  'Grouping related entries',
  'Spotting unusual patterns',
  'Matching document data',
  'Checking finance data',
  'Cross-checking with your Fintrack data',
  'Comparing budgets and recurring bills',
  'Reviewing goals and cash flow',
  'Putting the document insights together',
] as const;

const STAGE_INTERVAL_MS = 2000;

interface AdvisorThinkingIndicatorProps {
  hasAttachments?: boolean;
}

export function AdvisorThinkingIndicator({ hasAttachments }: AdvisorThinkingIndicatorProps) {
  const [stage, setStage] = React.useState(0);
  const stages = React.useMemo(
    () => (hasAttachments ? [...ATTACHMENT_STAGES, ...STAGES] : STAGES),
    [hasAttachments],
  );

  React.useEffect(() => {
    setStage(0);
  }, [stages]);

  React.useEffect(() => {
    if (stages.length <= 1) return;
    const timer = setInterval(() => {
      // Advance forward, then hold on the final stage.
      setStage((s) => Math.min(s + 1, stages.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [stages]);

  return (
    <div className="flex items-center gap-2.5">
      {/* Scoped keyframes: a sweeping shimmer, a soft fade when the stage changes,
          and the WhatsApp-style staggered dot bounce. */}
      <style>{`
        @keyframes advisor-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes advisor-stage-in {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes advisor-dot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30%           { opacity: 1;   transform: translateY(-3px); }
        }
      `}</style>

      <div className="bg-primary/15 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
        <BrainCircuit className="text-primary size-3.5" aria-hidden />
      </div>

      <div className="bg-bg-surface flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3">
        <span
          key={stage}
          className="text-body-sm font-medium"
          style={{
            backgroundImage:
              'linear-gradient(90deg, var(--color-text-tertiary) 0%, var(--color-text-primary) 50%, var(--color-text-tertiary) 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            animation: 'advisor-shimmer 2s linear infinite, advisor-stage-in 0.35s ease-out',
          }}
        >
          {stages[stage]}
        </span>

        {/* Flowing three-dot bounce — runs continuously across stage changes. */}
        <span className="flex items-end gap-0.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="bg-text-tertiary inline-block size-1 rounded-full"
              style={{
                animation: 'advisor-dot 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
