import { PageHeader } from '@/app/_components';
import { HydrateClient } from '@/lib/trpc_app/api_server';

export default async function AccountSettingsPage() {
  return (
    <HydrateClient>
      <div className="flex h-full flex-col">
        <PageHeader breadcrumbs={[{ label: 'Settings' }, { label: 'Account' }]} />
        {/* <SecurityLayout /> */}
      </div>
    </HydrateClient>
  );
}
