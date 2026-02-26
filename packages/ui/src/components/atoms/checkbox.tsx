import * as React from 'react';
import { CheckIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';

import { cn } from '@ui/lib/utils/cn';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'rounded-chart size-4 shrink-0',
        // Surface
        'border-border-subtle border bg-transparent',
        // Checked state — filled with primary brand color
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white',
        // Focus ring
        'focus-visible:ring-primary/50 outline-none focus-visible:ring-2',
        // Invalid state
        'aria-invalid:border-error aria-invalid:ring-error/20 aria-invalid:ring-2',
        // Transitions
        'duration-smooth transition-all',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

Checkbox.displayName = 'Checkbox';

export { Checkbox };
