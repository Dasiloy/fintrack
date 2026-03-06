import { auth } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import { VerifyEmailForm } from '@/app/(auth)/verify-email/form';

export default async function VerifyEmailPage() {
  // const session = await auth();

  // if (!session?.error) redirect(DASHBOARD_ROUTES.DASHBOARD);

  return <VerifyEmailForm />;
}
