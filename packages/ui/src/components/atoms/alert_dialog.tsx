import * as React from 'react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';

import { cn } from '@ui/lib/utils/cn';
import { Button } from '@ui/components/atoms/button';

// ---------------------------------------------------------------------------
// AlertDialog (root)
// ---------------------------------------------------------------------------

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

AlertDialog.displayName = 'AlertDialog';

// ---------------------------------------------------------------------------
// AlertDialogTrigger
// ---------------------------------------------------------------------------

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

AlertDialogTrigger.displayName = 'AlertDialogTrigger';

// ---------------------------------------------------------------------------
// AlertDialogPortal
// ---------------------------------------------------------------------------

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

AlertDialogPortal.displayName = 'AlertDialogPortal';

// ---------------------------------------------------------------------------
// AlertDialogOverlay
// ---------------------------------------------------------------------------

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        // Backdrop: deep bg with stronger opacity for focus
        'bg-bg-deep/75 fixed inset-0 z-50 backdrop-blur-sm',
        // Animations
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

AlertDialogOverlay.displayName = 'AlertDialogOverlay';

// ---------------------------------------------------------------------------
// AlertDialogContent
// ---------------------------------------------------------------------------

function AlertDialogContent({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: 'default' | 'sm';
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          // Surface: elevated opaque card
          'bg-bg-elevated border-border-subtle shadow-card rounded-card border',
          // Layout
          'fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2',
          'gap-space-6 p-space-6 max-w-[calc(100%-2rem)]',
          // Size variants
          'data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg',
          // Group context for child selectors
          'group/alert-dialog-content',
          // Animations
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          'duration-smooth',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

AlertDialogContent.displayName = 'AlertDialogContent';

// ---------------------------------------------------------------------------
// AlertDialogHeader
// ---------------------------------------------------------------------------

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'gap-space-2 grid grid-rows-[auto_1fr] place-items-center text-center',
        'has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr]',
        'has-data-[slot=alert-dialog-media]:gap-x-space-6',
        'sm:group-data-[size=default]/alert-dialog-content:place-items-start',
        'sm:group-data-[size=default]/alert-dialog-content:text-left',
        'sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]',
        className,
      )}
      {...props}
    />
  );
}

AlertDialogHeader.displayName = 'AlertDialogHeader';

// ---------------------------------------------------------------------------
// AlertDialogFooter
// ---------------------------------------------------------------------------

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'gap-space-3 flex flex-col-reverse',
        'group-data-[size=sm]/alert-dialog-content:grid',
        'group-data-[size=sm]/alert-dialog-content:grid-cols-2',
        'sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

AlertDialogFooter.displayName = 'AlertDialogFooter';

// ---------------------------------------------------------------------------
// AlertDialogTitle
// ---------------------------------------------------------------------------

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        'text-h4 text-text-primary',
        'sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
        className,
      )}
      {...props}
    />
  );
}

AlertDialogTitle.displayName = 'AlertDialogTitle';

// ---------------------------------------------------------------------------
// AlertDialogDescription
// ---------------------------------------------------------------------------

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-body-sm text-text-secondary', className)}
      {...props}
    />
  );
}

AlertDialogDescription.displayName = 'AlertDialogDescription';

// ---------------------------------------------------------------------------
// AlertDialogMedia — icon/image area in the header
// ---------------------------------------------------------------------------

function AlertDialogMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        // Surface matches elevated card sections
        'bg-bg-surface-hover rounded-card mb-2 inline-flex size-16 items-center justify-center',
        'sm:group-data-[size=default]/alert-dialog-content:row-span-2',
        "*:[svg:not([class*='size-'])]:size-8",
        className,
      )}
      {...props}
    />
  );
}

AlertDialogMedia.displayName = 'AlertDialogMedia';

// ---------------------------------------------------------------------------
// AlertDialogAction — confirm button (uses Button with asChild)
// ---------------------------------------------------------------------------

function AlertDialogAction({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action
        data-slot="alert-dialog-action"
        className={cn(className)}
        {...props}
      />
    </Button>
  );
}

AlertDialogAction.displayName = 'AlertDialogAction';

// ---------------------------------------------------------------------------
// AlertDialogCancel — dismiss button
// ---------------------------------------------------------------------------

function AlertDialogCancel({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel
        data-slot="alert-dialog-cancel"
        className={cn(className)}
        {...props}
      />
    </Button>
  );
}

AlertDialogCancel.displayName = 'AlertDialogCancel';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
