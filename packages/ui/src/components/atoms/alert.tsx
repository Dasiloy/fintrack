'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { XIcon } from 'lucide-react';

import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const alertVariants = cva(
  [
    'relative w-full rounded-button border overflow-hidden',
    'px-space-4 py-space-3',
    'text-body text-text-primary',
    'grid has-[>svg]:grid-cols-[16px_1fr] grid-cols-[0_1fr]',
    'has-[>svg]:gap-x-space-3 gap-y-1 items-start',
    '[&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:shrink-0 [&>svg]:text-current',
  ],
  {
    variants: {
      variant: {
        default: 'bg-info/10    border-info/20    [&>svg]:text-info',
        info: 'bg-info/10    border-info/20    [&>svg]:text-info',
        success: 'bg-success/10 border-success/20 [&>svg]:text-success',
        warning: 'bg-warning/10 border-warning/20 [&>svg]:text-warning',
        error: 'bg-error/10   border-error/20   [&>svg]:text-error',
        destructive: 'bg-error/10   border-error/20   [&>svg]:text-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// ---------------------------------------------------------------------------
// Alert (base)
// ---------------------------------------------------------------------------

export interface AlertProps
  extends React.ComponentProps<'div'>, VariantProps<typeof alertVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Duration ms for progress bar — only rendered when > 0 */
  duration?: number;
}

function Alert({
  className,
  variant,
  dismissible = false,
  onDismiss,
  duration,
  children,
  ...props
}: AlertProps) {
  const [internalDismissed, setInternalDismissed] = React.useState(false);
  const handleDismiss = onDismiss ?? (() => setInternalDismissed(true));

  if (internalDismissed && !onDismiss) return null;

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), dismissible && 'pr-10', className)}
      {...props}
    >
      {children}

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={handleDismiss}
          className={cn(
            'top-space-3 right-space-3 absolute cursor-pointer',
            'text-text-tertiary rounded-sm',
            'hover:text-text-primary duration-smooth transition-colors',
            'focus-visible:ring-primary/50 outline-none focus-visible:ring-2',
          )}
        >
          <XIcon className="size-4" />
        </button>
      )}

      {/* Progress bar — shrinks left-to-right over duration */}
      {duration && duration > 0 && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left opacity-40"
          style={{
            backgroundColor: 'currentColor',
            animation: `alert-progress ${duration}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

Alert.displayName = 'Alert';

// ---------------------------------------------------------------------------
// AlertTitle
// ---------------------------------------------------------------------------

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'text-text-primary text-body-sm col-start-2 line-clamp-1 font-medium',
        className,
      )}
      {...props}
    />
  );
}

AlertTitle.displayName = 'AlertTitle';

// ---------------------------------------------------------------------------
// AlertDescription
// ---------------------------------------------------------------------------

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-text-secondary col-start-2 text-xs',
        'grid justify-items-start gap-1 [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

AlertDescription.displayName = 'AlertDescription';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { Alert, AlertTitle, AlertDescription, alertVariants };
