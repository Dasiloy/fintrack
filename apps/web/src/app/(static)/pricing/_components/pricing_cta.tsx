import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

/**
 * Bottom CTA strip — encourages sign-up + surfaces the FAQ / community links.
 */
export function PricingCta() {
  return (
    <section className="mx-auto mb-32 max-w-[700px] px-4 text-center md:px-6">
      <div className="glass-card rounded-card border-border-subtle border px-8 py-12">
        <p className="text-overline text-primary mb-3 block tracking-widest uppercase">
          Ready to start?
        </p>
        <h2 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Try FinTrack free today
        </h2>
        <p className="text-body text-text-secondary mb-8 leading-relaxed">
          No credit card required. Upgrade or cancel anytime.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={AUTH_ROUTES.SIGNUP}
            className="glossy-button rounded-button text-body text-text-primary shadow-glow inline-flex items-center gap-2 px-8 py-3 font-bold"
          >
            Get started free
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={STATIC_ROUTES.COMMUNITY}
            className="rounded-button text-body border-border-light text-text-secondary hover:text-text-primary hover:border-primary/50 inline-flex items-center gap-2 border px-8 py-3 font-semibold transition-colors duration-smooth"
          >
            Talk to the community
          </Link>
        </div>
      </div>
    </section>
  );
}
