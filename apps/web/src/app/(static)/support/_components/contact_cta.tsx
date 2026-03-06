import Link from 'next/link';
import { Mail, MessageSquare } from 'lucide-react';

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

        <p className="bg-bg-elevated border-border-subtle text-overline text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
          Still need help?
        </p>

        <h2 className="font-manrope text-text-primary mb-3 text-2xl font-bold md:text-3xl">
          We&apos;re here for you
        </h2>
        <p className="text-body text-text-secondary mx-auto mb-10 max-w-md leading-relaxed">
          Couldn&apos;t find what you&apos;re looking for? Reach out and our team will get back to
          you within one business day.
        </p>

        <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={STATIC_ROUTES.CONTACT}
            className="glossy-button rounded-button inline-flex items-center gap-2.5 px-7 py-3 font-semibold"
          >
            <Mail size={16} aria-hidden="true" />
            Email support
          </Link>

          <a
            href="https://discord.gg/fintrack"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-button border-border-light text-text-secondary hover:text-text-primary hover:border-primary/40 inline-flex items-center gap-2.5 border px-7 py-3 font-semibold transition-colors duration-smooth"
          >
            <MessageSquare size={16} aria-hidden="true" />
            Community Discord
          </a>
        </div>
      </div>
    </section>
  );
}
