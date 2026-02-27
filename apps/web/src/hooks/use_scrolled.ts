'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true once the window has scrolled past `threshold` pixels.
 * Uses a passive scroll listener for zero layout/paint cost.
 */
export function useScrolled(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold);

    // Check current position immediately (e.g. page restored with scroll offset)
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}
