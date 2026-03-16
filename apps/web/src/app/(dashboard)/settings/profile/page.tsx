import { PageHeader } from '@/app/_components';
import { HydrateClient } from '@/lib/trpc_app/api_server';
import { ProfileLayout } from '@/app/(dashboard)/settings/profile/_components/profile_layout';

export default async function ProfileSettingsPage() {
  return (
    <HydrateClient>
      <div className="flex h-full flex-col">
        <PageHeader breadcrumbs={[{ label: 'Settings' }, { label: 'Profile' }]} />
        <ProfileLayout />
      </div>
    </HydrateClient>
  );
}
