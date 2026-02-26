import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@ui/lib/utils/cn';
import { Button } from '@ui/components/atoms/button';
import { Input } from '@ui/components/atoms/input';
import { Textarea } from '@ui/components/atoms/textarea';

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        'group/input-group rounded-button border border-border-subtle bg-bg-surface relative flex w-full min-w-0 overflow-hidden outline-none',
        'duration-smooth hover:border-border-light h-10 transition-[color,box-shadow] has-[>textarea]:h-auto',

        // Variants based on alignment (target control by data-slot for textarea support).
        'has-[>[data-align=inline-start]]:**:data-[slot=input-group-control]:pl-space-2',
        'has-[>[data-align=inline-end]]:**:data-[slot=input-group-control]:pr-space-2',
        'has-[>[data-align=block-start]]:**:data-[slot=input-group-control]:pb-space-3 has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col',
        'has-[>[data-align=block-end]]:**:data-[slot=input-group-control]:pt-space-3 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col',

        // Focus/error (match Input: border-primary/30, ring-2 ring-primary/50).
        'has-[[data-slot=input-group-control]:focus-visible]:border-primary/30 has-[[data-slot=input-group-control]:focus-visible]:ring-primary/50 has-[[data-slot=input-group-control]:focus-visible]:ring-2',
        'has-[[data-slot][aria-invalid=true]]:border-error has-[[data-slot][aria-invalid=true]]:ring-error/20 has-[[data-slot][aria-invalid=true]]:ring-2',

        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "text-text-secondary flex h-auto cursor-text items-center justify-center gap-space-2 py-space-1.5 text-body-sm font-medium select-none [&>svg:not([class*='size-'])]:size-4 [&>kbd]:rounded-chart group-data-[disabled=true]/input-group:opacity-50",
  {
    variants: {
      align: {
        'inline-start':
          'order-first pl-space-3 rounded-l-button has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]',
        'inline-end':
          'order-last pr-space-3 rounded-r-button has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]',
        'block-start':
          'order-first w-full justify-start rounded-t-button px-space-3 pt-space-3 [.border-b]:pb-space-3 group-has-[>input]/input-group:pt-2.5',
        'block-end':
          'order-last w-full justify-start rounded-b-button px-space-3 pb-space-3 [.border-t]:pt-space-3 group-has-[>input]/input-group:pb-2.5',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
);

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        e.currentTarget.parentElement?.querySelector('input')?.focus();
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva('text-body-sm shadow-none flex gap-space-2 items-center', {
  variants: {
    size: {
      xs: "h-6 gap-space-1 px-space-2 rounded-chart [&>svg:not([class*='size-'])]:size-3.5 has-[>svg]:px-space-2",
      sm: 'h-8 px-space-2.5 gap-space-1.5 rounded-button has-[>svg]:px-space-2.5',
      'icon-xs': 'size-6 rounded-chart p-0 has-[>svg]:p-0',
      'icon-sm': 'size-8 p-0 has-[>svg]:p-0',
    },
  },
  defaultVariants: {
    size: 'xs',
  },
});

function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        "text-text-secondary gap-space-2 text-body-sm flex items-center [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'bg-bg-surface first:rounded-l-button last:rounded-r-button flex-1 rounded-none border-0 shadow-none focus-visible:ring-0',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        'py-space-3 bg-bg-surface first:rounded-l-button last:rounded-r-button flex-1 resize-none rounded-none border-0 shadow-none focus-visible:ring-0',
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
