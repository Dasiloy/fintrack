'use client';

import * as React from 'react';
import Image from 'next/image';
import { format } from '@fintrack/utils/date';
import { ChevronDown, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import type { MonoBankAccount } from '@fintrack/database/types';
import { api_client } from '@/lib/trpc_app/api_client';
import { DrawerFooter, DrawerHeader, Row, Section } from '@/app/_components';
import { bankColor, maskNumber, STATUS_CONFIG } from '@/app/(dashboard)/finances/accounts/helper';
import { TransactionMiniSkeleton } from '@/app/(dashboard)/finances/accounts/_components/transaction_card_skeleton';
import { TransactionMiniCard } from '@/app/(dashboard)/finances/accounts/_components/transaction_card';

export interface AccountDrawerProps {
  account: MonoBankAccount | null;
  bankLogo?: string;
  onOpenChange: (open: boolean) => void;
  onSync: (id: string) => void;
  isSyncing: boolean;
  onRelink: (accountId: string) => void;
  isRelinking: boolean;
  onDisconnect: (id: string) => void;
  isDisconnecting: boolean;
}

export function AccountDrawer({
  account,
  bankLogo,
  onOpenChange,
  onSync,
  isSyncing,
  onRelink,
  isRelinking,
  onDisconnect,
  isDisconnecting,
}: AccountDrawerProps) {
  const open = !!account;

  const [txExpanded, setTxExpanded] = React.useState(false);

  React.useEffect(() => {
    setTxExpanded(false);
  }, [account?.id]);

  const {
    data: txData,
    isLoading: txLoading,
    isFetchingNextPage: txFetchingNextPage,
    fetchNextPage: txFetchNextPage,
    hasNextPage: txHasNextPage,
  } = api_client.transaction.getAll.useInfiniteQuery(
    { bankAccountId: account?.id ?? '', limit: 10 },
    {
      enabled: txExpanded && !!account,
      getNextPageParam: (lastPage) => {
        const meta = lastPage.meta;
        if (!meta) return undefined;
        return meta.page < meta.lastPage ? meta.page + 1 : undefined;
      },
      initialCursor: 1,
    },
  );

  const txList = React.useMemo(
    () => txData?.pages.flatMap((page) => page.data ?? []) ?? [],
    [txData],
  );

  const color = account ? bankColor(account.bankName) : '#6366f1';
  const status = account ? (STATUS_CONFIG[account.status] ?? STATUS_CONFIG.AVAILABLE!) : null;
  const needsRelink = account?.status === 'UNAVAILABLE';
  const isProcessing = account?.status === 'PROCESSING';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        title="Account Details"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DrawerHeader title="Account Details" onClose={() => onOpenChange(false)} />

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-5 overflow-x-hidden px-6 py-5">
            {/* ── Hero ── */}
            <div className="flex flex-col items-center gap-2 pb-1 text-center">
              <div
                className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white"
                style={
                  bankLogo ? undefined : { background: `color-mix(in srgb, ${color} 80%, #000)` }
                }
              >
                {bankLogo ? (
                  <Image
                    src={bankLogo}
                    alt={account!.bankName}
                    width={56}
                    height={56}
                    className="size-full object-cover"
                  />
                ) : (
                  account?.bankName[0]?.toUpperCase()
                )}
              </div>

              <div>
                <p className="text-text-primary text-[15px] leading-snug font-semibold">
                  {account?.accountName}
                </p>
                <p className="text-text-tertiary mt-0.5 text-[12px]">{account?.bankName}</p>
              </div>
            </div>

            <Separator className="bg-border-light" />

            {/* ── Account Details ── */}
            <Section label="Account Details">
              <Row label="Account Number" mono>
                {maskNumber(account?.accountNumber ?? '')}
              </Row>
              <Row label="Account Type">{account?.accountType.replace(/_/g, ' ')}</Row>
              <Row label="Currency">{account?.accountCurrency}</Row>
              <Row label="Status">
                {status && (
                  <span className={cn('flex items-center gap-1.5', status.text)}>
                    <span className={cn('size-1.5 rounded-full', status.dot)} />
                    {status.label}
                  </span>
                )}
              </Row>
              <Row label="Last Synced">
                {account?.lastSyncedAt
                  ? format(new Date(account.lastSyncedAt), 'MMM D, YYYY')
                  : 'Never'}
              </Row>
              <Row label="Default Account">{account?.isDefault ? 'Yes' : 'No'}</Row>
            </Section>

            {/* ── Transactions ── */}
            <div>
              <button
                type="button"
                onClick={() => setTxExpanded((v) => !v)}
                className="text-text-secondary hover:text-text-primary flex w-full cursor-pointer items-center justify-between pb-2 text-[11px] font-semibold tracking-wider uppercase transition-colors"
              >
                <span>Transactions</span>
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform duration-200',
                    txExpanded && 'rotate-180',
                  )}
                />
              </button>

              {txExpanded && (
                <div className="space-y-2">
                  {txLoading && (
                    <>
                      <TransactionMiniSkeleton />
                      <TransactionMiniSkeleton />
                      <TransactionMiniSkeleton />
                    </>
                  )}

                  {!txLoading && txList.length === 0 && (
                    <p className="text-text-disabled py-5 text-center text-[12px]">
                      No transactions for this account yet.
                    </p>
                  )}

                  {txList.map((tx) => (
                    <TransactionMiniCard key={tx.id} transaction={tx} />
                  ))}

                  {txHasNextPage && (
                    <button
                      type="button"
                      onClick={() => txFetchNextPage()}
                      disabled={txFetchingNextPage}
                      className="text-primary w-full cursor-pointer py-2 text-center text-[12px] font-medium hover:opacity-70 disabled:opacity-50"
                    >
                      {txFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter>
          {isProcessing ? (
            <p className="text-primary flex-1 text-center text-[12px] font-medium">
              Account is being set up — check back shortly.
            </p>
          ) : needsRelink ? (
            <Button
              variant="destructive"
              size="sm"
              loading={isRelinking}
              onClick={() => onRelink(account!.accountId)}
              className="flex-1 gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Reconnect Account
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              loading={isSyncing}
              onClick={() => onSync(account!.id)}
              className="flex-1 gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Sync Account
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-red-400 hover:text-red-400">
                <Trash2 className="size-3.5" />
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the connection. Historical transactions are kept for 90 days then
                  deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  loading={isDisconnecting}
                  onClick={() => onDisconnect(account!.id)}
                >
                  Disconnect
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DrawerFooter>
      </SheetContent>
    </Sheet>
  );
}
