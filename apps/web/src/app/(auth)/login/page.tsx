import { redirect } from 'next/navigation';

import { auth } from '@/lib/nextauth';
import { LoginForm } from '@/app/(auth)/login/form';

export default async function LoginPage() {
  const session = await auth();

  if (session) redirect('/dashboard');

  return <LoginForm />;
}
