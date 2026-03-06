import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { StaticPageShell } from '@/app/(static)/_components';
import { SUPPORT_CATEGORIES, SUPPORT_ARTICLES } from '../_data';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return SUPPORT_CATEGORIES.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;
  const cat = SUPPORT_CATEGORIES.find((c) => c.slug === category);
  if (!cat) return {};
  return {
    title: `${cat.title} — FinTrack Help`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const cat = SUPPORT_CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();

  const Icon = cat.icon;
  const articles = SUPPORT_ARTICLES.filter((a) => a.categorySlug === cat.slug);

  // Other categories for sidebar "explore more"
  const otherCategories = SUPPORT_CATEGORIES.filter((c) => c.slug !== cat.slug).slice(0, 4);

  return (
    <StaticPageShell>
      <div className="mx-auto max-w-[1200px] px-4 pb-24 md:px-6">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link
            href={STATIC_ROUTES.SUPPORT}
            className="text-text-secondary hover:text-primary transition-colors duration-smooth shrink-0"
          >
            Help Center
          </Link>
          <span className="text-text-disabled shrink-0">/</span>
          <span className="text-text-primary font-medium">{cat.title}</span>
        </nav>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Category header */}
            <div className="mb-8 flex items-start gap-4">
              <div className={`rounded-xl bg-linear-to-br ${cat.gradientClass} border-border-subtle border p-4`}>
                <Icon size={24} className={cat.iconClass} aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-manrope text-text-primary mb-1 text-2xl font-bold sm:text-3xl">
                  {cat.title}
                </h1>
                <p className="text-body text-text-secondary leading-relaxed">{cat.description}</p>
                <p className="text-caption text-text-disabled mt-1">
                  {articles.length} article{articles.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Articles list */}
            <div className="flex flex-col gap-3">
              {articles.map((article, i) => (
                <Link
                  key={article.slug}
                  href={`/support/${cat.slug}/${article.slug}`}
                  className="glass-card rounded-card group flex items-center gap-4 p-5 transition-all duration-smooth hover:-translate-y-0.5 hover:shadow-md"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-body-sm text-text-primary group-hover:text-primary font-semibold leading-snug transition-colors duration-smooth">
                        {article.title}
                      </h2>
                      {article.popular && (
                        <span className="bg-primary/15 text-primary shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-text-secondary leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-text-disabled shrink-0 transition-all duration-smooth group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-64 xl:w-72 shrink-0">
            <div className="sticky top-32">
              <h3 className="font-manrope text-text-primary mb-4 text-sm font-bold uppercase tracking-widest">
                Other topics
              </h3>
              <div className="flex flex-col gap-2">
                {otherCategories.map((other) => {
                  const OtherIcon = other.icon;
                  return (
                    <Link
                      key={other.slug}
                      href={`/support/${other.slug}`}
                      className="glass-card rounded-card group flex items-center gap-3 p-3.5 transition-all duration-smooth hover:shadow-md"
                    >
                      <div className="bg-bg-elevated border-border-subtle shrink-0 rounded-lg border p-2">
                        <OtherIcon size={14} className={other.iconClass} aria-hidden="true" />
                      </div>
                      <span className="text-body-sm text-text-secondary group-hover:text-text-primary flex-1 font-medium transition-colors duration-smooth">
                        {other.title}
                      </span>
                      <ArrowRight
                        size={13}
                        className="text-text-disabled shrink-0 transition-all duration-smooth group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-body-sm text-text-primary mb-1 font-semibold">
                  Still need help?
                </p>
                <p className="text-caption text-text-secondary mb-4 leading-relaxed">
                  Our support team typically responds within one business day.
                </p>
                <Link
                  href={STATIC_ROUTES.CONTACT}
                  className="glossy-button rounded-button text-body-sm inline-flex w-full items-center justify-center py-2.5 font-semibold"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </StaticPageShell>
  );
}
