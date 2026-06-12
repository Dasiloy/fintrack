import { auth } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

export default async function OnboardingGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect(AUTH_ROUTES.LOGIN);

  return <>{children}</>;
}
