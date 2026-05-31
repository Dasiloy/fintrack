'use client';

import * as React from 'react';

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Returns `true` when the viewport width is below 768px (md breakpoint).
 * Subscribes to resize events via `matchMedia` for efficient updates.
 */
export function useBreakPoint(mediaQuery: {
  breakPoint: number;
  match: 'min-width' | 'max-width';
}): boolean {
  const [isBreakPoint, setIsBreakPoint] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(${mediaQuery.match}: ${mediaQuery.breakPoint}px)`);
    const onChange = () => setIsBreakPoint(mql.matches);
    mql.addEventListener('change', onChange);
    setIsBreakPoint(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isBreakPoint;
}
