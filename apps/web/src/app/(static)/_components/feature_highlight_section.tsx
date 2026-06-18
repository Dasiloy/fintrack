import Link from 'next/link';
import { CheckCircle, ArrowDown } from 'lucide-react';

import { FEATURE_CHECKLIST } from '../_data';

/**
 * Two-column feature highlight — showcases the Financial Health Score.
 * Left: copy + checklist + CTA link.
 * Right: decorative score card mockup.
 */
export function FeatureHighlightSection() {
  return (
    <section className="mx-auto mb-32 max-w-[1200px] px-4 md:px-6">
      <div className="glass-card relative overflow-hidden rounded-[24px] border border-border-light p-8 md:p-12">
        {/* Ambient glow — top right */}
        <div
          aria-hidden="true"
          className="bg-primary/20 pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full blur-[80px]"
        />

        <div className="relative z-10 grid items-center gap-12 md:grid-cols-2">
          {/* Left: copy */}
          <div>
            <h2 className="font-manrope mb-4 font-bold leading-tight text-text-primary">
              Your Financial Health <br />
              <span className="text-primary">At A Glance</span>
            </h2>

            <p className="text-body mb-8 leading-relaxed text-text-secondary">
              FinTrack calculates a Financial Health Score from 0 to 100 that reflects how
              your income, spending, savings rate, and goal progress are tracking together.
              One number that tells you where you actually stand.
            </p>

            <ul className="mb-8 space-y-3" role="list">
              {FEATURE_CHECKLIST.map((item) => (
                <li key={item} className="text-body flex items-center gap-3 text-text-secondary">
                  <CheckCircle size={18} className="text-primary shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="#all-features"
              className="border-primary text-body inline-flex w-fit items-center gap-2 border-b pb-0.5 font-semibold text-text-primary transition-colors duration-smooth hover:text-primary"
            >
              Explore all features
              <ArrowDown size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* Right: Financial Health Score mockup */}
          <div className="bg-bg-elevated border-border-light relative h-[380px] overflow-hidden rounded-card border shadow-glow md:h-[440px]">
            {/* Dot-grid background */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(124,122,255,0.35) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Score card — centred and floating */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 sm:gap-6 md:p-10">
              {/* Score ring */}
              <div className="relative flex size-28 items-center justify-center sm:size-36">
                <svg
                  viewBox="0 0 120 120"
                  className="absolute inset-0 size-full -rotate-90"
                  aria-hidden="true"
                >
                  {/* Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="rgba(124,122,255,0.12)"
                    strokeWidth="10"
                  />
                  {/* Progress — 78 out of 100 */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="rgba(124,122,255,0.85)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="314.16"
                    strokeDashoffset="69.1"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(124,122,255,0.6))' }}
                  />
                </svg>
                <span className="font-manrope text-4xl font-black text-text-primary">78</span>
              </div>

              {/* Score label */}
              <div className="text-center">
                <p className="font-manrope font-bold text-text-primary">Financial Health Score</p>
                <div className="mt-1 inline-flex items-center gap-2">
                  <span className="text-body-sm text-text-secondary">Good</span>
                  <span className="text-text-disabled">·</span>
                  <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[11px] font-bold">78 / 100</span>
                </div>
              </div>

              {/* Breakdown bars */}
              <div className="w-full max-w-[220px] space-y-2">
                {[
                  { label: 'Income', pct: 90, color: 'bg-emerald-400' },
                  { label: 'Spending', pct: 72, color: 'bg-primary' },
                  { label: 'Savings', pct: 68, color: 'bg-amber-400' },
                  { label: 'Goals', pct: 55, color: 'bg-sky-400' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-caption w-14 shrink-0 text-right text-text-tertiary">{label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-deep">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-caption w-6 text-text-disabled">{pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
