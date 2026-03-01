'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cookie } from 'lucide-react';

import { cn } from '@ui/lib/utils';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { useCookieConsent } from '@/app/providers/cookie_consent_provider';

/** Prefixes that belong to auth and dashboard — banner is suppressed there. */
const APP_PREFIXES = [
  '/dashboard',
  '/finances',
  '/analytics',
  '/planning',
  '/notifications',
  '/settings',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-password-token',
];

export function CookieConsentBanner() {
  const { consent, accept, decline } = useCookieConsent();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  const isAppRoute = APP_PREFIXES.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (consent !== null || isAppRoute) return;
    const t = setTimeout(() => {
      setShow(true);
      requestAnimationFrame(() => setVisible(true));
    }, 800);
    return () => clearTimeout(t);
  }, [consent, isAppRoute]);

  if (!show || consent !== null || isAppRoute) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className={cn(
        'fixed bottom-4 left-4 z-50 w-[340px]',
        'glass-card rounded-card border-border-subtle border p-5 shadow-lg',
        'transition-all duration-300 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <Cookie className="text-primary mt-0.5 shrink-0" size={20} aria-hidden="true" />
        <div>
          <p className="text-body text-text-primary font-semibold">We use cookies</p>
          <p className="text-body-sm text-text-tertiary mt-1 leading-relaxed">
            We use essential cookies to run FinTrack and, with your consent, analytics cookies to
            understand how you use our site.{' '}
            <Link
              href={STATIC_ROUTES.PRIVACY}
              className="text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={decline}
          className="text-body-sm text-text-secondary border-border-subtle hover:text-text-primary flex-1 rounded-lg border px-3 py-2 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={accept}
          className="glossy-button text-body-sm flex-1 rounded-lg px-3 py-2"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
