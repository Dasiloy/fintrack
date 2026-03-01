'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

type ConsentValue = 'accepted' | 'declined' | null;

interface CookieConsentContextValue {
  consent: ConsentValue;
  accept: () => void;
  decline: () => void;
}

const COOKIE_KEY = 'fintrack_cookie_consent';
const COOKIE_EXPIRES = 365; // days

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: React.PropsWithChildren) {
  const [consent, setConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    const stored = Cookies.get(COOKIE_KEY) as ConsentValue | undefined;
    if (stored === 'accepted' || stored === 'declined') setConsent(stored);
  }, []);

  const accept = useCallback(() => {
    Cookies.set(COOKIE_KEY, 'accepted', { expires: COOKIE_EXPIRES, sameSite: 'lax' });
    setConsent('accepted');
  }, []);

  const decline = useCallback(() => {
    Cookies.set(COOKIE_KEY, 'declined', { expires: COOKIE_EXPIRES, sameSite: 'lax' });
    setConsent('declined');
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
