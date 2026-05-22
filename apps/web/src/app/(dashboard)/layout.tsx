import { cookies } from 'next/headers';
import { auth } from '@/lib/nextauth';
import { redirect } from 'next/navigation';

import DashboardLayout from '@/app/layouts/dashboard_layout';
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

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect(AUTH_ROUTES.LOGIN);

  let isPro = false;
  let userPrefs: UserPreferences = PREF_DEFAULTS;

  try {
    [isPro] = await Promise.all([
      api_caller.subscription.isPro().then((r) => r.data ?? false),
      api_caller.user.getMe().then((r) => {
        if (r.data) {
          userPrefs = {
            currency: r.data.currency,
            language: r.data.language,
            timezone: r.data.timezone,
            dateFormat: r.data.dateFormat,
          };
        }
      }),
    ]);
  } catch {
    // non-fatal — defaults apply
  }

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get('sidebar_state');
  const sidebarDefaultOpen = sidebarCookie ? sidebarCookie.value === 'true' : true;

  return (
    <SocketProvider>
      <UserPreferencesProvider initialPrefs={userPrefs}>
        <DashboardLayout session={session} isPro={isPro} sidebarDefaultOpen={sidebarDefaultOpen}>
          {children}
        </DashboardLayout>
      </UserPreferencesProvider>
    </SocketProvider>
  );
}
