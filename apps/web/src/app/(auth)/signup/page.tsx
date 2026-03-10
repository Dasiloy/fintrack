import { SignupForm } from '@/app/(auth)/signup/form';
import AuthLayout from '@/app/layouts/auth_layout';

interface SignupPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { email } = await searchParams;
  return (
    <AuthLayout title="Create an Account" description="Sign up with your email and password">
      <SignupForm email={email} />
    </AuthLayout>
  );
}
