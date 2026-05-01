'use client';

import { Skeleton } from '@ui/components';

export function BillCardSkeleton() {
  return (
    <div className="bg-bg-surface border-border-subtle relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-4">
      {/* Accent strip */}
      <Skeleton className="absolute inset-x-0 top-0 h-[3px] rounded-none" />

      {/* Row 1: avatar · name + chip placeholder · menu ghost */}
      <div className="flex items-start gap-3 pt-0.5">
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-[14px] w-3/4 rounded-md" />
          <Skeleton className="h-[18px] w-1/3 rounded-full" />
        </div>
        <Skeleton className="size-7 shrink-0 rounded-lg" />
      </div>

      {/* Row 2: amount block · due chip */}
      <div className="flex items-end justify-between gap-2">
        <div className="space-y-1.5">
          <Skeleton className="h-[22px] w-32 rounded-md" />
          <Skeleton className="h-[11px] w-16 rounded-md" />
        </div>
        <Skeleton className="h-[24px] w-28 rounded-full" />
      </div>
    </div>
  );
}
