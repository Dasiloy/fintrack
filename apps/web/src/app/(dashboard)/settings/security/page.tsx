import { PageHeader } from '@/app/_components/page-header';

import { SecurityLayout } from './_components/security_layout';
import { api_server, HydrateClient } from '@/lib/trpc_app/api_server';

export default async function SecuritySettingsPage() {
  await api_server.auth.get2fa.prefetch();

  return (
    <HydrateClient>
      <div className="flex h-full flex-col">
        <PageHeader
          breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Security' }]}
        />
        <SecurityLayout />
      </div>
    </HydrateClient>
  );
}
