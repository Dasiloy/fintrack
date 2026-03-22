'use client';

import { SidebarInset, SidebarProvider } from '@ui/components';

import { AppSidebar } from '@/app/_components/app-sidebar';
import type { Session } from 'next-auth';

export default function DashboardLayout({
  children,
  session,
  isPro,
}: React.PropsWithChildren & { session: Session; isPro: boolean }) {
  return (
    <SidebarProvider>
      <AppSidebar session={session} isPro={isPro} />
      <SidebarInset className="bg-bg-deep flex flex-col">{children}</SidebarInset>
    </SidebarProvider>
  );
}
