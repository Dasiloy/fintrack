'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
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
      className={cn('text-text-primary col-start-2 line-clamp-1 font-medium', className)}
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
        'text-body-sm text-text-secondary col-start-2',
        'grid justify-items-start gap-1 [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

AlertDescription.displayName = 'AlertDescription';

// ---------------------------------------------------------------------------
// AlertProvider — imperative showAlert(config) system
// ---------------------------------------------------------------------------

export type AlertPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

const positionClasses: Record<AlertPosition, { container: string; animation: string }> = {
  'top-right': {
    container: 'top-4 right-4 items-end',
    animation: 'animate-in fade-in slide-in-from-right-4',
  },
  'top-left': {
    container: 'top-4 left-4 items-start',
    animation: 'animate-in fade-in slide-in-from-left-4',
  },
  'bottom-right': {
    container: 'bottom-4 right-4 items-end flex-col-reverse',
    animation: 'animate-in fade-in slide-in-from-right-4',
  },
  'bottom-left': {
    container: 'bottom-4 left-4 items-start flex-col-reverse',
    animation: 'animate-in fade-in slide-in-from-left-4',
  },
  'top-center': {
    container: 'top-4 left-1/2 -translate-x-1/2 items-center',
    animation: 'animate-in fade-in slide-in-from-top-4',
  },
  'bottom-center': {
    container: 'bottom-4 left-1/2 -translate-x-1/2 items-center flex-col-reverse',
    animation: 'animate-in fade-in slide-in-from-bottom-4',
  },
};

export type AlertConfig = {
  variant?: VariantProps<typeof alertVariants>['variant'];
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  /** Override the provider's default position for this specific alert */
  position?: AlertPosition;
  /**
   * Auto-dismiss after ms. Defaults to 5000. Set 0 for persistent.
   */
  duration?: number;
};

type AlertEntry = AlertConfig & { id: string };

type AlertContextValue = {
  showAlert: (config: AlertConfig) => string;
  dismissAlert: (id: string) => void;
};

const AlertContext = React.createContext<AlertContextValue | null>(null);

export interface AlertProviderProps {
  children: React.ReactNode;
  /** Default position for all alerts. Defaults to 'top-right' */
  position?: AlertPosition;
}

function AlertProvider({ children, position: defaultPosition = 'top-right' }: AlertProviderProps) {
  const [alerts, setAlerts] = React.useState<AlertEntry[]>([]);
  const timers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissAlert = React.useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const showAlert = React.useCallback(
    (config: AlertConfig): string => {
      const id = Math.random().toString(36).slice(2, 9);
      setAlerts((prev) => [...prev, { ...config, id }]);

      const duration = config.duration ?? 5000;
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismissAlert(id), duration);
      }

      return id;
    },
    [dismissAlert],
  );

  React.useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  // Group alerts by their effective position
  const alertsByPosition = React.useMemo(() => {
    const groups: Partial<Record<AlertPosition, AlertEntry[]>> = {};
    for (const alert of alerts) {
      const pos = alert.position ?? defaultPosition;
      (groups[pos] ??= []).push(alert);
    }
    return groups;
  }, [alerts, defaultPosition]);

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <AlertContext.Provider value={{ showAlert, dismissAlert }}>
      {children}
      {portalTarget &&
        createPortal(
          <>
            {(Object.entries(alertsByPosition) as [AlertPosition, AlertEntry[]][]).map(
              ([pos, entries]) => {
                const { container, animation } = positionClasses[pos];
                return (
                  <div
                    key={pos}
                    aria-live="polite"
                    aria-label="Notifications"
                    className={cn(
                      'fixed z-50 flex flex-col gap-3',
                      'pointer-events-none w-[420px] max-w-[calc(100vw-2rem)]',
                      container,
                    )}
                  >
                    {entries.map((alert) => {
                      const duration = alert.duration ?? 5000;
                      return (
                        <div
                          key={alert.id}
                          className={cn('duration-smooth pointer-events-auto', animation)}
                        >
                          <Alert
                            variant={alert.variant}
                            dismissible={alert.dismissible ?? true}
                            onDismiss={() => dismissAlert(alert.id)}
                            duration={duration}
                            className="shadow-card"
                          >
                            {alert.icon}
                            {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
                            {alert.description && (
                              <AlertDescription>{alert.description}</AlertDescription>
                            )}
                          </Alert>
                        </div>
                      );
                    })}
                  </div>
                );
              },
            )}
          </>,
          portalTarget,
        )}
    </AlertContext.Provider>
  );
}

AlertProvider.displayName = 'AlertProvider';

// ---------------------------------------------------------------------------
// useAlert hook
// ---------------------------------------------------------------------------

function useAlert(): AlertContextValue {
  const ctx = React.useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within <AlertProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { Alert, AlertTitle, AlertDescription, AlertProvider, useAlert, alertVariants };
