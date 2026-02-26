'use client';

import {
  Button,
  Input,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  AppleIcon,
  GoogleIcon,
  Separator,
  FieldError,
  PasswordInput,
} from '@ui/components';
import { cn } from '@ui/lib/utils';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

import StyledLink from '@/app/_components/styled_linkt';

export function LoginForm({ className }: React.ComponentProps<'div'>) {
  return (
    <form className={cn('pt-6', className)}>
      <FieldGroup>
        {/** SOCIALS */}
        <Field>
          <Button variant="secondary" type="button">
            <AppleIcon fill="currentColor" />
            Login with Apple
          </Button>
          <Button variant="secondary" type="button">
            <GoogleIcon fill="currentColor" />
            Login with Google
          </Button>
        </Field>

        <div className="text-text-tertiary flex items-center gap-2 text-sm">
          <Separator className="flex-1" />
          Or continue with
          <Separator className="flex-1" />
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
          <FieldError errors={[]}></FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">
            Password
            <StyledLink href={AUTH_ROUTES.FORGOT_PASSWORD} className="ml-auto">
              Forgot password?
            </StyledLink>
          </FieldLabel>
          <PasswordInput id="password" />
          <FieldError errors={[]}></FieldError>
        </Field>

        <Field className="mb-2">
          <Button className="mb-1" type="submit">
            Login
          </Button>
          <FieldDescription className="text-center text-sm">
            Don&apos;t have an account? <StyledLink href={AUTH_ROUTES.SIGNUP}>Sign up</StyledLink>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
