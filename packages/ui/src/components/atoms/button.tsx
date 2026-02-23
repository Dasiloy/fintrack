import * as React from 'react';
import { Slot } from 'radix-ui';
import { cn } from '@ui/lib/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-body font-medium transition-all duration-smooth ease-smooth disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-primary/50 focus-visible:ring-2 active:scale-95",
  {
    variants: {
      variant: {
        default:
          'bg-linear-to-r from-primary to-primary-dark text-white shadow-glow hover:shadow-glow-hover',
        destructive: 'bg-error text-white hover:bg-error/90 shadow-sm',
        outline:
          'border border-border-light bg-transparent hover:bg-bg-surface-hover hover:border-primary/50 text-text-primary',
        secondary:
          'bg-bg-surface-hover text-text-primary hover:bg-bg-surface border border-white/5',
        ghost: 'hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-11 px-6 py-2',
        xs: 'h-7 px-2 text-caption',
        sm: 'h-9 px-4 text-body',
        lg: 'h-14 px-8 text-body-lg font-semibold',
        icon: 'size-11',
        'icon-sm': 'size-9',
      },
      pointer: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      pointer: true,
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" />
          {size !== 'icon' && size !== 'icon-sm' && children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
