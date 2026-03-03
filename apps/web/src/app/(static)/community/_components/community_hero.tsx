'use client';

import { Search } from 'lucide-react';

interface CommunityHeroProps {
  query: string;
  onQueryChange: (value: string) => void;
}

/**
 * Community Hub hero — badge, headline, member count subtitle, and a
 * controlled search input whose state is lifted to `CommunityHub`.
 */
export function CommunityHero({ query, onQueryChange }: CommunityHeroProps) {
  return (
    <section className="mx-auto mb-16 max-w-[1200px] px-4 md:px-6">
      <div className="glass-card border-border-light relative overflow-hidden rounded-[24px] border px-8 py-16 text-center md:py-24">
        {/* Ambient blobs */}
        <div
          aria-hidden="true"
          className="bg-primary/20 animate-landing-float pointer-events-none absolute top-[-30%] left-[-5%] h-[60%] w-[50%] rounded-full blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="bg-primary/10 animate-landing-float-delayed pointer-events-none absolute right-[-5%] bottom-[-30%] h-[50%] w-[40%] rounded-full blur-[100px]"
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Live badge */}
          <div className="bg-bg-elevated border-border-subtle text-overline text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
            </span>
            Community Hub
          </div>

          {/* Headline */}
          <h1 className="font-manrope text-text-primary text-4xl font-black tracking-tight drop-shadow-[0_0_25px_rgba(124,122,255,0.2)] sm:text-5xl lg:text-6xl">
            The FinTrack Community
          </h1>

          {/* Subtitle */}
          <p className="text-body-lg text-text-secondary max-w-xl font-light leading-relaxed">
            Connect, share, and grow your wealth with{' '}
            <span className="text-text-primary font-semibold">50,000+ members</span>. Join the
            discussion today.
          </p>

          {/* Controlled search */}
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="text-text-disabled pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search discussions, topics…"
              aria-label="Search community discussions"
              className="input-field text-body text-text-primary placeholder:text-text-disabled w-full pl-11"
            />
          </div>

          {/* Live result hint */}
          {query.trim() && (
            <p className="text-body-sm text-text-tertiary -mt-2 transition-opacity">
              Showing results for{' '}
              <span className="text-primary font-medium">&ldquo;{query.trim()}&rdquo;</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
