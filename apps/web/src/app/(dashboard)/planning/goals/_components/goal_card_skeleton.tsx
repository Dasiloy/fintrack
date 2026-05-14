import { Skeleton } from '@ui/components';

function GoalCardSkeletonItem() {
  return (
    <div className="border-border-subtle bg-bg-surface flex flex-col gap-3 rounded-xl border p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      {/* Mini chart */}
      <Skeleton className="h-9 w-full rounded" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
    </div>
  );
}

export function GoalCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <GoalCardSkeletonItem key={i} />
      ))}
    </>
  );
}
