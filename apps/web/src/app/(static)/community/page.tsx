import Link from 'next/link';
import { Users, PiggyBank, TrendingUp, Trophy, Lightbulb } from 'lucide-react';

import { STATIC_ROUTES, AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { StaticPageShell } from '../_components';

export const metadata = {
  title: 'Community — FinTrack',
  description:
    'The FinTrack Community is coming soon. A space for Nigerian personal finance discussions, budgeting tips, and investment strategies.',
};

const PREVIEW_TOPICS = [
  {
    icon: PiggyBank,
    title: 'Budgeting Tips',
    description: 'Share what works for managing your naira month to month.',
    gradientClass: 'from-primary/20 to-transparent',
    iconClass: 'text-primary',
  },
  {
    icon: TrendingUp,
    title: 'Investment Strategies',
    description: 'From NSE stocks to mutual funds and dollar assets.',
    gradientClass: 'from-emerald-500/20 to-transparent',
    iconClass: 'text-emerald-400',
  },
  {
    icon: Trophy,
    title: 'Success Stories',
    description: 'Milestones worth sharing, big and small.',
    gradientClass: 'from-amber-500/20 to-transparent',
    iconClass: 'text-amber-400',
  },
  {
    icon: Lightbulb,
    title: 'Feature Requests',
    description: 'Tell us what would make FinTrack more useful for you.',
    gradientClass: 'from-violet-500/20 to-transparent',
    iconClass: 'text-violet-400',
  },
] as const;

export default function CommunityPage() {
  return (
    <StaticPageShell>
      <div className="mx-auto max-w-[1200px] px-4 pb-32 pt-10 md:px-6">

        {/* Hero */}
        <div className="glass-card border-border-light relative mb-16 overflow-hidden rounded-[24px] border px-8 py-20 text-center md:py-28">
          {/* Ambient blobs */}
          <div
            aria-hidden="true"
            className="bg-primary/20 animate-landing-float pointer-events-none absolute top-[-30%] left-[-5%] h-[60%] w-[50%] rounded-full blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="bg-primary/10 animate-landing-float-delayed pointer-events-none absolute right-[-5%] bottom-[-30%] h-[50%] w-[40%] rounded-full blur-[100px]"
          />

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6">
            {/* Badge */}
            <div className="bg-bg-elevated border-border-light text-overline text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
              </span>
              Coming Soon
            </div>

            {/* Heading */}
            <h1 className="font-manrope text-text-primary text-4xl font-black tracking-tight drop-shadow-[0_0_25px_rgba(124,122,255,0.2)] sm:text-5xl lg:text-6xl">
              The FinTrack{' '}
              <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
                Community
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-body-lg text-text-secondary max-w-lg font-light leading-relaxed">
              A space for real conversations about money in Nigeria. Budgeting questions, investment decisions, wins worth sharing. Being built now.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href={STATIC_ROUTES.CONTACT}
                className="glossy-button rounded-button text-body text-white shadow-glow inline-flex items-center gap-2 px-8 py-3 font-bold"
              >
                <Users size={16} aria-hidden="true" />
                Get notified at launch
              </Link>
              <Link
                href={AUTH_ROUTES.SIGNUP}
                className="border-border-light text-body text-text-secondary hover:bg-bg-elevated hover:text-text-primary duration-smooth inline-flex items-center gap-2 rounded-lg border bg-transparent px-8 py-3 font-bold transition-all"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>

        {/* Preview topics */}
        <div className="mb-10 text-center">
          <p className="text-overline text-text-tertiary mb-2">What to expect</p>
          <h2 className="font-manrope text-text-primary text-2xl font-bold tracking-tight">
            Four topic areas, built for Nigerian context
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PREVIEW_TOPICS.map(({ icon: Icon, title, description, gradientClass, iconClass }) => (
            <div
              key={title}
              className="rounded-card bg-bg-elevated border-border-light relative flex h-52 flex-col justify-end overflow-hidden border p-6 opacity-60"
            >
              {/* Gradient layer */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 bg-linear-to-br ${gradientClass}`}
              />

              {/* Dot-grid */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Soon pill */}
              <div className="bg-bg-deep/70 absolute top-3 right-3 rounded-full px-2.5 py-0.5 backdrop-blur-sm">
                <p className="text-caption text-text-tertiary font-semibold tracking-wide">Soon</p>
              </div>

              {/* Icon */}
              <div
                className={`bg-bg-deep/40 absolute top-5 left-5 flex size-10 items-center justify-center rounded-full backdrop-blur-sm ${iconClass}`}
              >
                <Icon size={20} aria-hidden="true" />
              </div>

              {/* Text */}
              <div className="relative z-10">
                <h3 className="font-manrope text-text-primary mb-1 text-lg font-bold">{title}</h3>
                <p className="text-body-sm text-text-secondary line-clamp-2">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-body-sm text-text-tertiary mt-12 text-center">
          Community is coming soon.{' '}
          <Link
            href={STATIC_ROUTES.CONTACT}
            className="text-primary underline underline-offset-2 transition-opacity hover:opacity-75"
          >
            Leave your email
          </Link>{' '}
          to be among the first in.
        </p>

      </div>
    </StaticPageShell>
  );
}

/*
 * ─── Community Hub — activate when community feature is live ─────────────────
 *
 * import { CommunityHub, CommunityCta } from './_components';
 *
 * export default function CommunityPage() {
 *   return (
 *     <StaticPageShell>
 *       <CommunityHub />
 *       <CommunityCta />
 *     </StaticPageShell>
 *   );
 * }
 */
