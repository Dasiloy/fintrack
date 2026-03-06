import { auth } from '@/lib/nextauth';
import { redirect } from 'next/navigation';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import { VerifyPasswordTokenForm } from '@/app/(auth)/verify-password-token/form';

export default async function VerifyPasswordTokenPage() {
  // const session = await auth();

  // if (!session?.error) redirect(DASHBOARD_ROUTES.DASHBOARD);

  return <VerifyPasswordTokenForm />;
}
