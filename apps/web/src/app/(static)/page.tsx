import { HydrateClient } from '@/lib/trpc_app/api_server';

export default async function Home() {
  return (
    <HydrateClient>
      <main className="bg-bg-deep min-h-screen w-screen">
        <div className="flex max-w-2xl flex-col gap-12 p-12"></div>
      </main>
    </HydrateClient>
  );
}
