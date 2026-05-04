'use client';

interface BudgetCardSkeletonProps {
  count?: number;
}

export function BudgetCardSkeleton({ count = 4 }: BudgetCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-border-subtle bg-bg-surface animate-pulse rounded-xl border p-4"
          style={{ height: 220 }}
        />
      ))}
    </>
  );
}
