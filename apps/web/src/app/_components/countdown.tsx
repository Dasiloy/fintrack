'use client';

import { useEffect, useState, useCallback } from 'react';

const DEFAULT_INITIAL_SECONDS = 300;

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : String(s);
}

export function useCountdown(initialSeconds: number = DEFAULT_INITIAL_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  const restart = useCallback(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  return {
    secondsLeft,
    isComplete: secondsLeft <= 0,
    restart,
    formatted: formatSeconds(secondsLeft),
  };
}

export interface CountdownDisplayProps {
  /** Remaining seconds to display */
  value: number;
  className?: string;
}

/** Displays remaining countdown time (e.g. "0:45" or "59"). */
export function CountdownDisplay({ value, className }: CountdownDisplayProps) {
  return <span className={className}>{formatSeconds(value)}</span>;
}
