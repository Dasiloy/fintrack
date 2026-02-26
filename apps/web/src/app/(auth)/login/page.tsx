import { redirect } from 'next/navigation';

import { auth } from '@/lib/nextauth';
import { LoginForm } from '@/app/(auth)/login/form';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';

export default async function LoginPage() {
  const session = await auth();

  if (session) redirect(DASHBOARD_ROUTES.DASHBOARD);

  return <LoginForm />;
}
