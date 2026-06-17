'use client';

import * as React from 'react';
import { cn } from '@ui/lib/utils/cn';

/**
 * Fixed decorative value shown for the locked (Pro-gate) teaser. It is a
 * constant — never the user's real score — so nothing sensitive reaches the DOM
 * for free users even if the blur is removed in devtools.
 */
const TEASER_SCORE = 72;

/** Qualitative band for a 0–100 score — a classic "score record" rating. */
function scoreBand(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs work';
}

interface ScoreGaugeProps {
  /** Score 0–100. Ignored entirely when `blurred` (locked teaser). */
  score: number;
  /** Pixel size of the square gauge. */
  size?: number;
  /** Ring thickness. */
  strokeWidth?: number;
  /** Locked teaser: render a constant fake arc + value, never the real score. */
  blurred?: boolean;
  className?: string;
  /** Show the qualitative rating word under the number (hidden at small sizes). */
  showRating?: boolean;
}

/**
 * Circular "score record" gauge with a classic gold ring. The arc fills to the
 * score and animates on mount. Used both as the compact dashboard widget and
 * (larger) in the trend sheet header.
 */
export function ScoreGauge({
  score,
  size = 64,
  strokeWidth = 8,
  blurred = false,
  className,
  showRating = true,
}: ScoreGaugeProps) {
  // When locked, the value is a constant teaser — the real score is never used.
  const value = blurred ? TEASER_SCORE : Math.max(0, Math.min(100, score));
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference * (1 - value / 100);

  // Animate the arc from empty → target on mount / score change.
  const [offset, setOffset] = React.useState(circumference);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(id);
  }, [target, circumference]);

  const numberSize = Math.round(size * 0.3);

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="-rotate-90"
        style={{ filter: 'drop-shadow(0 0 6px rgba(245,180,30,0.35))' }}
      >
        <defs>
          <linearGradient id="ft-gold-gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D4A017" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--color-border-light)"
          strokeWidth={strokeWidth}
          opacity={0.6}
        />

        {/* Progress arc */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#ft-gold-gauge)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1100ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>

      {/* Centre value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span
          className={cn(
            'font-bold text-amber-500 tabular-nums select-none',
            blurred && 'blur-[6px]',
          )}
          style={{ fontSize: numberSize, lineHeight: 1 }}
        >
          {Math.round(value)}
        </span>
        {showRating && (
          <span
            className={cn(
              'font-bold tracking-wide text-amber-600/90 uppercase select-none',
              blurred && 'blur-[5px]',
            )}
            style={{ fontSize: Math.max(8, Math.round(size * 0.1)) }}
          >
            {scoreBand(value)}
          </span>
        )}
      </div>
    </div>
  );
}
