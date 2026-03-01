'use client';

import { SidebarInset, SidebarProvider } from '@ui/components';

import { AppSidebar } from '@/app/_components/app-sidebar';
import type { SessionUser } from '@fintrack/types/interfaces/session_user.interface';

export interface DashboardLayoutProps extends React.PropsWithChildren {
  isPro?: boolean;
  user: SessionUser;
}

export default function DashboardLayout({ children, isPro = false, user }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar isPro={isPro} user={user} />
      <SidebarInset className="bg-bg-deep flex flex-col">{children}</SidebarInset>
    </SidebarProvider>
  );
}
