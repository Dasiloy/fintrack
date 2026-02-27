import { redirect } from 'next/navigation';

import { auth } from '@/lib/nextauth';
import { SignupForm } from '@/app/(auth)/signup/form';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';

export default async function SignupPage() {
  const session = await auth();

  if (session) redirect(DASHBOARD_ROUTES.DASHBOARD);

  return <SignupForm />;
}
