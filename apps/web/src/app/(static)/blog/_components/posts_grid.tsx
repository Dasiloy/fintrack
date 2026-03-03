'use client';

import Link from 'next/link';
import { Inbox, Clock, ArrowRight } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import type { BlogPost } from '../_data';

interface PostsGridProps {
  posts: BlogPost[];
  hasMore: boolean;
  onLoadMore: () => void;
  isFiltered: boolean;
}

/**
 * 3-column article grid with staggered slide-up animation.
 */
export function PostsGrid({ posts, hasMore, onLoadMore, isFiltered }: PostsGridProps) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-20 md:px-6">
      <style>{`
        @keyframes _ft-blog-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ft-blog-card {
          opacity: 0;
          animation: _ft-blog-up 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      {posts.length === 0 ? (
        <div className="rounded-card bg-bg-elevated border-border-subtle flex flex-col items-center gap-3 border py-24 text-center">
          <Inbox size={32} className="text-text-disabled" aria-hidden="true" />
          <p className="text-body text-text-secondary">
            {isFiltered ? 'No articles match your search.' : 'No articles yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, idx) => {
              const Icon = post.icon;
              return (
                <Link
                  key={post.slug}
                  href={`${STATIC_ROUTES.BLOG}/${post.slug}`}
                  className="ft-blog-card group rounded-card bg-bg-elevated border-border-subtle hover:bg-bg-surface-hover hover:border-primary/20 flex flex-col overflow-hidden border transition-all duration-smooth hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(124,122,255,0.1)]"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Gradient image area */}
                  <div
                    className={`relative flex h-44 w-full shrink-0 items-center justify-center overflow-hidden bg-linear-to-br ${post.gradientFrom} ${post.gradientTo}`}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    />
                    <Icon
                      size={44}
                      className="text-white/20 transition-transform duration-500 group-hover:scale-110"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                        {post.category}
                      </span>
                      <span className="text-caption text-text-disabled flex items-center gap-1">
                        <Clock size={11} aria-hidden="true" />
                        {post.readTime} min read
                      </span>
                    </div>

                    <h3 className="font-manrope text-text-primary group-hover:text-primary mb-2 font-bold leading-snug transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-body-sm text-text-secondary mb-5 line-clamp-3 flex-1 leading-relaxed">
                      {post.excerpt}
                    </p>

                    <span className="text-primary text-body-sm mt-auto inline-flex items-center gap-1 font-bold transition-transform group-hover:translate-x-0.5">
                      Read More
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={onLoadMore}
                className="rounded-button border-border-light text-text-secondary hover:border-primary/50 hover:text-text-primary text-body border px-8 py-2.5 font-semibold transition-all duration-smooth"
              >
                Load more articles
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
