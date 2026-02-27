'use client';

import {
  Button,
  Input,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  PasswordInput,
} from '@ui/components';
import { cn } from '@ui/lib/utils';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

import { useRouter } from '@bprogress/next';

import StyledLink from '@/app/_components/styled_linkt';

export function SignupForm({ className }: React.ComponentProps<'form'>) {
  const navigation = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigation.push(AUTH_ROUTES.VERIFY_EMAIL);
  };

  return (
    <form className={cn('pt-6', className)} onSubmit={handleSubmit}>
      <FieldGroup>
        <Field orientation={'horizontal'} className="gap-4">
          <Field>
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              required
            />
            <FieldError errors={[]}></FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              required
            />
            <FieldError errors={[]}></FieldError>
          </Field>
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            required
          />
          <FieldError errors={[]}></FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            placeholder="********"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <PasswordInput
            id="confirm-password"
            placeholder="********"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field className="mb-2">
          <Button className="mb-1" type="submit">
            Sign Up
          </Button>
          <FieldDescription className="text-center text-sm">
            Already have an account? <StyledLink href={AUTH_ROUTES.LOGIN}>Login</StyledLink>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
