import { auth } from '@/lib/nextauth';

import { api_server } from '@/lib/trpc_app/api_server';
import DashboardLayout from '@/app/layouts/dashboard_layout';
import { redirect } from 'next/navigation';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect(AUTH_ROUTES.LOGIN);

  await api_server.user.getMe.prefetch();

  return <DashboardLayout session={session}>{children}</DashboardLayout>;
}
