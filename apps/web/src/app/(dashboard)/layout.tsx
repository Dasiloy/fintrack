import { auth } from '@/lib/nextauth';
import { redirect } from 'next/navigation';

import DashboardLayout from '@/app/layouts/dashboard_layout';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { SocketProvider } from '@/app/providers/socket_provider';
import { api_caller } from '@/lib/trpc_app/api_server';

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect(AUTH_ROUTES.LOGIN);

  let isPro = false;
  try {
    isPro = (await api_caller.subscription.isPro()).data!;
  } catch {
    // non-fatal — default to free
  }

  return (
    <SocketProvider>
      <DashboardLayout session={session} isPro={isPro}>
        {children}
      </DashboardLayout>
    </SocketProvider>
  );
}
