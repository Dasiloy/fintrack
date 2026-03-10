import ResetPasswordForm from '@/app/(auth)/reset-password/form';
import AuthLayout from '@/app/layouts/auth_layout';

export default async function ResetPasswordPage() {
  return (
    <AuthLayout title="Reset Password" description="Enter your new password" withFooter={false}>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
