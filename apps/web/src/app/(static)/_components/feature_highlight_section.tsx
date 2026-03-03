import Link from 'next/link';
import { CheckCircle, ArrowDown, DollarSign } from 'lucide-react';

import { FEATURE_CHECKLIST } from '../_data';

/**
 * Two-column feature highlight — "Your Financial Health At A Glance".
 * Left: copy + checklist + CTA link.
 * Right: decorative card with a floating savings widget.
 */
export function FeatureHighlightSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 mb-32">
      <div className="glass-card rounded-[24px] p-8 md:p-12 border border-border-light relative overflow-hidden">
        {/* Ambient glow — top right */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-72 h-72 bg-primary/20 blur-[80px] rounded-full pointer-events-none"
        />

        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left: copy */}
          <div>
            <h2 className="font-manrope font-bold mb-4 leading-tight text-text-primary">
              Your Financial Health <br />
              <span className="text-primary">At A Glance</span>
            </h2>

            <p className="text-body text-text-secondary mb-8 leading-relaxed">
              Stop switching between apps. FinTrack connects to over 5,000 financial institutions
              to bring all your data into one secure, beautiful dashboard.
            </p>

            <ul className="space-y-3 mb-8" role="list">
              {FEATURE_CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-3 text-body text-text-secondary">
                  <CheckCircle size={18} className="text-primary shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="#all-features"
              className="inline-flex items-center gap-2 text-body font-semibold text-text-primary border-b border-primary pb-0.5 hover:text-primary transition-colors duration-smooth w-fit"
            >
              Explore all features
              <ArrowDown size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* Right: savings card mockup */}
          <div className="relative h-[320px] md:h-[380px] rounded-card overflow-hidden bg-bg-elevated border border-border-subtle shadow-glow">
            {/* Dot-grid background pattern */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(124,122,255,0.35) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Floating savings widget — uses landing-float animation */}
            <div className="absolute bottom-6 left-6 right-6 glass-card p-4 rounded-card border border-border-light flex items-center gap-4 animate-landing-float">
              <div className="size-10 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
                <DollarSign size={20} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-overline text-text-tertiary">Total Savings</p>
                <p className="text-h4 font-manrope font-bold text-text-primary">$24,593.00</p>
              </div>
              <div className="ml-auto shrink-0">
                <span className="px-2 py-1 rounded bg-success/10 text-success text-caption font-bold">
                  +12%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
