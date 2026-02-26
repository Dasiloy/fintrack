import * as React from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Breadcrumb (root nav)
// ---------------------------------------------------------------------------

function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

Breadcrumb.displayName = 'Breadcrumb';

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        'gap-space-2 flex flex-wrap items-center wrap-break-word',
        'text-body-sm text-text-tertiary',
        className,
      )}
      {...props}
    />
  );
}

BreadcrumbList.displayName = 'BreadcrumbList';

// ---------------------------------------------------------------------------
// BreadcrumbItem
// ---------------------------------------------------------------------------

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('gap-space-2 inline-flex items-center', className)}
      {...props}
    />
  );
}

BreadcrumbItem.displayName = 'BreadcrumbItem';

// ---------------------------------------------------------------------------
// BreadcrumbLink
// ---------------------------------------------------------------------------

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        'hover:text-primary duration-smooth transition-colors',
        'focus-visible:ring-primary/50 rounded-sm outline-none focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  );
}

BreadcrumbLink.displayName = 'BreadcrumbLink';

// ---------------------------------------------------------------------------
// BreadcrumbPage — current/active crumb
// ---------------------------------------------------------------------------

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(
        // Active page is slightly brighter than the trail
        'text-primary font-medium',
        className,
      )}
      {...props}
    />
  );
}

BreadcrumbPage.displayName = 'BreadcrumbPage';

// ---------------------------------------------------------------------------
// BreadcrumbSeparator
// ---------------------------------------------------------------------------

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn(
        // Very subtle — separator should recede visually
        'text-text-disabled [&>svg]:size-3.5',
        className,
      )}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

// ---------------------------------------------------------------------------
// BreadcrumbEllipsis — collapsed crumbs indicator
// ---------------------------------------------------------------------------

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-sm',
        'text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover',
        'duration-smooth cursor-pointer transition-colors',
        className,
      )}
      {...props}
    >
      <MoreHorizontal className="size-3.5" />
      <span className="sr-only">More</span>
    </span>
  );
}

BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
