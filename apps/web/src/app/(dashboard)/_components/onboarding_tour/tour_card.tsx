'use client';

import * as React from 'react';
import { useOnborda } from 'onborda';
import type { CardComponentProps } from 'onborda';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api_client } from '@/lib/trpc_app/api_client';

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const { closeOnborda } = useOnborda();
  const utils = api_client.useUtils();

  const { mutate: completeTour, isPending } = api_client.user.completeTour.useMutation({
    onSuccess: () => void utils.user.getMe.invalidate(),
  });

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const handleFinish = () => {
    completeTour();
    closeOnborda();
  };

  const handleSkip = () => {
    completeTour();
    closeOnborda();
  };

  return (
    <div className="bg-bg-elevated border-border-light shadow-card relative w-[300px] overflow-visible rounded-2xl border p-5">
      {/*
       * Arrow SVG uses fill="currentColor" — force it to match the card
       * background so it blends in and adapts to light/dark theme.
       */}
      <span className="text-bg-elevated">{arrow}</span>

      {/* Step indicator dots */}
      <div className="mb-4 flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={
              i === currentStep
                ? 'bg-primary h-1.5 w-4 rounded-full transition-all'
                : i < currentStep
                  ? 'bg-primary/40 h-1.5 w-1.5 rounded-full'
                  : 'border-border-subtle h-1.5 w-1.5 rounded-full border'
            }
          />
        ))}
        <span className="text-text-tertiary ml-auto text-[11px] tabular-nums">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Icon + title */}
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl leading-none">{step.icon}</span>
        <h3 className="text-text-primary text-[15px] font-semibold leading-tight">{step.title}</h3>
      </div>

      {/* Description */}
      <p className="text-text-secondary mb-5 text-[13px] leading-relaxed">{step.content as string}</p>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        {!isFirst && (
          <button
            type="button"
            onClick={prevStep}
            className="border-border-light text-text-secondary hover:text-text-primary flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}

        {isLast ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleFinish}
            className="bg-primary hover:bg-primary/90 flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg text-[13px] font-semibold text-white transition-colors disabled:opacity-60"
          >
            Finish
          </button>
        ) : (
          <button
            type="button"
            onClick={nextStep}
            className="bg-primary hover:bg-primary/90 flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg text-[13px] font-semibold text-white transition-colors"
          >
            Next
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>

      {/* Skip link */}
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSkip}
          className="text-text-tertiary hover:text-text-secondary flex cursor-pointer items-center gap-1 text-[11px] transition-colors disabled:opacity-50"
        >
          <X className="size-3" />
          Skip tour
        </button>
      </div>
    </div>
  );
}
