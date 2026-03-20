'use client';

import Cookies from 'js-cookie';
import {
  COOKIE_CONSENT,
  COOKIE_CONSENT_EXPIRES,
  COOKIE_CONSENT_VALUE_ACCEPTED,
  COOKIE_CONSENT_VALUE_DECLINED,
} from '@/lib/constants/cookies';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ConsentValue =
  | typeof COOKIE_CONSENT_VALUE_ACCEPTED
  | typeof COOKIE_CONSENT_VALUE_DECLINED
  | null;

interface CookieConsentContextValue {
  consent: ConsentValue;
  accept: () => void;
  decline: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: React.PropsWithChildren) {
  const [consent, setConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    const stored = Cookies.get(COOKIE_CONSENT) as ConsentValue | undefined;
    if (stored === 'accepted' || stored === 'declined') setConsent(stored);
  }, []);

  const accept = useCallback(() => {
    Cookies.set(COOKIE_CONSENT, COOKIE_CONSENT_VALUE_ACCEPTED, {
      expires: COOKIE_CONSENT_EXPIRES,
      sameSite: 'lax',
    });
    setConsent(COOKIE_CONSENT_VALUE_ACCEPTED);
  }, []);

  const decline = useCallback(() => {
    Cookies.set(COOKIE_CONSENT, COOKIE_CONSENT_VALUE_DECLINED, {
      expires: COOKIE_CONSENT_EXPIRES,
      sameSite: 'lax',
    });
    setConsent(COOKIE_CONSENT_VALUE_DECLINED);
  }, []);

  return (
    <CookieConsentContext.Provider value={{ consent, accept, decline }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used inside CookieConsentProvider');
  return ctx;
}
