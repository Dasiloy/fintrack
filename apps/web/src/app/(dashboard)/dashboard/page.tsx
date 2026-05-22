import { cookies } from 'next/headers';
import { COOKIE_BALANCE, COOKIE_BALANCE_VALUE_DISABLED } from '@/lib/constants/cookies';
import { DashboardClient } from './_components/dashboard_client';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const balanceCookie = cookieStore.get(COOKIE_BALANCE);
  const balanceHidden = balanceCookie?.value === COOKIE_BALANCE_VALUE_DISABLED;

  return <DashboardClient balanceHidden={balanceHidden} />;
}
