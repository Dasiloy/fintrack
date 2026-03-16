import { PageHeader } from '@/app/_components';
import { api_server, HydrateClient } from '@/lib/trpc_app/api_server';
import { ProfileLayout } from '@/app/(dashboard)/settings/profile/_components/profile_layout';

export default async function ProfileSettingsPage() {
  await Promise.all([
    api_server.auth.get2fa.prefetch(),
    api_server.auth.getSessions.prefetch({ take: 1 }),
  ]);
  return (
    <HydrateClient>
      <div className="flex h-full flex-col">
        <PageHeader breadcrumbs={[{ label: 'Settings' }, { label: 'Profile' }]} />
        <ProfileLayout />
      </div>
    </HydrateClient>
  );
}
