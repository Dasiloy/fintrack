import { auth } from '@/lib/nextauth';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import { redirect } from 'next/navigation';

export default async function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user) return redirect(DASHBOARD_ROUTES.DASHBOARD);
  return <>{children}</>;
}
