import { SignupForm } from '@/app/(auth)/signup/form';

interface SignupPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { email } = await searchParams;
  return <SignupForm email={email} />;
}
