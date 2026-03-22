import { auth } from '@/lib/nextauth';
import { redirect } from 'next/navigation';

import { prisma } from '@fintrack/database/client';
import { api_server } from '@/lib/trpc_app/api_server';
import DashboardLayout from '@/app/layouts/dashboard_layout';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect(AUTH_ROUTES.LOGIN);

  // prefetch user data
  await api_server.user.getMe.prefetch();

  // lets do a rapid query of user subscription as quick fallback for the dashboard page
  let isPro = false;
  try {
    const subscription = await prisma.subscription.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        plan: true,
      },
    });
    isPro = subscription?.plan === 'PRO';
  } catch (error) {
    console.error('Error prefetching user subscription:', error);
  }

  return (
    <DashboardLayout session={session} isPro={isPro}>
      {children}
    </DashboardLayout>
  );
}
