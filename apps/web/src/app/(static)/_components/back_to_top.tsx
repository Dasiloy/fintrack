'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

import { cn } from '@ui/lib/utils';

const SHOW_THRESHOLD = 300;

/**
 * Fixed back-to-top button.
 * Slides up into view once the user scrolls past SHOW_THRESHOLD,
 * and triggers a smooth scroll to the top of the page on click.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'glass-card flex size-11 items-center justify-center rounded-full',
        'shadow-[0_4px_20px_rgba(124,122,255,0.25)]',
        'transition-all duration-300 ease-out',
        'hover:scale-110 hover:shadow-[0_4px_28px_rgba(124,122,255,0.4)] active:scale-95',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <ArrowUp size={16} className="text-primary" aria-hidden="true" />
    </button>
  );
}
