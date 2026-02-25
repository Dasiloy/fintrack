'use client';

import Link from 'next/link';

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
} from '@ui/components';
import { cn } from '@ui/lib/utils';

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
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" required />
        </Field>

        <Field className="mb-2">
          <Button className="mb-1" type="submit">
            Login
          </Button>
          <FieldDescription className="text-center text-sm">
            Don&apos;t have an account? <Link href="/signup">Sign up</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
