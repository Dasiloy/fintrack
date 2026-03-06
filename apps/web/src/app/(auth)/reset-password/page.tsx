import { auth } from '@/lib/nextauth';

import { redirect } from 'next/navigation';

import ResetPasswordForm from '@/app/(auth)/reset-password/form';

import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';

export default async function ResetPasswordPage() {
  // const session = await auth();

  // if (!session?.error) redirect(DASHBOARD_ROUTES.DASHBOARD);

  return <ResetPasswordForm />;
}
