'use client';

import { SidebarInset, SidebarProvider } from '@ui/components';
import { AppSidebar } from '@/app/_components/app-sidebar';
import type { Session } from 'next-auth';
import { usePushNotifications } from '@/hooks/use_notifications';

export default function DashboardLayout({
  children,
  session,
  isPro,
}: React.PropsWithChildren & { session: Session; isPro: boolean }) {
  usePushNotifications();
  return (
    <SidebarProvider>
      <AppSidebar session={session} isPro={isPro} />
      <SidebarInset className="bg-bg-deep flex flex-col">{children}</SidebarInset>
    </SidebarProvider>
  );
}
