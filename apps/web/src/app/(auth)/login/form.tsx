'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

import {
  Button,
  Input,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  GoogleIcon,
  Separator,
  FieldError,
  PasswordInput,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Text,
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
import { api_client } from '@/lib/trpc_app/api_client';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email('Invalid Email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Auth error mapping
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LoginStep = 'credentials' | 'two-factor';

interface LoginFormProps extends React.ComponentProps<'form'> {
  authError?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginForm({ className, authError }: LoginFormProps) {
  const router = useRouter();

  // Credentials step state
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);

  // 2FA step state
  const [step, setStep] = useState<LoginStep>('credentials');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isBackupMode, setIsBackupMode] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // const verifyMutation = api_client.auth.twoFactor.verify.useMutation();

  useEffect(() => {
    const message = resolveAuthError(authError);
    if (message) {
      toast.error('Sign-in failed', { description: message });
      router.replace(AUTH_ROUTES.LOGIN);
    }
  }, [authError, router]);

  const isAnyLoading = form.formState.isSubmitting || loadingProvider !== null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const completeSignIn = async (accessToken: string, refreshToken: string) => {
    await signIn('credentials', {
      redirect: true,
      redirectTo: DASHBOARD_ROUTES.DASHBOARD,
      accessToken,
      refreshToken,
    });
  };

  const resetToCredentials = () => {
    setStep('credentials');
    setTwoFactorToken('');
    setOtpValue('');
    setBackupCode('');
    setIsBackupMode(false);
  };

  // ── Credentials submit ────────────────────────────────────────────────────

  const onSubmit = async (data: LoginValues) => {
    try {
      const response = await axiosClient.post('/proxy-auth/login', data);
      const resData: StandardResponse<LoginRes> | any = response.data;

      // 2FA required — switch to second step
      if (resData.data?.requiresTwoFactor) {
        setTwoFactorToken(resData.data.twoFactorToken!);
        form.reset();
        setStep('two-factor');
        return;
      }

      toast.success('Login successful', { description: 'Redirecting...' });
      await completeSignIn(resData.data!.accessToken!, resData.data!.refreshToken!);
    } catch (error: any) {
      const code = error?.response?.data?.code;

      if (code === 'EMAIL_NOT_VERIFIED') {
        toast.info('Email not verified', {
          description: 'Sending a verification code to your inbox...',
        });
        try {
          await axiosClient.post('/proxy-auth/resend-verify-email');
        } catch {
          // 409 = a valid OTP still exists — redirect anyway
          // Leave implementation for now
        }
        router.push(AUTH_ROUTES.VERIFY_EMAIL);
        return;
      }

      toast.error('Login failed', { description: ServerFormatter.formatError(error) });
    }
  };

  // ── 2FA submit ────────────────────────────────────────────────────────────

  const handleTwoFactorSubmit = async (code: string) => {
    if (!code.trim()) return;
    // try {
    //   const result = await verifyMutation.mutateAsync({ twoFactorToken, code });
    //   toast.success('Verified', { description: 'Redirecting...' });
    //   await completeSignIn(result.accessToken!, result.refreshToken!);
    // } catch (error) {
    //   toast.error('Verification failed', { description: ServerFormatter.formatError(error) });
    //   setOtpValue('');
    //   setBackupCode('');
    // }
  };

  const handleOtpComplete = (value: string) => handleTwoFactorSubmit(value);

  const handleBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTwoFactorSubmit(backupCode);
  };

  // ── Social sign-in ────────────────────────────────────────────────────────

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    if (isAnyLoading) return;
    setLoadingProvider(provider);
    try {
      await signIn(provider, { redirect: true, redirectTo: DASHBOARD_ROUTES.DASHBOARD });
      form.reset();
    } catch {
      toast.error('Sign-in failed', {
        description: 'Could not connect to the sign-in provider. Please try again.',
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  // ── 2FA screen ─────────────────────────────────────────────────────────

  if (step === 'two-factor') {
    // const isVerifying = verifyMutation.isPending;
    const isVerifying = false;

    return (
      <div className={cn('pt-6', className)}>
        <FieldGroup>
          {/* TOTP code input */}
          {!isBackupMode ? (
            <Field orientation="horizontal" className="justify-center">
              <InputOTP
                required
                maxLength={6}
                inputMode="numeric"
                pattern={REGEXP_ONLY_DIGITS}
                containerClassName="gap-space-2"
                disabled={isVerifying}
                value={otpValue}
                onChange={setOtpValue}
                onComplete={handleOtpComplete}
              >
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:font-semibold">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator className="text-text-tertiary" />
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:font-semibold">
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </Field>
          ) : (
            /* Backup code input */
            <form onSubmit={handleBackupSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="backup-code">Backup code</FieldLabel>
                  <Input
                    id="backup-code"
                    placeholder="XXXX-XXXX"
                    autoComplete="off"
                    disabled={isVerifying}
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  />
                </Field>
                <Field>
                  <Button type="submit" loading={isVerifying} disabled={!backupCode.trim()}>
                    Verify
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}

          {/* Status / feedback */}
          <Field className="flex flex-col items-center gap-2 text-center">
            {isVerifying && (
              <Text variant="body-sm" className="text-text-secondary animate-pulse">
                Verifying...
              </Text>
            )}

            {/* Toggle between TOTP and backup code */}
            <button
              type="button"
              className="text-text-tertiary hover:text-text-secondary text-sm underline-offset-4 hover:underline"
              onClick={() => {
                setIsBackupMode((v) => !v);
                setOtpValue('');
                setBackupCode('');
              }}
            >
              {isBackupMode ? 'Use authenticator app instead' : 'Use a backup code instead'}
            </button>
          </Field>

          {/* Back to login */}
          <Field>
            <button
              type="button"
              className="text-text-tertiary hover:text-text-secondary flex items-center gap-1.5 text-sm"
              onClick={resetToCredentials}
            >
              <ArrowLeft className="size-3.5" />
              Back to login
            </button>
          </Field>
        </FieldGroup>
      </div>
    );
  }

  // ── Credentials screen ─────────────────────────────────────────────────

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('pt-6', className)}>
      <FieldGroup>
        <Field>
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
