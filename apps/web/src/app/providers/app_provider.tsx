'use client';

import { ThemeProvider, Toaster, TooltipProvider } from '@ui/components';
import { AppProgressProvider } from '@bprogress/next';

import { CookieConsentProvider } from './cookie_consent_provider';
import { PlanUsageProvider } from './plan_usage_provider';
import { CookieConsentBanner, GoogleAnalytics, DeviceIdInit } from '@/app/_components';

export default function AppProviver({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="fintrack_theme"
    >
      <CookieConsentProvider>
        <PlanUsageProvider>
          <TooltipProvider>
            <AppProgressProvider
              color="#7c7aff"
              disableSameURL={false}
              shallowRouting={false}
              shouldCompareComplexProps
            >
              <Toaster position="top-right" />
              {children}
              <CookieConsentBanner />
              <GoogleAnalytics />
              <DeviceIdInit />
            </AppProgressProvider>
          </TooltipProvider>
        </PlanUsageProvider>
      </CookieConsentProvider>
    </ThemeProvider>
  );
}
