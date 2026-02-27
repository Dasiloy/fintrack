import { redirect } from 'next/navigation';

import { auth } from '@/lib/nextauth';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import ForgotPasswordForm from '@/app/(auth)/forgot-password/form';

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session) redirect(DASHBOARD_ROUTES.DASHBOARD);

  return <ForgotPasswordForm />;
}
