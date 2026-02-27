'use client';
import { cn } from '@ui/lib/utils';
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  PasswordInput,
} from '@ui/components';

export default function ResetPasswordForm({ className }: React.ComponentProps<'form'>) {
  return (
    <form className={cn('pt-6', className)}>
      <FieldGroup>
        <Field>
          <FieldLabel>Otp code</FieldLabel>
          <Input
            type="text"
            required
            placeholder="Enter your otp code"
            autoComplete="one-time-code"
          />
          <FieldError errors={[]}></FieldError>
        </Field>
        <Field>
          <FieldLabel>New Password</FieldLabel>
          <PasswordInput placeholder="Enter your new password" required />
        </Field>
        <Field>
          <FieldLabel>Confirm New Password</FieldLabel>
          <PasswordInput placeholder="Confirm your new password" required />
        </Field>
        <Field className="gap-space-3 flex flex-col items-center text-center">
          <Button type="submit" variant="default">
            Reset Password
          </Button>
        </Field>

        <Field className="gap-space-3 flex flex-col items-center text-center">
          <Button type="button" variant="ghost">
            Resend Code
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
