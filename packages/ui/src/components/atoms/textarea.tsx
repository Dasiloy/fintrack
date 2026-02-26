import * as React from 'react';
import { AlertCircleIcon } from 'lucide-react';

import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Layout — field-sizing-content lets it grow with content
        'rounded-button field-sizing-content min-h-[88px] w-full',
        'border-border-subtle bg-bg-surface border',
        'px-space-4 py-space-3 text-body text-text-primary',
        // Placeholder
        'placeholder:text-text-tertiary',
        // Resize handle
        'resize-y',
        // Hover
        'hover:border-border-light',
        // Focus
        'duration-smooth transition-all outline-none',
        'focus-visible:border-primary/30 focus-visible:ring-primary/50 focus-visible:ring-2',
        // Invalid
        'aria-invalid:border-error aria-invalid:ring-error/20 aria-invalid:ring-2',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Thin scrollbar (consistent with combobox)
        '[scrollbar-color:var(--color-border-subtle)_transparent] [scrollbar-width:thin]',
        '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-border-subtle [&::-webkit-scrollbar-thumb]:rounded-full',
        '[&::-webkit-scrollbar-thumb:hover]:bg-border-light',
        className,
      )}
      {...props}
    />
  );
}

Textarea.displayName = 'Textarea';

// ---------------------------------------------------------------------------
// TextareaLabel
// ---------------------------------------------------------------------------

interface TextareaLabelProps extends React.ComponentProps<'label'> {
  required?: boolean;
}

function TextareaLabel({ className, children, required, ...props }: TextareaLabelProps) {
  return (
    <label
      data-slot="textarea-label"
      className={cn(
        'text-body-sm text-text-secondary font-medium',
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

TextareaLabel.displayName = 'TextareaLabel';

// ---------------------------------------------------------------------------
// TextareaError
// ---------------------------------------------------------------------------

function TextareaError({ className, children, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="textarea-error"
      role="alert"
      className={cn('gap-space-1 text-caption text-error flex items-center', className)}
      {...props}
    >
      <AlertCircleIcon className="size-3 shrink-0" />
      {children}
    </p>
  );
}

TextareaError.displayName = 'TextareaError';

// ---------------------------------------------------------------------------
// TextareaHint
// ---------------------------------------------------------------------------

function TextareaHint({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="textarea-hint"
      className={cn('text-caption text-text-tertiary', className)}
      {...props}
    />
  );
}

TextareaHint.displayName = 'TextareaHint';

// ---------------------------------------------------------------------------
// TextareaField — wrapper
// ---------------------------------------------------------------------------

interface TextareaFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

function TextareaField({
  label,
  error,
  hint,
  required,
  id,
  className,
  children,
}: TextareaFieldProps) {
  const fieldId = id ?? React.useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const invalid = !!error;

  return (
    <div
      data-slot="textarea-field"
      data-invalid={invalid}
      className={cn('group gap-space-2 flex flex-col', className)}
    >
      {label && (
        <TextareaLabel htmlFor={fieldId} required={required}>
          {label}
        </TextareaLabel>
      )}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<React.ComponentProps<'textarea'>>, {
            id: fieldId,
            'aria-invalid': invalid || undefined,
            'aria-describedby':
              [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined,
          })
        : children}

      {error && <TextareaError id={errorId}>{error}</TextareaError>}
      {!error && hint && <TextareaHint id={hintId}>{hint}</TextareaHint>}
    </div>
  );
}

TextareaField.displayName = 'TextareaField';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { Textarea, TextareaLabel, TextareaError, TextareaHint, TextareaField };
