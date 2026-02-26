import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@ui/lib/utils/cn';
import { Separator } from '@ui/components/atoms/separator';

// ---------------------------------------------------------------------------
// ButtonGroup (root)
// Groups buttons or inputs into a connected strip, collapsing shared borders.
// ---------------------------------------------------------------------------

const buttonGroupVariants = cva(
  [
    'flex w-fit items-stretch',
    // Focus management — keep focused child above neighbors so ring isn't clipped
    '[&>*]:focus-visible:z-10 [&>*]:focus-visible:relative',
    // Select trigger width
    "[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit",
    // Flex input fills remaining space
    '[&>input]:flex-1',
    // Nested groups get a gap
    'has-[>[data-slot=button-group]]:gap-space-2',
  ],
  {
    variants: {
      orientation: {
        horizontal: [
          '[&>*:not(:first-child)]:rounded-l-none',
          '[&>*:not(:first-child)]:border-l-0',
          '[&>*:not(:last-child)]:rounded-r-none',
        ],
        vertical: [
          'flex-col',
          '[&>*:not(:first-child)]:rounded-t-none',
          '[&>*:not(:first-child)]:border-t-0',
          '[&>*:not(:last-child)]:rounded-b-none',
        ],
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
);

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

ButtonGroup.displayName = 'ButtonGroup';

// ---------------------------------------------------------------------------
// ButtonGroupText — static label/prefix/suffix attached to the group
// ---------------------------------------------------------------------------

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      className={cn(
        // Surface matches input fields
        'bg-bg-surface gap-space-2 rounded-button border-border-subtle flex items-center border',
        'px-space-4 text-body text-text-secondary font-medium',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

ButtonGroupText.displayName = 'ButtonGroupText';

// ---------------------------------------------------------------------------
// ButtonGroupSeparator — thin divider between grouped items
// ---------------------------------------------------------------------------

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        'bg-border-subtle relative m-0! self-stretch data-[orientation=vertical]:h-auto',
        className,
      )}
      {...props}
    />
  );
}

ButtonGroupSeparator.displayName = 'ButtonGroupSeparator';

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
