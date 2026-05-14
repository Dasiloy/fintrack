import { Skeleton } from '@ui/components';

function BudgetCardSkeletonItem() {
  return (
    <div className="border-border-subtle bg-bg-surface flex flex-col rounded-xl border p-4">
      {/* Header: dot + name/label + kebab */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Skeleton className="mt-0.5 size-2.5 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-2.5 w-14 rounded" />
          </div>
        </div>
        <Skeleton className="size-6 shrink-0 rounded" />
      </div>

      {/* Ring */}
      <div className="my-4 flex items-center justify-center">
        <Skeleton className="size-24 rounded-full" />
      </div>

      {/* Amounts */}
      <div className="mt-auto space-y-0.5">
        <div className="flex items-baseline justify-between gap-1">
          <Skeleton className="h-2.5 w-8 rounded" />
          <Skeleton className="h-3 w-14 rounded" />
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <Skeleton className="h-2.5 w-6 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <div className="border-border-subtle mt-1.5 border-t pt-1.5">
          <div className="flex items-baseline justify-between gap-1">
            <Skeleton className="h-2.5 w-14 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface BudgetCardSkeletonProps {
  count?: number;
}

export function BudgetCardSkeleton({ count = 4 }: BudgetCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <BudgetCardSkeletonItem key={i} />
      ))}
    </>
  );
}
