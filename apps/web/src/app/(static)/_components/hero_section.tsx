import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

/**
 * Landing page hero — badge, headline, subtitle, CTA, and a static
 * dashboard mockup preview that illustrates the product's UI.
 */
export function HeroSection() {
  return (
    <section className="mx-auto mb-24 max-w-[1200px] px-4 text-center md:px-6">
      {/* Live badge */}
      <div className="bg-bg-elevated border-border-subtle text-overline text-primary mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
        </span>
        New: AI-Powered Budgeting 2.0
      </div>

      {/* Headline */}
      <h1 className="font-manrope text-text-primary mb-6 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-[72px]">
        Master Your Money <br />
        <span className="to-primary bg-linear-to-r from-white bg-clip-text text-transparent">
          With Intelligent Insight
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-body-lg text-text-secondary mx-auto mb-10 max-w-2xl leading-relaxed font-light">
        Experience the future of financial management. Track, budget, and save with a platform
        designed for clarity, not clutter.
      </p>

      {/* Primary CTA */}
      <div className="mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href={AUTH_ROUTES.SIGNUP}
          className="glossy-button rounded-card text-body-lg text-text-primary shadow-glow inline-flex w-auto items-center justify-center gap-2 px-8 py-3.5 font-bold"
        >
          Get Started
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Dashboard mockup */}
      <DashboardMockup />
    </section>
  );
}

/** Purely decorative dashboard UI skeleton — no real data. */
function DashboardMockup() {
  const bars = [40, 60, 30, 80, 55, 70, 45, 95] as const;

  return (
    <div className="glass-card border-border-light shadow-primary/10 relative mx-auto w-full max-w-5xl overflow-hidden rounded-[20px] border shadow-2xl">
      {/* Gradient fade at bottom */}
      <div className="from-bg-deep pointer-events-none absolute inset-0 z-10 bg-linear-to-t via-transparent to-transparent opacity-60" />

      <div className="flex h-[260px] gap-4 p-5 sm:h-[340px] md:h-[400px] md:p-6">
        {/* Sidebar skeleton */}
        <div className="bg-bg-elevated rounded-card border-border-subtle hidden w-44 shrink-0 flex-col gap-3 border p-4 sm:flex">
          <div className="bg-primary/30 mb-3 size-8 rounded-full" />
          <div className="bg-bg-surface-hover h-2.5 w-24 rounded-full" />
          <div className="bg-bg-surface-hover h-2.5 w-32 rounded-full" />
          <div className="bg-bg-surface-hover h-2.5 w-20 rounded-full" />
          <div className="bg-bg-surface-hover h-2.5 w-28 rounded-full" />
          <div className="rounded-button bg-primary/10 border-primary/20 mt-auto h-9 w-full border" />
        </div>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Top bar */}
          <div className="bg-bg-elevated rounded-button border-border-subtle flex h-11 shrink-0 items-center justify-between border px-4">
            <div className="bg-bg-surface-hover h-3 w-28 rounded-full" />
            <div className="flex gap-2">
              <div className="bg-bg-surface-hover size-7 rounded-full" />
              <div className="bg-bg-surface-hover size-7 rounded-full" />
            </div>
          </div>

          {/* Content grid */}
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
            {/* Bar chart */}
            <div className="bg-bg-elevated rounded-card border-border-subtle col-span-3 flex items-end gap-2 overflow-hidden border px-5 pb-5 sm:col-span-2">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    background: `rgba(124, 122, 255, ${0.2 + (i / (bars.length - 1)) * 0.8})`,
                    boxShadow: i === bars.length - 1 ? '0 0 14px rgba(124,122,255,0.5)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Stat cards */}
            <div className="col-span-3 flex flex-col gap-3 sm:col-span-1">
              <div className="bg-bg-elevated rounded-card border-border-subtle flex flex-1 flex-col justify-center border p-4">
                <p className="text-h3 font-manrope text-text-primary mb-1 font-bold">$12,450</p>
                <span className="text-caption text-success flex items-center gap-1">
                  <span aria-hidden>↑</span>
                  +14%
                </span>
              </div>
              <div className="bg-bg-elevated rounded-card border-border-subtle flex flex-1 flex-col justify-center border p-4">
                <p className="text-h3 font-manrope text-text-primary mb-1 font-bold">85%</p>
                <p className="text-caption text-text-tertiary">Goal Reached</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
