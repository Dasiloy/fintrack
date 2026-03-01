'use client';

import Script from 'next/script';
import { env } from '@/env';
import { useCookieConsent } from '@/app/providers/cookie_consent_provider';

export function GoogleAnalytics() {
  const { consent } = useCookieConsent();
  const measurementId = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (consent !== 'accepted' || !measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
