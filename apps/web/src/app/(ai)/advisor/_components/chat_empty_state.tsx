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
        <div className="bg-primary/10 flex size-14 items-center justify-center rounded-2xl">
          <BrainCircuit className="text-primary size-7" aria-hidden />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-text-primary text-[16px] font-semibold">FinTrack Advisor</h2>
          <p className="text-text-tertiary max-w-[260px] text-[13px]">
            Your personal AI financial advisor
          </p>
        </div>
      </div>

      {/* ── Input slot — passed in from ChatPanel ── */}
      {inputSlot}

      {/* ── Suggested prompts ── */}
      <div>
        <div className="mb-3 flex items-center gap-1.5">
          <Sparkles className="text-text-disabled size-3.5" aria-hidden />
          <span className="text-text-disabled text-[11px] font-medium tracking-wide uppercase">
            Try asking
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPromptSelect(prompt)}
              className="border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary min-h-[44px] cursor-pointer rounded-xl border px-3 py-3 text-left text-[12px] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
