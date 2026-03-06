'use client';

import { Search, LifeBuoy } from 'lucide-react';

interface SupportHeroProps {
  query: string;
  onQueryChange: (v: string) => void;
}

export function SupportHero({ query, onQueryChange }: SupportHeroProps) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-12 pt-10 md:px-6">
      <div className="text-center">
        <div className="bg-bg-elevated border-border-subtle text-overline text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
          <LifeBuoy size={13} aria-hidden="true" />
          Help Center
        </div>

        <h1 className="font-manrope text-text-primary mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          How can we{' '}
          <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
            help you?
          </span>
        </h1>

        <p className="text-body-lg text-text-secondary mx-auto mb-10 max-w-xl leading-relaxed">
          Search our help articles or browse by category below.
        </p>

        {/* Search */}
        <div className="relative mx-auto w-full max-w-lg">
          <Search
            size={17}
            className="text-text-tertiary pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search articles…"
            className="input-field w-full py-3.5 pl-11 pr-4 text-base"
            aria-label="Search help articles"
            autoComplete="off"
          />
        </div>
      </div>
    </section>
  );
}
