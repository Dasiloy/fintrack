'use client';

import { useEffect, useState } from 'react';
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
import { useRouter } from 'next/navigation';

const loginschema = z.object({
  email: z.string().email('Invalid Email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginschema>;

/** Maps NextAuth error codes to human-readable messages. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignInError: 'Failed to sign in. Please try again.',
  OAuthCallbackError: 'Sign-in was interrupted. Please try again.',
  AccessDenied: 'Access was denied. Please check your account and try again.',
  CredentialsSignin: 'Invalid email or password.',
  Configuration: 'Authentication is misconfigured. Please contact support.',
  Default: 'An error occurred during sign-in. Please try again.',
};

function resolveAuthError(code: string | undefined): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default!;
}

interface LoginFormProps extends React.ComponentProps<'form'> {
  authError?: string;
}

export function LoginForm({ className, authError }: LoginFormProps) {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginschema),
    defaultValues: { email: '', password: '' },
  });

  // Show a toast and strip ?error= from the URL so a refresh doesn't re-trigger it
  useEffect(() => {
    const message = resolveAuthError(authError);
    if (message) {
      toast.error('Sign-in failed', { description: message });
      router.replace(AUTH_ROUTES.LOGIN);
    }
  }, [authError, router]);

  // True whenever any sign-in is in flight — used to lock all three buttons
  const isAnyLoading = form.formState.isSubmitting || loadingProvider !== null;

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    if (isAnyLoading) return;
    setLoadingProvider(provider);
    try {
      await signIn(provider, {
        redirect: true,
        redirectTo: DASHBOARD_ROUTES.DASHBOARD,
      });
      form.reset();
    } catch {
      toast.error('Sign-in failed', {
        description: 'Could not connect to the sign-in provider. Please try again.',
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const onSubmit = async (data: LoginValues) => {
    try {
      const response = await axiosClient.post('/proxy-auth/login', data);
      form.reset();
      const resData: StandardResponse<LoginRes> = response.data;

      toast.success('Login successful', { description: 'Redirecting...' });

      await signIn('credentials', {
        redirect: true,
        redirectTo: DASHBOARD_ROUTES.DASHBOARD,
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
        {/* Social sign-in — mutually exclusive; all disabled while any is loading */}
        <Field>
          <Button
            variant="secondary"
            type="button"
            loading={loadingProvider === 'apple'}
            disabled={isAnyLoading && loadingProvider !== 'apple'}
            onClick={() => handleSocialSignIn('apple')}
          >
            <AppleIcon fill="currentColor" />
            Login with Apple
          </Button>

          <Button
            variant="secondary"
            type="button"
            loading={loadingProvider === 'google'}
            disabled={isAnyLoading && loadingProvider !== 'google'}
            onClick={() => handleSocialSignIn('google')}
          >
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
            disabled={isAnyLoading}
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
            disabled={isAnyLoading}
            {...form.register('password')}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Field className="mb-2">
          <Button
            className="mb-1"
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={isAnyLoading && !form.formState.isSubmitting}
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
