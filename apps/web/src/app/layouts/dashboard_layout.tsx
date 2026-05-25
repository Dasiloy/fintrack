'use client';

import { SidebarInset, SidebarProvider } from '@ui/components';
import { AppSidebar } from '@/app/_components/app-sidebar';
import type { Session } from 'next-auth';
import { usePushNotifications } from '@/hooks/use_notifications';
import { useActivity } from '@/hooks/use_activity';

export default function DashboardLayout({
  children,
  session,
  isPro,
  sidebarDefaultOpen = true,
}: React.PropsWithChildren & { session: Session; isPro: boolean; sidebarDefaultOpen?: boolean }) {
  usePushNotifications();
  useActivity();

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <AppSidebar session={session} isPro={isPro} />
      <SidebarInset className="bg-bg-deep flex flex-col">{children}</SidebarInset>
    </SidebarProvider>
  );
}
