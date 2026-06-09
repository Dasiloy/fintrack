'use client';

import { Skeleton } from '@ui/components';

export function TransactionMiniSkeleton() {
  return (
    <div className="bg-bg-surface shadow-card overflow-hidden rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 w-40 rounded-full" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-20 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
