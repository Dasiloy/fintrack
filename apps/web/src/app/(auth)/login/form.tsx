'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';

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
  toast,
} from '@ui/components';
import { cn } from '@ui/lib/utils';
import StyledLink from '@/app/_components/styled_linkt';
import { axiosClient } from '@/lib/axios/axios_client';
import { ServerFormatter } from '@fintrack/utils/server';
import { AUTH_ROUTES, DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { LoginRes } from '@fintrack/types/protos/auth/auth';

const loginschema = z.object({
  email: z.string().email('Invalid Email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginschema>;

export function LoginForm({ className }: React.ComponentProps<'form'>) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginschema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginValues) => {
    try {
      const response = await axiosClient.post('/proxy-auth/login', data);
      const resData: StandardResponse<LoginRes> = response.data;

      toast.success('Login successful', { description: 'Redirecting...' });

      await signIn('credentials', {
        redirect: true,
        redirectTo: DASHBOARD_ROUTES.DASHBOARD,
        flow: 'post-login',
        accessToken: resData.data?.accessToken,
        refreshToken: resData.data?.refreshToken,
      });
    } catch (error) {
      toast.error('Login failed', {
        description: ServerFormatter.formatError(error),
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('pt-6', className)}>
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
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">
            Password
            <StyledLink href={AUTH_ROUTES.FORGOT_PASSWORD} className="ml-auto">
              Forgot password?
            </StyledLink>
          </FieldLabel>
          <PasswordInput
            id="password"
            placeholder="******************"
            aria-invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Field className="mb-2">
          <Button
            className="mb-1"
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={form.formState.isSubmitting}
          >
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
