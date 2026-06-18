import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AUTH_ROUTES, STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

export function HeroSection() {
  return (
    <section className="mx-auto mb-24 max-w-[1200px] px-4 md:px-6">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-8 lg:gap-16">

        {/* ── Left: copy ────────────────────────────────── */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          {/* Badge */}
          <div className="bg-bg-elevated border-border-light text-overline text-primary mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
            </span>
            Personal finance for Nigerians
          </div>

          {/* Headline */}
          <h1 className="font-manrope text-text-primary mb-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[60px]">
            Know exactly <br />
            <span className="to-primary bg-linear-to-r from-gradient-text-from bg-clip-text text-transparent">
              where every <br className="hidden lg:block" />naira goes.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-body-lg text-text-secondary mb-10 max-w-md leading-relaxed font-light">
            Connect your Nigerian bank account, track spending automatically, and build the
            financial clarity you have been missing. Free to start.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <Link
              href={AUTH_ROUTES.SIGNUP}
              className="glossy-button rounded-card text-body-lg text-white shadow-glow inline-flex items-center gap-2 px-8 py-3.5 font-bold"
            >
              Start for free
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href={STATIC_ROUTES.PRICING}
              className="text-body text-text-secondary hover:text-text-primary font-semibold transition-colors duration-smooth"
            >
              See pricing
            </Link>
          </div>
        </div>

        {/* ── Right: intertwined cards ───────────────────── */}
        <div className="relative h-[440px]">
          {/* Ambient glow behind cards */}
          <div
            aria-hidden="true"
            className="bg-primary/15 pointer-events-none absolute top-1/2 left-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
          />

          {/* Card 1 — Financial Health Score (background) */}
          <div className="glass-card border-border-light absolute top-0 left-0 right-[12%] z-10 rounded-[18px] border p-5 shadow-2xl">
            {/* Category label */}
            <div className="text-overline text-violet-400 mb-4 flex items-center gap-1.5 font-bold tracking-widest">
              <span className="inline-block size-1.5 rounded-full bg-violet-400" />
              INTELLIGENCE
            </div>

            <div className="flex items-center gap-5">
              {/* Score ring */}
              <div className="relative flex size-[76px] shrink-0 items-center justify-center">
                <svg viewBox="0 0 80 80" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
                  <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(124,122,255,0.12)" strokeWidth="7" />
                  <circle
                    cx="40" cy="40" r="33" fill="none"
                    stroke="rgba(124,122,255,0.9)" strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="207.3"
                    strokeDashoffset="45.6"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(124,122,255,0.55))' }}
                  />
                </svg>
                <span className="font-manrope text-lg font-black text-text-primary">78</span>
              </div>

              {/* Score detail */}
              <div className="min-w-0 flex-1">
                <p className="font-manrope text-text-primary mb-0.5 font-bold">Financial Health</p>
                <p className="text-caption text-text-tertiary mb-3">Good — mostly on track</p>
                <div className="space-y-1.5">
                  {([
                    { label: 'Income', pct: 90, color: 'bg-emerald-400' },
                    { label: 'Spending', pct: 72, color: 'bg-primary' },
                    { label: 'Savings', pct: 68, color: 'bg-amber-400' },
                  ] as const).map(({ label, pct, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-caption w-14 shrink-0 text-text-disabled">{label}</span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-deep">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 — Smart Recurring (foreground, overlaps bottom-right of card 1) */}
          <div className="glass-card border-border-light absolute bottom-0 right-0 left-[16%] z-20 rounded-[18px] border p-5 shadow-2xl">
            {/* Category label */}
            <div className="text-overline text-amber-400 mb-3 flex items-center gap-1.5 font-bold tracking-widest">
              <span className="inline-block size-1.5 rounded-full bg-amber-400" />
              SCHEDULE
            </div>
            <p className="font-manrope text-text-primary mb-3 font-bold">Smart Recurring</p>

            <div className="space-y-2.5">
              {([
                { name: 'MTN Data Top-up', freq: 'Monthly', amount: '₦25,000' },
                { name: 'DSTV', freq: 'Monthly', amount: '₦24,500' },
                { name: 'Electricity', freq: 'Bi-weekly', amount: '₦15,000' },
              ] as const).map(({ name, freq, amount }) => (
                <div key={name} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-body-sm text-text-primary truncate font-medium">{name}</p>
                    <p className="text-caption text-text-disabled">{freq}</p>
                  </div>
                  <span className="text-body-sm text-text-secondary shrink-0 font-bold">{amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating chip — AI insight */}
          <div className="glass-card border-border-light animate-landing-float absolute top-[34%] right-1 z-30 rounded-[12px] border p-3 shadow-2xl">
            <div className="flex items-start gap-2">
              <span className="bg-primary mt-0.5 inline-block size-1.5 shrink-0 rounded-full" />
              <p className="text-caption text-text-secondary max-w-[148px] leading-snug">
                You spent 18% less on food this month.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
