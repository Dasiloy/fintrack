import Link from 'next/link';
import { ArrowRight, SearchX } from 'lucide-react';

import { SUPPORT_CATEGORIES } from '../_data';
import type { SupportArticle } from '../_data';

interface SearchResultsProps {
  articles: SupportArticle[];
  query: string;
}

export function SearchResults({ articles, query }: SearchResultsProps) {
  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pb-20 md:px-6">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="bg-bg-elevated border-border-subtle rounded-2xl border p-5">
            <SearchX size={28} className="text-text-tertiary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-manrope text-text-primary mb-1 font-bold">No results found</p>
            <p className="text-body-sm text-text-secondary">
              No articles match <span className="text-text-primary font-semibold">"{query}"</span>.
              Try a different search term.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-20 md:px-6">
      <p className="text-body-sm text-text-secondary mb-5">
        {articles.length} result{articles.length !== 1 ? 's' : ''} for{' '}
        <span className="text-text-primary font-semibold">"{query}"</span>
      </p>

      <div className="flex flex-col gap-3">
        {articles.map((article) => {
          const cat = SUPPORT_CATEGORIES.find((c) => c.slug === article.categorySlug);
          const Icon = cat?.icon;
          return (
            <Link
              key={article.slug}
              href={`/support/${article.categorySlug}/${article.slug}`}
              className="glass-card rounded-card group flex items-start gap-4 p-5 transition-all duration-smooth hover:-translate-y-0.5 hover:shadow-md"
            >
              {cat && Icon && (
                <div className="bg-bg-elevated border-border-subtle mt-0.5 shrink-0 rounded-lg border p-2.5">
                  <Icon size={16} className={cat.iconClass} aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-caption text-text-disabled mb-1">{cat?.title}</p>
                <h3 className="text-body-sm text-text-primary group-hover:text-primary mb-1 font-semibold leading-snug transition-colors duration-smooth">
                  {article.title}
                </h3>
                <p className="text-caption text-text-secondary leading-relaxed">{article.excerpt}</p>
              </div>
              <ArrowRight
                size={14}
                className="text-text-disabled mt-1 shrink-0 transition-all duration-smooth group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
