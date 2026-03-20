import { cookies } from 'next/headers';
import { PageHeader } from '@/app/_components';
import { api_server, HydrateClient } from '@/lib/trpc_app/api_server';
import {
  COOKIE_CONSENT,
  COOKIE_BALANCE,
  COOKIE_THEME,
  COOKIE_CONSENT_VALUE_DECLINED,
  COOKIE_THEME_VALUE_DARK,
  COOKIE_BALANCE_VALUE_ENABLED,
  type CookiKeys,
} from '@/lib/constants/cookies';
import { AccountLayout } from '@/app/(dashboard)/settings/account/_components/account_layout';

export default async function AccountSettingsPage() {
  await api_server.user.getMe.prefetch();

  // lets get the cookeis for this user
  const cookieStore = await cookies();
  const consentCookies =
    cookieStore.get(COOKIE_CONSENT) ??
    ({
      name: COOKIE_CONSENT,
      value: COOKIE_CONSENT_VALUE_DECLINED,
    } as const);
  const themeCookies =
    cookieStore.get(COOKIE_THEME) ??
    ({
      name: COOKIE_THEME,
      value: COOKIE_THEME_VALUE_DARK,
    } as const);
  const balanceCookies =
    cookieStore.get(COOKIE_BALANCE) ??
    ({
      name: COOKIE_BALANCE,
      value: COOKIE_BALANCE_VALUE_ENABLED,
    } as const);

  const cookeMap = new Map<CookiKeys, string>([
    [COOKIE_CONSENT, consentCookies.value],
    [COOKIE_THEME, themeCookies.value],
    [COOKIE_BALANCE, balanceCookies.value],
  ]);

  return (
    <HydrateClient>
      <div className="flex h-full flex-col">
        <PageHeader breadcrumbs={[{ label: 'Settings' }, { label: 'Account' }]} />
        <AccountLayout cookies={cookeMap} />
      </div>
    </HydrateClient>
  );
}
