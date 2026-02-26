import { auth } from '@fintrack/next_auth';

import DashboardLayout from '@/app/layouts/dashboard_layout';
import type { SessionUser } from '@fintrack/types/interfaces/session_user.interface';

function sessionToUser(session: { user?: { name?: string | null; email?: string | null; image?: string | null } } | null): SessionUser | undefined {
  if (!session?.user?.name || !session?.user?.email) return undefined;
  return {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image ?? undefined,
  };
}

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = sessionToUser(session);

  return (
    <DashboardLayout isPro={false} user={user}>
      {children}
    </DashboardLayout>
  );
}
