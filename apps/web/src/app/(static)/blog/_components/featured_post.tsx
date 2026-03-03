import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import type { BlogPost } from '../_data';

interface FeaturedPostProps {
  post: BlogPost;
}

/**
 * Large featured article card — shown at the top of the blog listing.
 * Uses a gradient placeholder instead of an external image.
 */
export function FeaturedPost({ post }: FeaturedPostProps) {
  const Icon = post.icon;

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-14 md:px-6">
      <Link
        href={`${STATIC_ROUTES.BLOG}/${post.slug}`}
        className="group rounded-card bg-bg-elevated border-border-subtle relative block overflow-hidden border transition-all duration-smooth hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_40px_rgba(124,122,255,0.12)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Gradient image placeholder */}
          <div
            className={`relative flex h-56 w-full items-center justify-center overflow-hidden bg-linear-to-br ${post.gradientFrom} ${post.gradientTo} lg:h-full lg:min-h-[320px]`}
          >
            {/* Dot-grid texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
            <Icon
              size={72}
              className="text-white/20 transition-transform duration-500 group-hover:scale-110"
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="relative flex flex-col justify-center p-8 lg:p-12">
            <div className="mb-4 flex items-center gap-3">
              <span className="bg-primary/15 text-primary rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                Featured
              </span>
              <span className="text-caption text-text-disabled flex items-center gap-1">
                <Clock size={11} aria-hidden="true" />
                {post.date}
              </span>
            </div>

            <h2 className="font-manrope text-text-primary group-hover:text-primary mb-4 text-2xl font-bold leading-snug transition-colors md:text-3xl">
              {post.title}
            </h2>

            <p className="text-body text-text-secondary mb-8 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between">
              {/* Author */}
              <div className="flex items-center gap-2.5">
                <div className="from-primary/40 to-primary/10 text-text-primary font-manrope flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold ring-2 ring-primary/20">
                  {post.initials}
                </div>
                <div>
                  <p className="text-body-sm text-text-primary font-semibold leading-tight">{post.author}</p>
                  <p className="text-caption text-text-disabled leading-tight">{post.role}</p>
                </div>
              </div>

              <span className="text-primary text-body-sm inline-flex items-center gap-1.5 font-bold transition-transform group-hover:translate-x-0.5">
                Read Full Article
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
