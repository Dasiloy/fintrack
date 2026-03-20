import * as React from 'react';
import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'rounded-button border-border-subtle bg-bg-surface h-10 w-full min-w-0 border',
        'px-space-4 py-space-2 text-text-primary text-body',
        'placeholder:text-text-tertiary selection:bg-primary selection:text-white',
        'file:text-text-primary file:inline-flex file:h-7 file:border-0',
        'file:text-body-sm file:bg-transparent file:font-medium',
        'hover:border-border-light',
        'duration-smooth transition-all outline-none',
        '[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_var(--color-bg-surface)]',
        '[&:-webkit-autofill:hover]:shadow-[inset_0_0_0_1000px_var(--color-bg-surface)]',
        '[&:-webkit-autofill:focus]:shadow-[inset_0_0_0_1000px_var(--color-bg-surface)]',
        'focus-visible:border-primary/30 focus-visible:ring-primary/50 focus-visible:ring-2',
        'aria-invalid:border-error aria-invalid:ring-error/20 aria-invalid:ring-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

Input.displayName = 'Input';

export { Input };
