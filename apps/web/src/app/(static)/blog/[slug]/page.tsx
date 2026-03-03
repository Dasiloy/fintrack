import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Check } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { StaticPageShell } from '@/app/(static)/_components';
import { BLOG_POSTS } from '../_data';
import type { ContentBlock } from '../_data';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — FinTrack Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const Icon = post.icon;

  const related = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && (p.categorySlug === post.categorySlug || p.featured),
  ).slice(0, 2);

  return (
    <StaticPageShell>
      <div className="mx-auto max-w-[800px] px-4 pb-24 md:px-6">

        {/* Back */}
        <div className="mb-8">
          <Link
            href={STATIC_ROUTES.BLOG}
            className="text-body-sm text-text-secondary hover:text-primary duration-smooth inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Blog
          </Link>
        </div>

        {/* Article header */}
        <article>
          {/* Category pill */}
          <div className="bg-bg-elevated border-border-subtle text-overline text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            {post.category}
          </div>

          {/* Title */}
          <h1 className="font-manrope text-text-primary mb-6 text-3xl font-bold leading-snug tracking-tight sm:text-4xl md:text-5xl">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="border-border-subtle mb-8 flex flex-wrap items-center gap-4 border-b pb-8">
            <div className="flex items-center gap-2.5">
              <div className="from-primary/40 to-primary/10 text-text-primary font-manrope flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold ring-2 ring-primary/20">
                {post.initials}
              </div>
              <div>
                <p className="text-body-sm text-text-primary font-semibold leading-tight">{post.author}</p>
                <p className="text-caption text-text-disabled leading-tight">{post.role}</p>
              </div>
            </div>

            <span className="text-caption text-text-disabled flex items-center gap-1.5">
              <Clock size={12} aria-hidden="true" />
              {post.date}
            </span>

            <span className="bg-primary/15 text-primary rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide">
              {post.readTime} min read
            </span>
          </div>

          {/* Hero gradient image */}
          <div
            className={`rounded-card relative mb-10 flex aspect-video w-full items-center justify-center overflow-hidden bg-linear-to-br ${post.gradientFrom} ${post.gradientTo}`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <Icon size={80} className="text-white/20" aria-hidden="true" />
          </div>

          {/* Body content */}
          <div className="flex flex-col gap-6">
            {post.body.map((block: ContentBlock, i: number) => (
              <BlockRenderer key={i} block={block} />
            ))}
          </div>
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-16" aria-label="Keep reading">
            <div className="border-border-subtle mb-8 flex items-center justify-between border-t pt-8">
              <h2 className="font-manrope text-text-primary text-xl font-bold">Keep Reading</h2>
              <Link
                href={STATIC_ROUTES.BLOG}
                className="text-primary text-body-sm font-semibold transition-opacity hover:opacity-75"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {related.map((p) => {
                const RelatedIcon = p.icon;
                return (
                  <Link
                    key={p.slug}
                    href={`${STATIC_ROUTES.BLOG}/${p.slug}`}
                    className="group rounded-card bg-bg-elevated border-border-subtle hover:border-primary/25 flex flex-col overflow-hidden border transition-all duration-smooth hover:-translate-y-0.5"
                  >
                    <div
                      className={`relative flex h-32 w-full items-center justify-center bg-linear-to-br ${p.gradientFrom} ${p.gradientTo}`}
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
                          backgroundSize: '18px 18px',
                        }}
                      />
                      <RelatedIcon size={32} className="text-white/20" aria-hidden="true" />
                    </div>
                    <div className="p-4">
                      <p className="text-caption text-primary mb-1 font-bold uppercase tracking-wide">
                        {p.category}
                      </p>
                      <h3 className="text-body-sm text-text-primary group-hover:text-primary font-bold leading-snug transition-colors">
                        {p.title}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </StaticPageShell>
  );
}

/* ── Body block renderer ── */

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'lead':
      return (
        <p className="text-body-lg text-text-primary leading-relaxed font-medium">
          {block.text}
        </p>
      );

    case 'divider':
      return (
        <div className="from-transparent via-border-subtle to-transparent my-4 h-px bg-linear-to-r" />
      );

    case 'h2':
      return (
        <h2 className="font-manrope text-text-primary mt-4 text-xl font-bold sm:text-2xl">
          {block.text}
        </h2>
      );

    case 'paragraph':
      return (
        <p className="text-body text-text-secondary leading-relaxed">
          {block.text}
        </p>
      );

    case 'blockquote':
      return (
        <blockquote className="glass-card rounded-card relative overflow-hidden border-l-4 border-primary px-6 py-5">
          <p className="text-body text-text-primary font-semibold italic leading-relaxed">
            {block.text}
          </p>
        </blockquote>
      );

    case 'list':
      return (
        <ul className="flex flex-col gap-3">
          {block.items.map((item) => (
            <li
              key={item.title}
              className="rounded-card bg-bg-elevated border-border-subtle hover:bg-bg-surface-hover flex items-start gap-3 border px-4 py-3.5 transition-colors duration-smooth"
            >
              <span className="bg-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                <Check size={12} className="text-white" aria-hidden="true" />
              </span>
              <div>
                <p className="text-body-sm text-text-primary mb-0.5 font-semibold">{item.title}</p>
                <p className="text-body-sm text-text-secondary leading-relaxed">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
}
