import { cn } from "@ui/lib/utils/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-bg-surface-hover animate-pulse rounded-button", className)}
      {...props}
    />
  )
}

export { Skeleton }
