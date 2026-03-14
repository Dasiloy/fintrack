'use client';

import { SidebarInset, SidebarProvider } from '@ui/components';

import { AppSidebar } from '@/app/_components/app-sidebar';
import type { Session } from 'next-auth';

export default function DashboardLayout({
  children,
  session,
}: React.PropsWithChildren & { session: Session }) {
  return (
    <SidebarProvider>
      <AppSidebar session={session} />
      <SidebarInset className="bg-bg-deep flex flex-col">{children}</SidebarInset>
    </SidebarProvider>
  );
}
