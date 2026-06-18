'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from '@bprogress/next';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

import { AUTH_ROUTES, STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { env } from '@/env';

/**
 * Bottom CTA section.
 * On submit, the entered email is forwarded as a query param to /signup
 * so the signup form can pre-fill it — no data is sent externally.
 */
export function CTASection() {
  const [email, setEmail] = useState('');
  const [cfTurnstileToken, setCfTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cfTurnstileToken) return;

    const params = new URLSearchParams();
    if (email.trim()) {
      params.set('email', email.trim());
    }
    router.push(`${AUTH_ROUTES.SIGNUP}?${params.toString()}`);
  };

  return (
    <section className="mx-auto max-w-[800px] px-4 pb-32 text-center md:px-6">
      <h2 className="font-manrope text-text-primary mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        Ready to see your money clearly?
      </h2>

      <p className="text-body-lg text-text-secondary mb-10 leading-relaxed">
        Free to start. No credit card needed.{' '}
        <span className="text-text-primary font-medium">Your data stays yours.</span>
      </p>

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          aria-label="Email address"
          className="input-field text-body text-text-primary placeholder:text-text-disabled w-full"
        />
        <button
          type="submit"
          disabled={!email.trim() || !cfTurnstileToken}
          className="glossy-button rounded-button text-body text-white px-6 py-3 font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
        >
          Get Started
        </button>
      </form>

      <div className="mx-auto mt-4 max-w-md">
        <Turnstile
          ref={turnstileRef}
          siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setCfTurnstileToken(token)}
          onExpire={() => setCfTurnstileToken(null)}
          onError={() => setCfTurnstileToken(null)}
          options={{ theme: 'auto', size: 'flexible' }}
        />
      </div>

      <p className="text-caption text-text-disabled mt-3">
        By signing up, you agree to our{' '}
        <Link
          href={STATIC_ROUTES.TERMS}
          className="hover:text-text-secondary duration-smooth underline transition-colors"
        >
          Terms &amp; Conditions
        </Link>
        .
      </p>
    </section>
  );
}
