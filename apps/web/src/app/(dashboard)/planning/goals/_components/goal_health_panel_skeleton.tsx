import { Skeleton } from '@ui/components';

export function GoalHealthPanelSkeleton() {
  return (
    <div className="glass-card rounded-card border-border-subtle flex flex-col gap-5 border p-5">
      <div className="flex flex-col items-center gap-2 pb-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="mt-2 h-5 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-sm" />
        ))}
      </div>
      <div className="border-border-subtle space-y-2.5 border-t pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
