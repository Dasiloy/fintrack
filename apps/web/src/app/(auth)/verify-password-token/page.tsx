import { VerifyPasswordTokenForm } from '@/app/(auth)/verify-password-token/form';
import AuthLayout from '@/app/layouts/auth_layout';

export default async function VerifyPasswordTokenPage() {
  return (
    <AuthLayout
      title="Verify Password Token"
      description="Enter the OTP code sent to your email"
      withFooter={false}
    >
      <VerifyPasswordTokenForm />
    </AuthLayout>
  );
}
