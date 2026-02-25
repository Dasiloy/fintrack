import * as React from 'react';
import { AlertCircleIcon } from 'lucide-react';

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
        'px-space-4 py-space-2 text-text-primary text-body-sm',
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

// ---------------------------------------------------------------------------
// InputLabel
// ---------------------------------------------------------------------------

export interface InputLabelProps extends React.ComponentProps<'label'> {
  required?: boolean;
}

function InputLabel({ className, children, required, ...props }: InputLabelProps) {
  return (
    <label
      data-slot="input-label"
      className={cn(
        'text-text-secondary text-body-sm font-medium',
        'group-data-[invalid=true]:text-error',
        'duration-smooth cursor-pointer transition-colors',
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-error ml-[3px]">
          *
        </span>
      )}
    </label>
  );
}

InputLabel.displayName = 'InputLabel';

// ---------------------------------------------------------------------------
// InputError
// ---------------------------------------------------------------------------

function InputError({ className, children, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="input-error"
      role="alert"
      className={cn('gap-space-1 text-caption text-error flex items-center', className)}
      {...props}
    >
      <AlertCircleIcon className="size-3 shrink-0" />
      {children}
    </p>
  );
}

InputError.displayName = 'InputError';

// ---------------------------------------------------------------------------
// InputHint
// ---------------------------------------------------------------------------

function InputHint({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="input-hint"
      className={cn('text-caption text-text-tertiary', className)}
      {...props}
    />
  );
}

InputHint.displayName = 'InputHint';

// ---------------------------------------------------------------------------
// InputField — wrapper that composes label + input + error/hint
// ---------------------------------------------------------------------------

export interface InputFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

function InputField({ label, error, hint, required, id, className, children }: InputFieldProps) {
  const fieldId = id ?? React.useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const invalid = !!error;

  return (
    <div
      data-slot="input-field"
      data-invalid={invalid}
      className={cn('group gap-space-2 flex flex-col', className)}
    >
      {label && (
        <InputLabel htmlFor={fieldId} required={required}>
          {label}
        </InputLabel>
      )}

      {/* Clone child input to inject the wired-up ids */}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<React.ComponentProps<'input'>>, {
            id: fieldId,
            'aria-invalid': invalid || undefined,
            'aria-describedby':
              [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined,
          })
        : children}

      {error && <InputError id={errorId}>{error}</InputError>}
      {!error && hint && <InputHint id={hintId}>{hint}</InputHint>}
    </div>
  );
}

InputField.displayName = 'InputField';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { Input, InputLabel, InputError, InputHint, InputField };
