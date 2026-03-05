import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { POPULAR_ARTICLES, SUPPORT_CATEGORIES } from '../_data';

export function PopularArticles() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
      <h2 className="font-manrope text-text-primary mb-6 text-xl font-bold">Popular articles</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {POPULAR_ARTICLES.map((article) => {
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
                <p className="text-caption text-text-secondary line-clamp-2 leading-relaxed">
                  {article.excerpt}
                </p>
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
