import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@ui/lib/utils/cn"

const toggleVariants = cva(
  [
    "inline-flex items-center justify-center rounded-button text-body-sm font-medium whitespace-nowrap outline-none transition-[color,box-shadow] duration-smooth",
    "hover:bg-bg-surface-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-50",
    "data-[state=on]:bg-bg-surface-hover data-[state=on]:text-text-primary",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "focus-visible:ring-2 focus-visible:ring-primary/50 aria-invalid:border-error aria-invalid:ring-error/20",
  ],
  {
    variants: {
      variant: {
        default: "bg-transparent gap-space-2",
        outline:
          "border border-border-subtle bg-transparent gap-space-2 hover:bg-bg-surface-hover hover:text-text-primary",
      },
      size: {
        default: "h-11 px-space-2 min-w-11",
        sm: "h-9 px-space-1.5 min-w-9",
        lg: "h-12 px-space-2.5 min-w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
