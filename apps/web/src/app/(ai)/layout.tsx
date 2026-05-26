// ── (ai) route group layout ───────────────────────────────────────────────────
// Parallel to (dashboard) — provides auth + socket + user prefs but NO sidebar.
// Pages in this group render full-screen without the AppSidebar or SidebarInset.
//
// Next.js ignores route-group names in the URL, so /advisor is served
// from (ai)/advisor/ without conflicting with (dashboard)/.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/nextauth';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { SocketProvider } from '@/app/providers/socket_provider';
import {
  UserPreferencesProvider,
  type UserPreferences,
} from '@/app/providers/user_preferences_provider';
import { api_caller } from '@/lib/trpc_app/api_server';

const PREF_DEFAULTS: UserPreferences = {
  currency: 'NGN',
  language: 'EN_US',
  timezone: 'Africa/Lagos',
  dateFormat: 'DMY',
};

export default async function AiGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect(AUTH_ROUTES.LOGIN);

  let userPrefs: UserPreferences = PREF_DEFAULTS;

  try {
    await api_caller.user.getMe().then((r) => {
      if (r.data) {
        userPrefs = {
          currency: r.data.currency,
          language: r.data.language,
          timezone: r.data.timezone,
          dateFormat: r.data.dateFormat,
        };
      }
    });
  } catch {
    // non-fatal — defaults apply
  }

  return (
    <SocketProvider>
      <UserPreferencesProvider initialPrefs={userPrefs}>
        {/*
         * h-[100dvh]: dynamic viewport height — prevents the mobile browser
         * toolbar from causing layout jumps when it shows/hides on scroll.
         * overflow-hidden: ensures the page never scrolls as a whole;
         * each panel manages its own scroll internally.
         */}
        <div className="bg-bg-deep h-dvh overflow-hidden">{children}</div>
      </UserPreferencesProvider>
    </SocketProvider>
  );
}
