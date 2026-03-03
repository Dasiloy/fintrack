import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

/**
 * About page CTA — simple centred call-to-action that directs visitors
 * to sign up. Mirrors the tone of the page (human, not salesy).
 */
export function AboutCta() {
  return (
    <section className="mx-auto mb-32 max-w-[800px] px-4 text-center md:px-6">
      {/* Divider */}
      <div className="border-border-subtle mx-auto mb-16 w-16 border-t" />

      <h2 className="font-manrope text-text-primary mb-5 text-3xl font-bold tracking-tight sm:text-4xl">
        Join us on the journey
      </h2>

      <p className="text-body-lg text-text-secondary mb-10 leading-relaxed">
        We're just getting started. If you believe money management should be simple and beautiful,
        FinTrack is for you.
      </p>

      <Link
        href={AUTH_ROUTES.SIGNUP}
        className="glossy-button rounded-card text-body-lg text-text-primary shadow-glow inline-flex items-center gap-2 px-8 py-3.5 font-bold"
      >
        Get Started — it's free
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}
