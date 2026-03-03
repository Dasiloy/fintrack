import { redirect } from 'next/navigation';

import { auth } from '@/lib/nextauth';
import { LoginForm } from '@/app/(auth)/login/form';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session) redirect(DASHBOARD_ROUTES.DASHBOARD);

  const { error } = await searchParams;

  return <LoginForm authError={error} />;
}
