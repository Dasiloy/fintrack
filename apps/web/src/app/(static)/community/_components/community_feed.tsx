'use client';

import Link from 'next/link';
import { MessageSquare, ThumbsUp, Flame, Clock, Inbox } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import type { Discussion } from '../_data';
import { TRENDING_TAGS, COMMUNITY_STATS, AMA_EVENT } from '../_data';

interface CommunityFeedProps {
  discussions: Discussion[];
  hasMore: boolean;
  onLoadMore: () => void;
  /** True when a search filter is active — adjusts empty state copy */
  isFiltered: boolean;
}

/**
 * Main content area — 2-col grid:
 *   Left (lg:2/3)  Filtered discussion list + Load More
 *   Right (lg:1/3) Sidebar: trending tags, community stats, AMA widget
 *
 * Discussions and load-more are driven by props from `CommunityHub`.
 */
export function CommunityFeed({ discussions, hasMore, onLoadMore, isFiltered }: CommunityFeedProps) {
  return (
    <>
      {/* Stagger keyframes — scoped to this component tree */}
      <style>{`
        @keyframes _ft-slide-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ft-discussion-item {
          animation: _ft-slide-up 0.35s ease-out both;
        }
      `}</style>

      <section className="mx-auto mb-16 max-w-[1200px] px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Left: discussions ─────────────────────────── */}
          <div className="lg:col-span-2">
            <h2 className="font-manrope text-text-primary mb-6 px-1 text-2xl font-bold tracking-tight">
              {isFiltered ? 'Search Results' : 'Featured Discussions'}
            </h2>

            {discussions.length === 0 ? (
              /* Empty state */
              <div className="rounded-card bg-bg-elevated border-border-subtle flex flex-col items-center gap-3 border py-16 text-center">
                <Inbox size={32} className="text-text-disabled" />
                <p className="text-body text-text-secondary">
                  No discussions matched your search.
                </p>
                <p className="text-body-sm text-text-tertiary">
                  Try different keywords or browse the topics above.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {discussions.map(({ slug, topicSlug, initials, authorName, timeAgo, isOnline, tag, tagClass, title, excerpt, comments, likes }, idx) => (
                  <Link
                    key={slug}
                    href={`${STATIC_ROUTES.COMMUNITY}/${topicSlug}/${slug}`}
                    className="ft-discussion-item group rounded-card bg-bg-elevated border-border-subtle hover:bg-bg-surface-hover hover:border-border-light flex flex-col gap-4 border p-5 transition-all duration-smooth hover:-translate-y-0.5 sm:flex-row"
                    style={{ animationDelay: `${idx * 60}ms` }}
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
                        {title}
                      </h3>

                      <p className="text-body-sm text-text-secondary mb-3 line-clamp-2 leading-relaxed">
                        {excerpt}
                      </p>

                      <div className="text-body-sm text-text-disabled flex items-center gap-6">
                        <span className="hover:text-text-primary flex items-center gap-1.5 transition-colors">
                          <MessageSquare size={15} aria-hidden="true" />
                          {comments} Comments
                        </span>
                        <span className="hover:text-text-primary flex items-center gap-1.5 transition-colors">
                          <ThumbsUp size={15} aria-hidden="true" />
                          {likes} Likes
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <button
                type="button"
                onClick={onLoadMore}
                className="border-border-subtle text-body text-text-secondary hover:bg-bg-elevated hover:text-text-primary duration-smooth mt-6 w-full rounded-lg border bg-transparent py-3 font-medium transition-all"
              >
                Load More Discussions
              </button>
            )}
          </div>

          {/* ── Right: sidebar ────────────────────────────── */}
          <aside className="flex flex-col gap-5">
            {/* Trending Tags */}
            <div className="rounded-card bg-bg-elevated border-border-subtle border p-5">
              <h3 className="font-manrope text-text-primary mb-4 flex items-center gap-2 text-lg font-bold">
                <Flame size={18} className="text-primary" aria-hidden="true" />
                Trending Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-card bg-bg-deep border-border-subtle text-body-sm text-text-secondary hover:text-primary hover:border-primary/40 duration-smooth border px-3 py-1.5 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="rounded-card bg-bg-elevated border-border-subtle border p-5">
              <h3 className="font-manrope text-text-primary mb-4 text-lg font-bold">
                Community Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {COMMUNITY_STATS.map(({ value, label, accent, fullWidth }) => (
                  <div
                    key={label}
                    className={`bg-bg-deep rounded-card flex flex-col items-center justify-center p-3 text-center ${fullWidth ? 'col-span-2' : ''}`}
                  >
                    <p className={`font-manrope text-2xl font-bold ${accent ? 'text-primary' : 'text-text-primary'}`}>
                      {value}
                    </p>
                    <p className="text-caption text-text-tertiary">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AMA Event */}
            <div className="from-primary/15 rounded-card border-border-subtle border bg-linear-to-br to-transparent p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="from-primary/40 to-primary/10 font-manrope text-text-primary flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold">
                  {AMA_EVENT.initials}
                </div>
                <div>
                  <p className="text-body text-text-primary font-bold">{AMA_EVENT.title}</p>
                  <p className="text-body-sm text-primary font-medium">{AMA_EVENT.statusLabel}</p>
                </div>
              </div>
              <p className="text-body-sm text-text-secondary mb-4 leading-relaxed">
                {AMA_EVENT.description}
              </p>
              <button
                type="button"
                className="bg-primary/15 hover:bg-primary/25 text-primary text-body-sm duration-smooth w-full rounded-lg py-2 font-bold uppercase tracking-wide transition-colors"
              >
                Set Reminder
              </button>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
