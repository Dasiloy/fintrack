import { auth } from '@/lib/nextauth';

import { sessionToUser } from '@/helpers/session';
import { api_server } from '@/lib/trpc_app/api_server';
import DashboardLayout from '@/app/layouts/dashboard_layout';

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const subscription = await api_server.subscription.getPlan();

  return (
    <DashboardLayout isPro={subscription?.plan === 'PRO'} user={sessionToUser(session)}>
      {children}
    </DashboardLayout>
  );
}
