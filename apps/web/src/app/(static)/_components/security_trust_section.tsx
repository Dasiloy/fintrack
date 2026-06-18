import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import { TRUST_BADGES, TRUST_PILLARS } from '../_data';

/**
 * "Security & Trust" landing page section.
 * Six pillars covering encryption, read-only access, credential handling,
 * NDPA compliance, 2FA, and data-selling policy. Positioned before the CTA.
 */
export function SecurityTrustSection() {
  return (
    <section
      id="security"
      className="relative mx-auto mb-32 max-w-[1200px] scroll-mt-32 px-4 md:px-6"
    >
      {/* Ambient emerald glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-1/2 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.06), transparent 70%)' }}
      />

      {/* ── Header ── */}
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <div className="border-border-light text-overline mb-6 inline-flex items-center gap-1.5 rounded-full border bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
          <ShieldCheck size={12} aria-hidden="true" />
          Security &amp; Trust
        </div>

        <h2 className="font-manrope mb-4 font-bold text-text-primary">
          Your security is our priority
        </h2>

        <p className="text-body text-text-secondary">
          FinTrack is built with Nigerian banking security standards and the NDPA&nbsp;2023
          at its core — not bolted on as an afterthought.
        </p>
      </div>

      {/* ── Trust badge chips ── */}
      <div className="mb-12 flex flex-wrap justify-center gap-2.5">
        {TRUST_BADGES.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="border-border-light text-body-sm text-text-secondary inline-flex items-center gap-1.5 rounded-full border bg-bg-elevated px-3.5 py-1.5 font-medium"
          >
            <Icon size={13} className="text-text-tertiary" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      {/* ── Six-pillar grid ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST_PILLARS.map(({ icon: Icon, title, description, color }) => (
          <div
            key={title}
            className="border-border-light group relative overflow-hidden rounded-card border bg-bg-elevated p-6 transition-all duration-300 hover:border-border-subtle"
          >
            {/* Subtle shimmer on hover */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />

            {/* Icon */}
            <div
              className="mb-4 flex size-10 items-center justify-center rounded-button bg-bg-surface-hover"
              style={{ color }}
            >
              <Icon size={20} aria-hidden="true" />
            </div>

            <h3 className="text-h4 font-manrope mb-2 font-bold text-text-primary">{title}</h3>
            <p className="text-body-sm text-text-secondary leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* ── Legal links ── */}
      <p className="text-caption mt-10 text-center text-text-disabled">
        Read our{' '}
        <Link
          href={STATIC_ROUTES.PRIVACY}
          className="text-text-secondary underline transition-colors hover:text-text-primary"
        >
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link
          href={STATIC_ROUTES.TERMS}
          className="text-text-secondary underline transition-colors hover:text-text-primary"
        >
          Terms of Service
        </Link>{' '}
        for full details on how your data is handled.
      </p>
    </section>
  );
}
