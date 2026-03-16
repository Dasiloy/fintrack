'use client';

import { lazy, Suspense, useState } from 'react';
import { api_client } from '@/lib/trpc_app/api_client';
import { KeyRound, Mail, Monitor, Shield, Trash2 } from 'lucide-react';

// Lazy Load Sections
const TwoFactorSection = lazy(() => import('./two_factor_section'));
const PasswordSection = lazy(() => import('./password_section'));
const EmailSection = lazy(() => import('./email_section'));
const SessionsSection = lazy(() => import('./sessions_section'));
const DangerZone = lazy(() => import('./danger_zone'));

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

type SectionId = 'two-factor' | 'password' | 'email' | 'sessions' | 'danger';

interface NavItem {
  id: SectionId;
  label: string;
  icon: any;
  danger?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'two-factor' as const, label: 'Two-Factor Auth', icon: Shield },
  { id: 'password' as const, label: 'Password', icon: KeyRound },
  { id: 'email' as const, label: 'Email', icon: Mail },
  { id: 'sessions' as const, label: 'Sessions', icon: Monitor },
  { id: 'danger' as const, label: 'Danger Zone', icon: Trash2, danger: true },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SecurityLayout() {
  const { data } = api_client.auth.get2fa.useQuery();
  const [active, setActive] = useState<SectionId>(
    data?.data?.hasPassword ? 'two-factor' : 'password',
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Page header + horizontal tab bar ─────────────────────────────── */}
      <div className="border-border-subtle shrink-0 border-b px-6 pt-6 lg:px-8">
        {/* Title row */}
        <div className="mb-5">
          <h1 className="text-text-primary text-xl font-semibold">Security</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Manage authentication, credentials, and account settings.
          </p>
        </div>

        {/* Tab bar — scrollable on mobile */}
        <nav className="no-scrollbar -mb-px flex overflow-x-auto">
          {NAV_ITEMS.filter((nav) => {
            if (['email', 'two-factor'].includes(nav.id) && !data?.data?.hasPassword) {
              return undefined;
            }
            return nav;
          }).map(({ id, label, icon: Icon, danger }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={[
                  'flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none',
                  isActive && danger
                    ? 'border-red-500 text-red-400'
                    : isActive
                      ? 'border-primary text-primary'
                      : danger
                        ? 'text-text-disabled border-transparent hover:text-red-400'
                        : 'text-text-tertiary hover:text-text-primary border-transparent',
                ].join(' ')}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Section content ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-8 lg:px-8">
          {active === 'two-factor' && (
            <Suspense fallback={<></>}>
              <TwoFactorSection />
            </Suspense>
          )}
          {active === 'password' && (
            <Suspense fallback={<></>}>
              <PasswordSection />
            </Suspense>
          )}
          {active === 'email' && (
            <Suspense fallback={<></>}>
              <EmailSection />
            </Suspense>
          )}
          {active === 'sessions' && (
            <Suspense fallback={<></>}>
              <SessionsSection />
            </Suspense>
          )}
          {active === 'danger' && (
            <Suspense fallback={<></>}>
              <DangerZone />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
}
