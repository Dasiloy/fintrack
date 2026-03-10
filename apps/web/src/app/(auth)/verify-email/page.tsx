import { VerifyEmailForm } from '@/app/(auth)/verify-email/form';
import AuthLayout from '@/app/layouts/auth_layout';

export default async function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify Email"
      description="Enter the OTP code sent to your email"
      withFooter={false}
    >
      <VerifyEmailForm />
    </AuthLayout>
  );
}
