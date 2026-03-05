import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { SUPPORT_CATEGORIES, SUPPORT_ARTICLES } from '../_data';
import type { SupportCategory } from '../_data';

function CategoryCard({ cat, count }: { cat: SupportCategory; count: number }) {
  const Icon = cat.icon;
  return (
    <Link
      href={`/support/${cat.slug}`}
      className="glass-card rounded-card group relative flex flex-col gap-4 overflow-hidden p-6 transition-all duration-smooth hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Gradient background accent */}
      <div
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${cat.gradientClass} opacity-60 transition-opacity duration-smooth group-hover:opacity-90`}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="bg-bg-elevated border-border-subtle rounded-xl border p-3">
          <Icon size={20} className={cat.iconClass} aria-hidden="true" />
        </div>
        <ArrowRight
          size={16}
          className="text-text-disabled mt-1 shrink-0 transition-all duration-smooth group-hover:translate-x-0.5 group-hover:text-text-secondary"
          aria-hidden="true"
        />
      </div>

      <div className="relative">
        <h2 className="font-manrope text-text-primary mb-1.5 text-base font-bold leading-snug">
          {cat.title}
        </h2>
        <p className="text-body-sm text-text-secondary leading-relaxed">{cat.description}</p>
      </div>

      <p className="text-caption text-text-disabled relative">
        {count} article{count !== 1 ? 's' : ''}
      </p>
    </Link>
  );
}

export function CategoriesGrid() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
      <h2 className="font-manrope text-text-primary mb-6 text-xl font-bold">Browse by topic</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPORT_CATEGORIES.map((cat) => {
          const count = SUPPORT_ARTICLES.filter((a) => a.categorySlug === cat.slug).length;
          return <CategoryCard key={cat.slug} cat={cat} count={count} />;
        })}
      </div>
    </section>
  );
}
