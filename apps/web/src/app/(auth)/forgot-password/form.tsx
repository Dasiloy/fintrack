'use client';

import { cn } from '@ui/lib/utils';

import { Button, Field, FieldError, FieldGroup, FieldLabel, Input } from '@ui/components';

import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { StyledLink } from '@/app/_components';
import { useRouter } from '@bprogress/next';

export default function ForgotPasswordForm({ className }: React.ComponentProps<'form'>) {
  const router = useRouter();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(AUTH_ROUTES.RESET_PASSWORD);
  };

  return (
    <form className={cn('pt-6', className)} onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" placeholder="Enter your email" required />
          <FieldError errors={[]}></FieldError>
        </Field>

        <Field className="my-space-2">
          <Button type="submit" variant="default">
            Send Code
          </Button>
          <div className="flex justify-center">
            <StyledLink
              className="mt-space-2 text-text-tertiary self-center text-sm"
              href={AUTH_ROUTES.LOGIN}
            >
              Back to Login
            </StyledLink>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}
