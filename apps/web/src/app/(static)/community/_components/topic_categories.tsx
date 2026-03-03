import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import { TOPIC_CATEGORIES } from '../_data';

/**
 * "Explore Topics" — four clickable category cards that navigate to the
 * filtered topic page at `/community/[slug]`.
 */
export function TopicCategories() {
  return (
    <section className="mx-auto mb-16 max-w-[1200px] px-4 md:px-6">
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between px-1">
        <h2 className="font-manrope text-text-primary text-2xl font-bold tracking-tight">
          Explore Topics
        </h2>
        <Link
          href={STATIC_ROUTES.COMMUNITY}
          className="text-body-sm text-primary hover:text-primary/80 duration-smooth flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOPIC_CATEGORIES.map(({ icon: Icon, title, description, slug, gradientClass, iconClass }, idx) => (
          <Link
            key={slug}
            href={`${STATIC_ROUTES.COMMUNITY}/${slug}`}
            className="group rounded-card bg-bg-elevated border-border-subtle hover:border-primary/30 relative flex h-52 flex-col justify-end overflow-hidden border p-6 transition-all duration-smooth hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(124,122,255,0.12)]"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            {/* Gradient layer */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 bg-linear-to-br ${gradientClass}`}
            />

            {/* Dot-grid pattern */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Icon */}
            <div
              className={`bg-bg-deep/40 absolute top-5 left-5 flex size-10 items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-smooth group-hover:scale-110 ${iconClass}`}
            >
              <Icon size={20} aria-hidden="true" />
            </div>

            {/* Text */}
            <div className="relative z-10">
              <h3 className="font-manrope text-text-primary mb-1 text-lg font-bold">{title}</h3>
              <p className="text-body-sm text-text-secondary line-clamp-2">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
