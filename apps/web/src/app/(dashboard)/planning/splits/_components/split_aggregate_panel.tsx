'use client';

import { Skeleton } from '@ui/components';
import { formatCurrency } from '@fintrack/utils/format';
import type { GetSplitAggregateRes } from '@fintrack/types/protos/finance/split';

interface SplitAggregatePanelProps {
  aggregate: GetSplitAggregateRes | undefined;
  isLoading: boolean;
}

interface StatTileProps {
  label: string;
  value: string | number;
  dotColor: string;
}

function StatTile({ label, value, dotColor }: StatTileProps) {
  return (
    <div className="bg-bg-surface flex flex-col gap-1 rounded-xl p-3 text-center">
      <span className="text-text-primary text-[18px] font-bold tabular-nums">{value}</span>
      <div className="flex items-center justify-center gap-1.5">
        <span className={`size-1.5 shrink-0 rounded-full ${dotColor}`} />
        <span className="text-text-disabled text-[10px] font-semibold tracking-wider uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

interface FooterRowProps {
  label: string;
  value: string;
}

function FooterRow({ label, value }: FooterRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-text-tertiary text-[12px]">{label}</span>
      <span className="text-text-primary text-[12px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function SplitAggregatePanel({ aggregate, isLoading }: SplitAggregatePanelProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-card border-border-subtle flex flex-col gap-5 border p-5">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-10 w-40 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <div className="border-border-light space-y-0 border-t pt-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex justify-between py-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalOwed = aggregate?.totalOwed ?? 0;
  const totalPaid = aggregate?.totalPaid ?? 0;
  const settledAmount = aggregate?.settledAmount ?? 0;
  const openCount = aggregate?.openCount ?? 0;
  const partialCount = aggregate?.partialCount ?? 0;
  const settledCount = aggregate?.settledCount ?? 0;

  return (
    <div className="glass-card rounded-card border-border-subtle flex flex-col gap-5 border p-5">
      {/* ── Primary metric ── */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-text-disabled text-[10px] font-semibold tracking-wider uppercase">
          Total Owed
        </p>
        <p className="text-amber-500 text-[36px] leading-none font-bold tabular-nums">
          {formatCurrency(totalOwed)}
        </p>
        <p className="text-text-tertiary text-[11px]">across outstanding splits</p>
      </div>

      {/* ── Count tiles ── */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Open" value={openCount} dotColor="bg-blue-400" />
        <StatTile label="Partial" value={partialCount} dotColor="bg-amber-400" />
        <StatTile label="Settled" value={settledCount} dotColor="bg-emerald-500" />
      </div>

      {/* ── Footer rows ── */}
      <div className="border-border-light divide-border-light divide-y border-t">
        <FooterRow label="Total collected" value={formatCurrency(totalPaid)} />
        <FooterRow label="Fully settled" value={formatCurrency(settledAmount)} />
      </div>
    </div>
  );
}
