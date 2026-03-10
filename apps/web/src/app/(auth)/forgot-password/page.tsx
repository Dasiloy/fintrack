import ForgotPasswordForm from '@/app/(auth)/forgot-password/form';
import AuthLayout from '@/app/layouts/auth_layout';

export default async function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot Password"
      description="Enter your email to receive an OTP code to reset your password"
      withFooter={false}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
