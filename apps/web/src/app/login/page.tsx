import { auth } from '@/lib/nextauth';
import { HydrateClient } from '@/lib/trpc_app/api_server';
import { redirect } from 'next/navigation';

export default async function login() {
  const session = await auth();

  if (session) redirect('/');

  return <HydrateClient>hello from login page</HydrateClient>;
}
