'use client';

import { PageHeader } from '@/app/_components/page-header';
import { useMonoConnect } from '@/hooks/use_mono';
import { api_client } from '@/lib/trpc_app/api_client';
import { Button, toast } from '@ui/components';

export default function DashboardPage() {
  const { linkAccount, reauthenticate } = useMonoConnect({});

  const linkAccountMutation = api_client.account.relinkMonoAccount.useMutation({
    onSuccess() {
      toast.success('Account Linked');
    },
    onError(err) {
      toast.error('Error', {
        description: err.message,
      });
    },
  });

  const onLink = () => {
    reauthenticate('69dbb973e9d4e378a6d73230', (code) => {
      linkAccountMutation.mutate({ code, accountId: '69dbb973e9d4e378a6d73230' });
    });
  };

  return (
    <div className="flex h-full min-h-[200vh] flex-col">
      <PageHeader breadcrumbs={[{ label: 'Dashboard' }]} />

      <main className="flex flex-1 flex-col gap-5 p-6">
        {/* Stat cards row */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-card aspect-video p-6" />
          ))}
        </div>

        {/* Main content area */}
        <div className="glass-card rounded-card min-h-64 flex-1 p-6">
          <Button onClick={onLink} loading={linkAccountMutation.isPending}>
            connect mono
          </Button>
        </div>
      </main>
    </div>
  );
}
