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
  'Looking into your finances',
  'Reviewing your recent activity',
  'Checking your budgets and goals',
  'Working through the numbers',
  'Spotting patterns in your spending',
  'Weighing your options',
  'Putting your answer together',
  'Almost there',
] as const;

const STAGE_INTERVAL_MS = 2000;

export function AdvisorThinkingIndicator() {
  const [stage, setStage] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      // Advance forward, then hold on the final stage.
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

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
          {STAGES[stage]}
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
