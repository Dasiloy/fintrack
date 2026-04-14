'use client';

import * as React from 'react';
import Image from 'next/image';
import { format } from '@fintrack/utils/date';
import { formatCurrency } from '@fintrack/utils/format';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import type { MonoBankAccount } from '@fintrack/database/types';
import { bankColor, maskNumber, STATUS_CONFIG } from '@/app/(dashboard)/finances/accounts/helper';

// ---------------------------------------------------------------------------
// AccountCard
// ---------------------------------------------------------------------------

interface AccountCardProps {
  account: MonoBankAccount;
  bankLogo?: string;
  onRelink: (accountId: string) => void;
  isRelinking: boolean;
  onSync: (id: string) => void;
  isSyncing: boolean;
}

export function AccountCard({
  account,
  bankLogo,
  onRelink,
  isRelinking,
  onSync,
  isSyncing,
}: AccountCardProps) {
  const color = bankColor(account.bankName);
  const status = STATUS_CONFIG[account.status];
  const needsRelink = account.status === 'UNAVAILABLE';

  return (
    <div className="glass-card rounded-card border-border-subtle flex flex-col gap-0 overflow-hidden border">
      {/* Top row */}
      <div className="flex items-start gap-3 p-4">
        {/* Avatar — logo if available, letter fallback otherwise */}
        <div
          className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[15px] font-bold text-white"
          style={bankLogo ? undefined : { background: `color-mix(in srgb, ${color} 80%, #000)` }}
        >
          {bankLogo ? (
            <Image
              src={bankLogo}
              alt={account.bankName}
              width={40}
              height={40}
              className="size-full object-cover"
            />
          ) : (
            account.bankName[0]?.toUpperCase()
          )}
        </div>

        {/* Bank info */}
        <div className="min-w-0 flex-1">
          <p className="text-text-primary truncate text-[14px] leading-snug font-semibold">
            {account.bankName}
          </p>
          <p className="text-text-tertiary mt-0.5 text-[12px]">
            {maskNumber(account.accountNumber)}
            <span className="text-text-disabled mx-1.5">·</span>
            {account.accountType.replace("_"," ")}
          </p>
          <p className="text-text-disabled mt-0.5 truncate text-[11px]">{account.accountName}</p>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[3px] text-[11px] font-medium',
            'border',
            needsRelink
              ? 'border-error/20 bg-error/8'
              : account.status === 'PARTIAL'
                ? 'border-warning/20 bg-warning/8'
                : 'border-success/20 bg-success/8',
            status.text,
          )}
        >
          <span className={cn('size-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>

      {/* Divider */}
      <div className="bg-border-subtle mx-4 h-px" />

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-text-primary text-[15px] font-semibold tabular-nums">
            {formatCurrency(account.accountBalance)}
          </p>
          <p className="text-text-disabled mt-0.5 text-[11px]">
            {account.lastSyncedAt
              ? `Synced ${format(new Date(account.lastSyncedAt), 'MMM D, YYYY')}`
              : 'Never synced'}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {!needsRelink && (
            <Button
              size="sm"
              variant="outline"
              loading={isSyncing}
              onClick={() => onSync(account.id)}
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Sync
            </Button>
          )}
          {needsRelink && (
            <Button
              size="sm"
              variant="destructive"
              loading={isRelinking}
              onClick={() => onRelink(account.accountId)}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Reconnect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
