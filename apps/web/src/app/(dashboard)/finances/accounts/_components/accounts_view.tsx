'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button, Skeleton, toast } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { useMonoConnect } from '@/hooks/use_mono';
import { useBanks } from '@/hooks/use_banks';
import { PageHeader } from '@/app/_components/page-header';
import { AccountCard } from './account_card';
import { AccountDrawer } from './account_drawer';
import { AccountsEmpty } from './accounts_empty';
import { AccountsSkeleton } from './accounts_skeleton';
import type { MonoBankAccount } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { useProGate } from '@/hooks/use_pro_gate';
import { ProGateModal } from '@/app/_components/pro_gate_modal';
import { UsageBanner } from '@/app/_components/usage_banner';
import { usePlan } from '@/app/providers/plan_usage_provider';

export function AccountsView() {
  const searchParams = useSearchParams();
  const [relinkingId, setRelinkingId] = React.useState<string | null>(null);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = React.useState<MonoBankAccount | null>(null);

  const utils = api_client.useUtils();
  const { data, isLoading } = api_client.account.getLinkedAccounts.useQuery();
  const { getBank, isLoading: isLoadingBanks } = useBanks();
  const accounts = data?.data ?? [];

  // Auto-open drawer when navigating from a bank_link notification
  React.useEffect(() => {
    const accountId = searchParams.get('accountId');
    if (!accountId || accounts.length === 0) return;
    const found = accounts.find((a) => a.id === accountId);
    if (found) setSelectedAccount(found);
  }, [searchParams, accounts]);

  const createGate = useProGate(Usage.MAX_MONO_ACCOUNTS);
  const plan = usePlan();
  const canMutateAccount = (bank: MonoBankAccount) => {
    if (bank.isDefault) return true;
    if (!plan) return false;
    return plan.resourceCounts.monoBankAccounts <= plan.limits.MAX_MONO_ACCOUNTS;
  };

  const linkMutation = api_client.account.linkMonoAccount.useMutation({
    onSuccess: () => {
      toast.warning('Account is being linked');
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
    onError: () => toast.error('Something went wrong with Connecting your bank account'),
  });

  const handleLink = () =>
    linkAccount((code) => linkMutation.mutate({ code, feature: Usage.MAX_MONO_ACCOUNTS }));

  const handleRelink = (accountId: string) => {
    setRelinkingId(accountId);
    reauthenticate(accountId, (code, accId) => relinkMutation.mutate({ code, accountId: accId }));
  };

  const handleSync = (id: string) => {
    setSyncingId(id);
    syncMutation.mutate({ id });
  };

  return (
    <div className="flex flex-col">
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

      {/* ── Slot nudge ── */}
      <UsageBanner
        used={plan?.resourceCounts.monoBankAccounts ?? 0}
        limit={(plan?.limits?.[Usage.MAX_MONO_ACCOUNTS] ?? 1) as number}
        variant="slot"
        label="bank account"
        className="mx-6 mb-2"
      />

      {/* ── Content ── */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <AccountsSkeleton />
        ) : accounts.length === 0 ? (
          <AccountsEmpty onLink={handleLink} isLinking={linkMutation.isPending} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:max-w-4xl">
            {accounts.map((account) => (
              <div
                role="button"
                key={account.id}
                className="cursor-pointer text-left"
                onClick={() => setSelectedAccount(account)}
              >
                <AccountCard
                  account={account}
                  bankLogo={getBank(account.bankId)?.logo}
                  onRelink={handleRelink}
                  isRelinking={relinkingId === account.accountId && relinkMutation.isPending}
                  onSync={handleSync}
                  isSyncing={syncingId === account.id && syncMutation.isPending}
                  isEditable={canMutateAccount(account)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Dialogs / drawers ── */}
      <ProGateModal
        feature={Usage.MAX_MONO_ACCOUNTS}
        open={createGate.open}
        onClose={createGate.onClose}
      />

      <AccountDrawer
        account={selectedAccount}
        bankLogo={selectedAccount ? getBank(selectedAccount.bankId)?.logo : undefined}
        onOpenChange={(open) => {
          if (!open) setSelectedAccount(null);
        }}
        onSync={handleSync}
        isSyncing={!!syncingId && syncingId === selectedAccount?.id && syncMutation.isPending}
        onRelink={handleRelink}
        isRelinking={
          !!relinkingId && relinkingId === selectedAccount?.accountId && relinkMutation.isPending
        }
      />
    </div>
  );
}
