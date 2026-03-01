import { auth } from '@/lib/nextauth';

import { redirect } from 'next/navigation';
import { sessionToUser } from '@/helpers/session';
import { api_server } from '@/lib/trpc_app/api_server';
import DashboardLayout from '@/app/layouts/dashboard_layout';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect(AUTH_ROUTES.LOGIN);
  }

  const subscription = await api_server.subscription.getPlan();

  return (
    <DashboardLayout isPro={subscription?.plan === 'PRO'} user={sessionToUser(session)}>
      {children}
    </DashboardLayout>
  );
}
