import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Variants
// Designed for table use: compact, semantic, glanceable.
// All colored variants use low-opacity bg + matching border + colored text
// so they read clearly on both bg-bg-surface and bg-bg-elevated table rows.
// ---------------------------------------------------------------------------

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full border',
    'px-2 py-[3px]',
    'text-caption font-medium leading-none',
    'w-fit whitespace-nowrap shrink-0',
    '[&>svg]:size-3 [&>svg]:pointer-events-none [&>svg]:shrink-0',
    'transition-colors duration-smooth',
  ],
  {
    variants: {
      variant: {
        /** Brand purple — categories, labels, plan tiers */
        default: 'bg-primary/15     border-primary/20     text-primary',
        /** Green — Paid, Active, Confirmed, Completed, Success */
        success: 'bg-success/10     border-success/20     text-success',
        /** Amber — Pending, Processing, Due Soon, Under Review */
        warning: 'bg-warning/10     border-warning/20     text-warning',
        /** Red — Failed, Overdue, Rejected, Cancelled, Declined */
        error: 'bg-error/10       border-error/20       text-error',
        /** Red alias kept for shadcn compat */
        destructive: 'bg-error/10       border-error/20       text-error',
        /** Blue — New, Syncing, Informational */
        info: 'bg-info/10        border-info/20        text-info',
        /** Muted neutral — Draft, Archived, Inactive, N/A */
        secondary: 'bg-bg-surface-hover border-border-subtle text-text-secondary',
        /** Transparent, border only — subtle secondary labels */
        outline: 'bg-transparent    border-border-light    text-text-tertiary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export interface BadgeProps
  extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  /**
   * Renders a small filled dot before the label text.
   * Inherits the variant color via `currentColor`.
   * Ideal for status columns in tables (● Paid, ● Pending…).
   */
  dot?: boolean;
}

function Badge({
  className,
  variant = 'default',
  asChild = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </Comp>
  );
}

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
