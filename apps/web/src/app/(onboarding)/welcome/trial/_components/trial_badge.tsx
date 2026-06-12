'use client';

import { Sparkles } from 'lucide-react';

/**
 * Launch-offer pill shown above the trial headline.
 * Gentle float + glow loop — pure CSS, no JS.
 */
export function TrialBadge() {
  return (
    <>
      <style>{`
        @keyframes _ft-badge-float {
          0%, 100% { transform: translateY(0); box-shadow: 0 0 0 rgba(124,122,255,0); }
          50%      { transform: translateY(-3px); box-shadow: 0 6px 22px rgba(124,122,255,0.25); }
        }
      `}</style>
      <span
        className="bg-primary/15 text-primary inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase"
        style={{ animation: '_ft-badge-float 3.2s ease-in-out infinite' }}
      >
        <Sparkles size={11} aria-hidden="true" />
        Launch offer
      </span>
    </>
  );
}
