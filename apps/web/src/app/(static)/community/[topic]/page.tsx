import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, Clock } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { StaticPageShell } from '../../_components';
import { TOPIC_CATEGORIES, DISCUSSIONS } from '../_data';

interface TopicPageProps {
  params: Promise<{ topic: string }>;
}

export async function generateStaticParams() {
  return TOPIC_CATEGORIES.map(({ slug }) => ({ topic: slug }));
}

export async function generateMetadata({ params }: TopicPageProps) {
  const { topic } = await params;
  const category = TOPIC_CATEGORIES.find((c) => c.slug === topic);
  if (!category) return {};
  return {
    title: `${category.title} — FinTrack Community`,
    description: category.description,
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { topic } = await params;

  const category = TOPIC_CATEGORIES.find((c) => c.slug === topic);
  if (!category) notFound();

  const { icon: Icon, title, description, gradientClass, iconClass } = category;
  const discussions = DISCUSSIONS.filter((d) => d.topicSlug === topic);

  return (
    <StaticPageShell>
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href={STATIC_ROUTES.COMMUNITY}
            className="text-body-sm text-text-secondary hover:text-primary duration-smooth inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Community
          </Link>
        </div>

        {/* Topic header card */}
        <div className={`rounded-card bg-bg-elevated border-border-subtle relative mb-10 overflow-hidden border p-8`}>
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 bg-linear-to-br ${gradientClass} opacity-60`}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10 flex items-center gap-5">
            <div className={`bg-bg-deep/50 flex size-14 items-center justify-center rounded-full backdrop-blur-sm ${iconClass}`}>
              <Icon size={26} aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-manrope text-text-primary text-2xl font-bold sm:text-3xl">
                {title}
              </h1>
              <p className="text-body text-text-secondary mt-1">{description}</p>
              <p className="text-caption text-text-tertiary mt-2">
                {discussions.length} discussion{discussions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Discussion list */}
        {discussions.length === 0 ? (
          <div className="rounded-card bg-bg-elevated border-border-subtle flex flex-col items-center gap-3 border py-20 text-center">
            <p className="text-body text-text-secondary">No discussions yet in this topic.</p>
            <p className="text-body-sm text-text-tertiary">Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {discussions.map(({ slug, topicSlug, initials, authorName, timeAgo, isOnline, tag, tagClass, title: postTitle, excerpt, comments, likes }) => (
              <Link
                key={slug}
                href={`${STATIC_ROUTES.COMMUNITY}/${topicSlug}/${slug}`}
                className="group rounded-card bg-bg-elevated border-border-subtle hover:bg-bg-surface-hover hover:border-border-light flex flex-col gap-4 border p-5 transition-all duration-smooth hover:-translate-y-0.5 sm:flex-row"
              >
                {/* Avatar */}
                <div className="relative shrink-0 self-start">
                  <div className="from-primary/40 to-primary/10 font-manrope text-text-primary flex size-12 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold ring-2 ring-primary/30">
                    {initials}
                  </div>
                  {isOnline && (
                    <span
                      aria-label="Online"
                      className="bg-success border-bg-elevated absolute right-0 bottom-0 size-3 rounded-full border-2"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tagClass}`}>
                      {tag}
                    </span>
                    <span className="text-caption text-text-disabled flex items-center gap-1">
                      <Clock size={11} aria-hidden="true" />
                      Posted by {authorName} · {timeAgo}
                    </span>
                  </div>

                  <h3 className="text-body font-manrope text-text-primary group-hover:text-primary mb-2 font-bold transition-colors duration-smooth">
                    {postTitle}
                  </h3>

                  <p className="text-body-sm text-text-secondary mb-3 line-clamp-2 leading-relaxed">
                    {excerpt}
                  </p>

                  <div className="text-body-sm text-text-disabled flex items-center gap-6">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={15} aria-hidden="true" />
                      {comments} Comments
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp size={15} aria-hidden="true" />
                      {likes} Likes
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 mb-24" />
      </div>
    </StaticPageShell>
  );
}
