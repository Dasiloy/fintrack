import { Skeleton } from '@ui/components';

function SplitCardSkeletonItem() {
  return (
    <div className="border-border-subtle bg-bg-surface flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
    </div>
  );
}

export function SplitCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SplitCardSkeletonItem key={i} />
      ))}
    </>
  );
}
