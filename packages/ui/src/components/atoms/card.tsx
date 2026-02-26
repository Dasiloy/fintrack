import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Card (root)
// ---------------------------------------------------------------------------

const cardVariants = cva('flex flex-col rounded-card transition-all duration-smooth ease-smooth', {
  variants: {
    variant: {
      /** Semi-transparent glass surface — dashboards, stat widgets */
      glass: 'glass-card',
      /** Opaque elevated surface — forms, modals, focused content */
      elevated: 'bg-bg-elevated border border-border-subtle shadow-card',
      /** Solid surface with no shadow — nested cards, list items */
      flat: 'bg-bg-surface border border-border-subtle',
      /** No visual weight — subtle grouping, sidebar sections */
      ghost: 'bg-transparent',
    },
    padding: {
      /** Standard internal spacing — use when composing with sub-components */
      none: '',
      /** Compact spacing — stat widgets, dense layouts */
      compact: 'p-space-4 gap-space-3',
      /** Default spacing — standalone card without sub-components */
      default: 'p-space-6 gap-space-4',
    },
  },
  defaultVariants: {
    variant: 'glass',
    padding: 'none',
  },
});

export interface CardProps extends React.ComponentProps<'div'>, VariantProps<typeof cardVariants> {}

function Card({ className, variant, padding, ref, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant ?? 'glass'}
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

Card.displayName = 'Card';

// ---------------------------------------------------------------------------
// CardHeader
// ---------------------------------------------------------------------------

export interface CardHeaderProps extends React.ComponentProps<'div'> {
  /** Renders a bottom divider between header and content */
  divided?: boolean;
}

function CardHeader({ className, divided = false, ref, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      ref={ref}
      className={cn(
        'gap-space-1 @container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start',
        'px-space-6 pt-space-6 pb-space-4',
        'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        divided && 'border-border-subtle pb-space-4 border-b',
        className,
      )}
      {...props}
    />
  );
}

CardHeader.displayName = 'CardHeader';

// ---------------------------------------------------------------------------
// CardTitle
// ---------------------------------------------------------------------------

export interface CardTitleProps extends React.ComponentProps<'h3'> {}

function CardTitle({ className, ref, ...props }: CardTitleProps) {
  return (
    <h3
      data-slot="card-title"
      ref={ref}
      className={cn('text-h4 text-text-primary col-start-1', className)}
      {...props}
    />
  );
}

CardTitle.displayName = 'CardTitle';

// ---------------------------------------------------------------------------
// CardDescription
// ---------------------------------------------------------------------------

export interface CardDescriptionProps extends React.ComponentProps<'p'> {}

function CardDescription({ className, ref, ...props }: CardDescriptionProps) {
  return (
    <p
      data-slot="card-description"
      ref={ref}
      className={cn('text-body-sm text-text-secondary col-start-1', className)}
      {...props}
    />
  );
}

CardDescription.displayName = 'CardDescription';

// ---------------------------------------------------------------------------
// CardAction — slots into the top-right of CardHeader via grid placement
// ---------------------------------------------------------------------------

export interface CardActionProps extends React.ComponentProps<'div'> {}

function CardAction({ className, ref, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      ref={ref}
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

CardAction.displayName = 'CardAction';

// ---------------------------------------------------------------------------
// CardContent
// ---------------------------------------------------------------------------

export interface CardContentProps extends React.ComponentProps<'div'> {}

function CardContent({ className, ref, ...props }: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      ref={ref}
      className={cn('px-space-6 pb-space-4 min-h-0 flex-1', className)}
      {...props}
    />
  );
}

CardContent.displayName = 'CardContent';

// ---------------------------------------------------------------------------
// CardFooter
// ---------------------------------------------------------------------------

export interface CardFooterProps extends React.ComponentProps<'div'> {
  /** Renders a top divider between content and footer */
  divided?: boolean;
}

function CardFooter({ className, divided = false, ref, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      ref={ref}
      className={cn(
        'gap-space-3 px-space-6 pb-space-6 flex items-center',
        divided && 'border-border-subtle pt-space-4 border-t',
        className,
      )}
      {...props}
    />
  );
}

CardFooter.displayName = 'CardFooter';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
