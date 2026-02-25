import * as React from "react"
import { CircleIcon } from "lucide-react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@ui/lib/utils/cn"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-space-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border border-border-subtle bg-bg-surface aspect-square size-4 shrink-0 rounded-full text-primary",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50 outline-none",
        "aria-invalid:border-error aria-invalid:ring-error/20",
        "disabled:cursor-not-allowed disabled:opacity-50 duration-smooth transition-[color,box-shadow]",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
