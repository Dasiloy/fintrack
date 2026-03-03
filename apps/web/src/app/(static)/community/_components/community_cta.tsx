import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';

import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

/**
 * Bottom CTA — invites visitors to create an account and join the community.
 */
export function CommunityCta() {
  return (
    <section className="mx-auto mb-32 max-w-[1200px] px-4 md:px-6">
      <div className="glass-card border-border-light relative overflow-hidden rounded-[24px] border px-8 py-16 text-center">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="bg-primary/15 pointer-events-none absolute top-1/2 left-1/2 -z-0 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        />

        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Join the Conversation
          </h2>
          <p className="text-body-lg text-text-secondary mb-8 leading-relaxed">
            Create your free account to start posting, replying, and connecting with thousands of
            other finance enthusiasts.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={AUTH_ROUTES.SIGNUP}
              className="glossy-button rounded-card text-body text-text-primary shadow-glow inline-flex w-full items-center justify-center gap-2 px-8 py-3 font-bold sm:w-auto"
            >
              Sign Up &amp; Join
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href={AUTH_ROUTES.LOGIN}
              className="border-border-subtle text-body text-text-secondary hover:bg-bg-elevated hover:text-text-primary duration-smooth inline-flex w-full items-center justify-center gap-2 rounded-lg border bg-transparent px-8 py-3 font-bold transition-all sm:w-auto"
            >
              <LogIn size={16} aria-hidden="true" />
              Log In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
