import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';

import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Accordion (root)
// ---------------------------------------------------------------------------

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

Accordion.displayName = 'Accordion';

// ---------------------------------------------------------------------------
// AccordionItem
// ---------------------------------------------------------------------------

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        // Divider using design system border token; last item has no bottom border
        'border-border-subtle border-b last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

AccordionItem.displayName = 'AccordionItem';

// ---------------------------------------------------------------------------
// AccordionTrigger
// ---------------------------------------------------------------------------

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          // Layout
          'gap-space-4 py-space-4 flex flex-1 items-center justify-between text-left',
          // Typography — use design system scale + colors
          'text-body text-text-primary font-medium',
          // Hover: subtle color shift instead of underline
          'hover:text-text-primary/80',
          // Open state: primary colour + chevron rotates
          'data-[state=open]:text-primary data-[state=open]:font-semibold [&[data-state=open]>svg]:rotate-180',
          // Focus ring aligned to design system
          'focus-visible:ring-primary/50 rounded-button outline-none focus-visible:ring-2',
          // Disabled
          'disabled:pointer-events-none disabled:opacity-50',
          // Smooth transition
          'duration-smooth ease-smooth transition-all',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className={cn(
            'text-text-tertiary pointer-events-none size-4 shrink-0',
            'duration-smooth ease-smooth transition-transform',
            'group-data-[state=open]:text-primary',
          )}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

AccordionTrigger.displayName = 'AccordionTrigger';

// ---------------------------------------------------------------------------
// AccordionContent
// ---------------------------------------------------------------------------

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
      {...props}
    >
      <div className={cn('pb-space-4 pt-0', 'text-body text-text-secondary', className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

AccordionContent.displayName = 'AccordionContent';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
