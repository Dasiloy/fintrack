import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Info, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';

import { cn } from '@ui/lib/utils';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { StaticPageShell } from '@/app/(static)/_components';
import { SUPPORT_CATEGORIES, SUPPORT_ARTICLES } from '../../_data';
import type { SupportBlock } from '../../_data';

interface ArticlePageProps {
  params: Promise<{ category: string; article: string }>;
}

export async function generateStaticParams() {
  return SUPPORT_ARTICLES.map(({ categorySlug, slug }) => ({
    category: categorySlug,
    article: slug,
  }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { article: articleSlug } = await params;
  const article = SUPPORT_ARTICLES.find((a) => a.slug === articleSlug);
  if (!article) return {};
  return {
    title: `${article.title} — FinTrack Help`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category: categorySlug, article: articleSlug } = await params;

  const cat = SUPPORT_CATEGORIES.find((c) => c.slug === categorySlug);
  const article = SUPPORT_ARTICLES.find(
    (a) => a.slug === articleSlug && a.categorySlug === categorySlug,
  );
  if (!cat || !article) notFound();

  const CatIcon = cat.icon;

  // Related articles: same category, excluding current
  const related = SUPPORT_ARTICLES.filter(
    (a) => a.categorySlug === categorySlug && a.slug !== articleSlug,
  ).slice(0, 3);

  return (
    <StaticPageShell>
      <div className="mx-auto max-w-[1200px] px-4 pb-24 md:px-6">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 overflow-hidden text-sm" aria-label="Breadcrumb">
          <Link
            href={STATIC_ROUTES.SUPPORT}
            className="text-text-secondary hover:text-primary transition-colors duration-smooth shrink-0"
          >
            Help Center
          </Link>
          <span className="text-text-disabled shrink-0">/</span>
          <Link
            href={`/support/${cat.slug}`}
            className="text-text-secondary hover:text-primary transition-colors duration-smooth shrink-0"
          >
            {cat.title}
          </Link>
          <span className="text-text-disabled shrink-0">/</span>
          <span className="text-text-primary min-w-0 truncate font-medium">{article.title}</span>
        </nav>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">

          {/* Article */}
          <article className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <CatIcon size={14} className={cat.iconClass} aria-hidden="true" />
                <span className={cn('text-caption font-semibold', cat.iconClass)}>
                  {cat.title}
                </span>
                {article.popular && (
                  <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    Popular
                  </span>
                )}
              </div>

              <h1 className="font-manrope text-text-primary mb-3 text-2xl font-bold leading-snug sm:text-3xl md:text-4xl">
                {article.title}
              </h1>
              <p className="text-body text-text-secondary leading-relaxed">{article.excerpt}</p>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-6">
              {article.body.map((block: SupportBlock, i: number) => (
                <BlockRenderer key={i} block={block} />
              ))}
            </div>

            {/* Related in category */}
            {related.length > 0 && (
              <div className="mt-14">
                <div className="border-border-subtle mb-6 flex items-center justify-between border-t pt-8">
                  <h2 className="font-manrope text-text-primary text-lg font-bold">
                    More in {cat.title}
                  </h2>
                  <Link
                    href={`/support/${cat.slug}`}
                    className="text-primary text-body-sm font-semibold transition-opacity hover:opacity-75"
                  >
                    View all →
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/support/${cat.slug}/${rel.slug}`}
                      className="glass-card rounded-card group flex items-center gap-4 p-4 transition-all duration-smooth hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm text-text-primary group-hover:text-primary font-semibold leading-snug transition-colors duration-smooth">
                          {rel.title}
                        </p>
                        <p className="text-caption text-text-secondary mt-0.5 leading-relaxed">
                          {rel.excerpt}
                        </p>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-text-disabled shrink-0 transition-all duration-smooth group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:w-64 xl:w-72 shrink-0">
            <div className="sticky top-32 flex flex-col gap-6">
              {/* Back to category */}
              <Link
                href={`/support/${cat.slug}`}
                className="glass-card rounded-card group flex items-center gap-3 p-4 transition-all duration-smooth hover:shadow-md"
              >
                <ArrowLeft
                  size={15}
                  className="text-text-secondary shrink-0 transition-colors duration-smooth group-hover:text-primary"
                  aria-hidden="true"
                />
                <span className="text-body-sm text-text-secondary group-hover:text-text-primary font-medium transition-colors duration-smooth">
                  Back to {cat.title}
                </span>
              </Link>

              {/* Contact */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-body-sm text-text-primary mb-1 font-semibold">
                  Was this helpful?
                </p>
                <p className="text-caption text-text-secondary mb-4 leading-relaxed">
                  If you still have questions, our support team is happy to help.
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

/* ── Block renderer ── */

function BlockRenderer({ block }: { block: SupportBlock }) {
  switch (block.type) {
    case 'lead':
      return (
        <p className="text-body-lg text-text-primary font-medium leading-relaxed">{block.text}</p>
      );

    case 'h2':
      return (
        <h2 className="font-manrope text-text-primary mt-2 text-xl font-bold sm:text-2xl">
          {block.text}
        </h2>
      );

    case 'paragraph':
      return (
        <p className="text-body text-text-secondary leading-relaxed">{block.text}</p>
      );

    case 'steps':
      return (
        <ol className="flex flex-col gap-4">
          {block.items.map((step, idx) => (
            <li
              key={idx}
              className="glass-card rounded-card flex items-start gap-4 p-5"
            >
              <span className="bg-primary text-white font-manrope mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {idx + 1}
              </span>
              <div>
                <p className="text-body-sm text-text-primary mb-1 font-semibold">{step.title}</p>
                <p className="text-body-sm text-text-secondary leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      );

    case 'list':
      return (
        <ul className="flex flex-col gap-2.5">
          {block.items.map((item, idx) => (
            <li
              key={idx}
              className="glass-card rounded-card flex items-start gap-3 px-4 py-3"
            >
              <CheckCircle
                size={16}
                className="text-primary mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span className="text-body-sm text-text-secondary leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'note':
      return <NoteBlock variant={block.variant} text={block.text} />;

    default:
      return null;
  }
}

const NOTE_CONFIG = {
  info: {
    Icon: Info,
    containerClass: 'border-sky-500/30 bg-sky-500/8',
    iconClass: 'text-sky-400',
    labelClass: 'text-sky-400',
    label: 'Note',
  },
  warning: {
    Icon: AlertTriangle,
    containerClass: 'border-amber-500/30 bg-amber-500/8',
    iconClass: 'text-amber-400',
    labelClass: 'text-amber-400',
    label: 'Warning',
  },
  tip: {
    Icon: Lightbulb,
    containerClass: 'border-primary/30 bg-primary/8',
    iconClass: 'text-primary',
    labelClass: 'text-primary',
    label: 'Tip',
  },
};

function NoteBlock({ variant, text }: { variant: 'info' | 'warning' | 'tip'; text: string }) {
  const config = NOTE_CONFIG[variant];
  const { Icon } = config;
  return (
    <div
      className={cn(
        'rounded-xl border px-5 py-4',
        config.containerClass,
      )}
      role="note"
    >
      <div className="flex items-start gap-3">
        <Icon size={16} className={cn('mt-0.5 shrink-0', config.iconClass)} aria-hidden="true" />
        <div>
          <p className={cn('text-body-sm mb-0.5 font-bold', config.labelClass)}>
            {config.label}
          </p>
          <p className="text-body-sm text-text-secondary leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
