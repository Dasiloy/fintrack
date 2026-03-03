import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, Clock, LogIn } from 'lucide-react';

import { STATIC_ROUTES, AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { StaticPageShell } from '../../../_components';
import { TOPIC_CATEGORIES, DISCUSSIONS, MOCK_COMMENTS } from '../../_data';

interface DiscussionPageProps {
  params: Promise<{ topic: string; discussion: string }>;
}

export async function generateStaticParams() {
  return DISCUSSIONS.map(({ topicSlug, slug }) => ({
    topic: topicSlug,
    discussion: slug,
  }));
}

export async function generateMetadata({ params }: DiscussionPageProps) {
  const { discussion } = await params;
  const post = DISCUSSIONS.find((d) => d.slug === discussion);
  if (!post) return {};
  return {
    title: `${post.title} — FinTrack Community`,
    description: post.excerpt,
  };
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { topic, discussion } = await params;

  const category = TOPIC_CATEGORIES.find((c) => c.slug === topic);
  const post = DISCUSSIONS.find((d) => d.slug === discussion && d.topicSlug === topic);
  if (!category || !post) notFound();

  const { icon: CategoryIcon, title: categoryTitle, iconClass } = category;

  return (
    <StaticPageShell>
      <div className="mx-auto max-w-[800px] px-4 pb-24 md:px-6">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="text-caption text-text-tertiary flex flex-wrap items-center gap-2">
            <li>
              <Link href={STATIC_ROUTES.COMMUNITY} className="hover:text-primary duration-smooth transition-colors">
                Community
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`${STATIC_ROUTES.COMMUNITY}/${topic}`}
                className="hover:text-primary duration-smooth inline-flex items-center gap-1 transition-colors"
              >
                <CategoryIcon size={12} className={iconClass} aria-hidden="true" />
                {categoryTitle}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-text-secondary line-clamp-1 max-w-[200px]">{post.title}</li>
          </ol>
        </nav>

        {/* Post card */}
        <article className="rounded-card bg-bg-elevated border-border-subtle mb-8 border p-6 sm:p-8">
          {/* Header */}
          <div className="mb-5 flex items-start gap-4">
            <div className="from-primary/40 to-primary/10 font-manrope text-text-primary flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold ring-2 ring-primary/30">
              {post.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${post.tagClass}`}>
                  {post.tag}
                </span>
                <span className="text-caption text-text-disabled flex items-center gap-1">
                  <Clock size={11} aria-hidden="true" />
                  Posted by {post.authorName} · {post.timeAgo}
                </span>
              </div>
              <h1 className="font-manrope text-text-primary mt-2 text-xl font-bold leading-snug sm:text-2xl">
                {post.title}
              </h1>
            </div>
          </div>

          {/* Body */}
          <p className="text-body text-text-secondary mb-6 leading-relaxed">{post.body}</p>

          {/* Reactions */}
          <div className="border-border-subtle flex items-center gap-6 border-t pt-4">
            <span className="text-body-sm text-text-secondary flex items-center gap-2">
              <ThumbsUp size={16} className="text-primary" aria-hidden="true" />
              {post.likes} Likes
            </span>
            <span className="text-body-sm text-text-secondary flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" aria-hidden="true" />
              {post.comments} Comments
            </span>
          </div>
        </article>

        {/* Comments */}
        <section aria-label="Comments">
          <h2 className="font-manrope text-text-primary mb-5 text-xl font-bold">
            Comments ({post.comments})
          </h2>

          <div className="flex flex-col gap-4">
            {MOCK_COMMENTS.map(({ initials, authorName, timeAgo, body }) => (
              <div
                key={authorName}
                className="rounded-card bg-bg-elevated border-border-subtle flex gap-4 border p-5"
              >
                <div className="from-primary/30 to-primary/5 font-manrope text-text-primary flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-caption text-text-disabled mb-1 flex items-center gap-1">
                    <span className="text-body-sm text-text-primary font-semibold">{authorName}</span>
                    <span>·</span>
                    <span>{timeAgo}</span>
                  </div>
                  <p className="text-body-sm text-text-secondary leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reply CTA */}
        <div className="glass-card rounded-card border-border-subtle mt-8 border p-6 text-center">
          <p className="text-body text-text-secondary mb-4">
            Join the conversation — sign in to reply.
          </p>
          <Link
            href={AUTH_ROUTES.SIGNUP}
            className="glossy-button rounded-button text-body text-text-primary shadow-glow inline-flex items-center gap-2 px-6 py-2.5 font-bold"
          >
            <LogIn size={15} aria-hidden="true" />
            Sign up to reply
          </Link>
        </div>
      </div>
    </StaticPageShell>
  );
}
