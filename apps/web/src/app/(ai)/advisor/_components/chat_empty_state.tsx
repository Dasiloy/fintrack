'use client';

// ── ChatEmptyState ────────────────────────────────────────────────────────────
// Centered empty state for the advisor chat. Renders:
//   1. Greeting avatar + tagline
//   2. inputSlot — the ChatInput component injected by ChatPanel so the input
//      sits between the greeting and the prompts (matching Claude / ChatGPT UX)
//   3. Suggested prompt chips
//
// The input is NOT pinned to the bottom here; it lives in the flow of the
// centered column. ChatPanel renders this instead of the normal layout when
// there are no messages yet.

import * as React from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import { SUGGESTED_PROMPTS } from '../_lib/advisor.constants';

interface ChatEmptyStateProps {
  onPromptSelect: (prompt: string) => void;
  inputSlot: React.ReactNode;
}

export function ChatEmptyState({ onPromptSelect, inputSlot }: ChatEmptyStateProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Greeting ── */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <BrainCircuit className="size-7 text-primary" aria-hidden />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-[16px] font-semibold text-text-primary">FinTrack Advisor</h2>
          <p className="max-w-[260px] text-[13px] text-text-tertiary">
            Your personal AI financial advisor. Ask me anything about your spending, budgets, or goals.
          </p>
        </div>
      </div>

      {/* ── Input slot — passed in from ChatPanel ── */}
      {inputSlot}

      {/* ── Suggested prompts ── */}
      <div>
        <div className="mb-3 flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-text-disabled" aria-hidden />
          <span className="text-[11px] font-medium uppercase tracking-wide text-text-disabled">
            Try asking
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPromptSelect(prompt)}
              className="min-h-[44px] cursor-pointer rounded-xl border border-border-subtle bg-bg-surface px-3 py-3 text-left text-[12px] text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
