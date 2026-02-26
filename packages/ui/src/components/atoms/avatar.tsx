import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Avatar (root)
// ---------------------------------------------------------------------------

const avatarVariants = cva(
  // Ring gives a subtle separation against dark backgrounds without a hard border
  'group/avatar relative flex shrink-0 rounded-full select-none ring-1 ring-border-subtle',
  {
    variants: {
      size: {
        sm: 'size-6',
        default: 'size-8',
        lg: 'size-10',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export interface AvatarProps
  extends React.ComponentProps<typeof AvatarPrimitive.Root>, VariantProps<typeof avatarVariants> {}

function Avatar({ className, size = 'default', ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    />
  );
}

Avatar.displayName = 'Avatar';

// ---------------------------------------------------------------------------
// AvatarImage
// ---------------------------------------------------------------------------

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full overflow-hidden rounded-full object-cover', className)}
      {...props}
    />
  );
}

AvatarImage.displayName = 'AvatarImage';

// ---------------------------------------------------------------------------
// AvatarFallback
// ---------------------------------------------------------------------------

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        // Surface matches elevated card so it reads as a distinct element
        'bg-bg-surface-hover text-text-secondary overflow-hidden',
        'flex size-full items-center justify-center rounded-full font-medium',
        // Scale text with avatar size via parent data-size
        'text-body-sm',
        'group-data-[size=sm]/avatar:text-caption',
        'group-data-[size=lg]/avatar:text-body',
        className,
      )}
      {...props}
    />
  );
}

AvatarFallback.displayName = 'AvatarFallback';

// ---------------------------------------------------------------------------
// AvatarBadge — status indicator pinned to the bottom-right
// ---------------------------------------------------------------------------

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        // ring-bg-deep gives a gap between badge and avatar ring
        'absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full',
        'bg-primary ring-bg-deep ring-2 select-none',
        // Size scales with avatar
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        className,
      )}
      {...props}
    />
  );
}

AvatarBadge.displayName = 'AvatarBadge';

// ---------------------------------------------------------------------------
// AvatarGroup — stacked avatar row with separation rings
// ---------------------------------------------------------------------------

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        'group/avatar-group flex -space-x-2',
        // Override each Avatar's ring with bg-deep so they separate cleanly
        '*:data-[slot=avatar]:ring-bg-deep *:data-[slot=avatar]:ring-2',
        className,
      )}
      {...props}
    />
  );
}

AvatarGroup.displayName = 'AvatarGroup';

// ---------------------------------------------------------------------------
// AvatarGroupCount — "+N" overflow counter, inherits group size
// ---------------------------------------------------------------------------

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full select-none',
        'bg-bg-surface-hover text-text-tertiary ring-bg-deep ring-2',
        'text-caption font-medium',
        // Match size to whichever Avatar size is in the group
        'size-8',
        'group-has-data-[size=sm]/avatar-group:size-6',
        'group-has-data-[size=lg]/avatar-group:size-10',
        '[&>svg]:size-4',
        'group-has-data-[size=sm]/avatar-group:[&>svg]:size-3',
        'group-has-data-[size=lg]/avatar-group:[&>svg]:size-5',
        className,
      )}
      {...props}
    />
  );
}

AvatarGroupCount.displayName = 'AvatarGroupCount';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  avatarVariants,
};
