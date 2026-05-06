import { Skeleton } from '@ui/components';

function UnbudgetedCategoryCardSkeleton() {
  return (
    <div className="border-border-subtle bg-bg-surface flex flex-col rounded-xl border border-dashed p-4">
      {/* Header: dot + name + button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="size-2.5 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="size-6 shrink-0 rounded-md" />
      </div>

      {/* Spend amount + label */}
      <div className="mt-4 space-y-1.5">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-2.5 w-24 rounded" />
      </div>

      {/* Footer label */}
      <Skeleton className="mt-3 h-2.5 w-16 rounded" />
    </div>
  );
}

interface UnbudgetedCategoryCardSkeletonProps {
  count?: number;
}

export function UnbudgetedCategoryCardSkeletons({
  count = 3,
}: UnbudgetedCategoryCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <UnbudgetedCategoryCardSkeleton key={i} />
      ))}
    </>
  );
}
