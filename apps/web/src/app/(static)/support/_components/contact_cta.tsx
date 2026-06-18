import Link from 'next/link';
import { Mail } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

export function ContactCta() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-20 md:px-6">
      <div className="glass-card rounded-card relative overflow-hidden p-8 text-center md:p-12">
        {/* background accent */}
        <div
          aria-hidden="true"
          className="from-primary/8 pointer-events-none absolute inset-0 bg-linear-to-br to-transparent"
        />

        <p className="bg-bg-elevated border-border-light text-overline text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
          Still need help?
        </p>

        <h2 className="font-manrope text-text-primary mb-3 text-2xl font-bold md:text-3xl">
          Get in touch
        </h2>
        <p className="text-body text-text-secondary mx-auto mb-10 max-w-md leading-relaxed">
          Could not find what you are looking for? Send a message and we will get back to you within 5 business days.
        </p>

        <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={STATIC_ROUTES.CONTACT}
            className="glossy-button rounded-button inline-flex items-center gap-2.5 px-7 py-3 font-semibold"
          >
            <Mail size={16} aria-hidden="true" />
            Email support
          </Link>
        </div>
      </div>
    </section>
  );
}
