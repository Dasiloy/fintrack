'use client';

import { Search } from 'lucide-react';

import { cn } from '@ui/lib/utils';
import { BLOG_CATEGORIES } from '../_data';
import type { BlogCategory } from '../_data';

interface BlogHeroProps {
  query: string;
  onQueryChange: (v: string) => void;
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export function BlogHero({ query, onQueryChange, activeCategory, onCategoryChange }: BlogHeroProps) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-12 pt-10 md:px-6">
      {/* Headline */}
      <div className="mb-10 md:text-left text-center">
        <div className="bg-bg-elevated border-border-subtle text-overline text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
          FinTrack Blog
        </div>
        <h1 className="font-manrope text-text-primary mb-3 text-4xl font-bold tracking-tight md:text-5xl">
          Insights for your{' '}
          <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
            financial health
          </span>
        </h1>
        <p className="text-body-lg text-text-secondary max-w-xl leading-relaxed">
          Budgeting tips, investing guides, product updates, and real success stories — all in one place.
        </p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {BLOG_CATEGORIES.map((cat: BlogCategory) => (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(cat.slug)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-smooth',
                activeCategory === cat.slug
                  ? 'bg-primary text-white shadow-[0_2px_12px_rgba(124,122,255,0.35)]'
                  : 'bg-bg-elevated border-border-subtle text-text-secondary border hover:border-primary/40 hover:text-text-primary',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search
            size={15}
            className="text-text-tertiary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search articles…"
            className="input-field w-full py-2.5 pl-9 pr-4 text-sm"
          />
        </div>
      </div>
    </section>
  );
}
