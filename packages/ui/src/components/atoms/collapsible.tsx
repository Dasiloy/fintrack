import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Collapsible (root)
// Unlike Accordion, Collapsible is a single independent expandable section.
// ---------------------------------------------------------------------------

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

Collapsible.displayName = 'Collapsible';

// ---------------------------------------------------------------------------
// CollapsibleTrigger
// Unstyled by default — consumers compose their own trigger UI.
// Common pattern: wrap a Button or a custom header div.
// ---------------------------------------------------------------------------

function CollapsibleTrigger({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      className={cn(
        'focus-visible:ring-primary/50 cursor-pointer rounded-button outline-none focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  );
}

CollapsibleTrigger.displayName = 'CollapsibleTrigger';

// ---------------------------------------------------------------------------
// CollapsibleContent
// Animated expand/collapse using the same keyframes as Accordion.
// ---------------------------------------------------------------------------

function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        'overflow-hidden',
        'data-[state=open]:animate-accordion-down',
        'data-[state=closed]:animate-accordion-up',
        className,
      )}
      {...props}
    />
  );
}

CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
