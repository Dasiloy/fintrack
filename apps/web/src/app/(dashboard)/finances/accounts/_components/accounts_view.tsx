'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, Skeleton, toast } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { useMonoConnect } from '@/hooks/use_mono';
import { useBanks } from '@/hooks/use_banks';
import { PageHeader } from '@/app/_components/page-header';
import { AccountCard } from './account_card';
import { AccountsEmpty } from './accounts_empty';
import { AccountsSkeleton } from './accounts_skeleton';

export function AccountsView() {
  const [relinkingId, setRelinkingId] = React.useState<string | null>(null);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  const utils = api_client.useUtils();
  const { data, isLoading } = api_client.account.getLinkedAccounts.useQuery();
  const { getBank, isLoading: isLoadingBanks } = useBanks();
  const accounts = data?.data ?? [];

  const linkMutation = api_client.account.linkMonoAccount.useMutation({
    onSuccess: () => {
      toast.success('Account linked successfully');
      utils.account.getLinkedAccounts.invalidate();
    },
    onError: (err) => toast.error('Failed to link account', { description: err.message }),
  });

  const relinkMutation = api_client.account.relinkMonoAccount.useMutation({
    onSuccess: () => {
      toast.success('Account reconnected');
      utils.account.getLinkedAccounts.invalidate();
      setRelinkingId(null);
    },
    onError: (err) => {
      toast.error('Failed to reconnect', { description: err.message });
      setRelinkingId(null);
    },
  });

  const syncMutation = api_client.account.syncAccount.useMutation({
    onSuccess: () => {
      toast.success('Sync triggered — transactions will update shortly');
      utils.account.getLinkedAccounts.invalidate();
      utils.transaction.getAll.invalidate();
      setSyncingId(null);
    },
    onError: (err) => {
      toast.error('Sync failed', { description: err.message });
      setSyncingId(null);
    },
  });

  const { linkAccount, reauthenticate } = useMonoConnect({
    onError: () => toast.error('Something went wrong with Mono Connect'),
  });

  const handleLink = () => linkAccount((code) => linkMutation.mutate({ code }));

  const handleRelink = (accountId: string) => {
    setRelinkingId(accountId);
    reauthenticate(accountId, (code, accId) => relinkMutation.mutate({ code, accountId: accId }));
  };

  const handleSync = (id: string) => {
    setSyncingId(id);
    syncMutation.mutate({ id });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader breadcrumbs={[{ label: 'Finances' }, { label: 'Accounts' }]}>
        <Button
          size="sm"
          className="gap-1.5 px-2.5 sm:px-4"
          loading={linkMutation.isPending}
          onClick={handleLink}
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Link Account</span>
        </Button>
      </PageHeader>

      {/* ── Title row ── */}
      <div className="flex shrink-0 flex-col px-6 pt-6 pb-4">
        <h1 className="text-text-primary text-[22px] leading-7 font-semibold tracking-tight">
          Linked Accounts
        </h1>
        {isLoading || isLoadingBanks ? (
          <Skeleton className="mt-1 h-5 w-40 rounded-md" />
        ) : (
          <p className="text-text-tertiary mt-1 text-[13px]">
            {accounts.length === 0
              ? 'No accounts connected yet'
              : `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected`}
          </p>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <AccountsSkeleton />
        ) : accounts.length === 0 ? (
          <AccountsEmpty onLink={handleLink} isLinking={linkMutation.isPending} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:max-w-4xl">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                bankLogo={getBank(account.bankId)?.logo}
                onRelink={handleRelink}
                isRelinking={relinkingId === account.accountId && relinkMutation.isPending}
                onSync={handleSync}
                isSyncing={syncingId === account.id && syncMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
