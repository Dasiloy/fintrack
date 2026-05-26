'use client';

// ── ChatEmptyState ────────────────────────────────────────────────────────────
// First-run empty state for the advisor chat panel.
// Shows a greeting + 6 suggested prompts that pre-fill the input on click.

import * as React from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import { SUGGESTED_PROMPTS } from '../_lib/advisor.constants';

interface ChatEmptyStateProps {
  onPromptSelect: (prompt: string) => void;
}

export function ChatEmptyState({ onPromptSelect }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      {/* Logo / avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <BrainCircuit className="size-7 text-primary" aria-hidden />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="text-[16px] font-semibold text-text-primary">FinTrack Advisor</h2>
          <p className="max-w-[260px] text-[13px] text-text-tertiary">
            Your personal AI financial advisor. Ask me anything about your spending, budgets, or goals.
          </p>
        </div>
      </div>

      {/* Suggested prompts grid */}
      <div className="w-full max-w-md">
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
              className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-3 text-left text-[12px] text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary min-h-[44px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
