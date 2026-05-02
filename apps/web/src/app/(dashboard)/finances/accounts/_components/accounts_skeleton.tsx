import { Skeleton } from '@ui/components';

export function AccountsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:max-w-4xl">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="glass-card rounded-card border-border-subtle flex flex-col gap-0 overflow-hidden border"
        >
          <div className="flex items-start gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="bg-border-subtle mx-4 h-px" />
          <div className="flex items-center justify-between px-4 py-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
