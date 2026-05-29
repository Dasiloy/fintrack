'use client';

import * as React from 'react';
import { Map, Sparkles } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@ui/components';

interface TourWelcomeDialogProps {
  open: boolean;
  firstName: string;
  onStart: () => void;
  onSkip: () => void;
}

export function TourWelcomeDialog({ open, firstName, onStart, onSkip }: TourWelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        {/* ── Illustration header ── */}
        <div className="from-bg-surface to-bg-deep flex h-32 items-center justify-center rounded-t-lg bg-linear-to-b">
          <div className="relative flex size-16 items-center justify-center">
            <div className="bg-primary/10 absolute inset-0 rounded-2xl" />
            <div className="bg-primary/5 absolute -inset-3 rounded-3xl" />
            <Map className="text-primary relative size-8" />
            <span className="border-bg-surface bg-primary absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2">
              <Sparkles className="size-2.5 text-white" fill="currentColor" />
            </span>
          </div>
        </div>

        <DialogHeader className="px-6 pt-2 pb-1 text-left">
          <DialogTitle className="text-text-primary text-[18px] font-semibold tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ''}!
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-[13px] leading-relaxed">
            Let&apos;s take a quick tour so you know where everything lives. It only takes about 60
            seconds.
          </DialogDescription>
        </DialogHeader>

        {/* ── Feature highlights ── */}
        <div className="border-border-light bg-bg-surface mx-6 space-y-2 rounded-xl border px-3.5 py-3">
          {[
            { emoji: '📊', text: 'Track income & expenses' },
            { emoji: '🎯', text: 'Set budgets and savings goals' },
            { emoji: '🤝', text: 'Split bills with friends' },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <span className="text-base leading-none">{emoji}</span>
              <span className="text-text-secondary text-[12px]">{text}</span>
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2 px-6 pb-6">
          <Button className="w-full gap-2" onClick={onStart}>
            <Map className="size-3.5" />
            Start the tour
          </Button>

          <Button variant="ghost" className="w-full" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
