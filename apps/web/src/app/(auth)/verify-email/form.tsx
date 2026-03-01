'use client';

import { useBoolean } from '@ui/hooks';
import { cn } from '@ui/lib/utils';
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Text,
  toast,
} from '@ui/components';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useState } from 'react';
import { ServerFormatter } from '@fintrack/utils/server';
import { axiosClient } from '@/lib/axios/axios_client';
import { useCountdown, CountdownDisplay, StyledLink } from '@/app/_components';
import { AUTH_ROUTES, DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { VerifyEmailRes } from '@fintrack/types/protos/auth/auth';
import { signIn } from 'next-auth/react';

export function VerifyEmailForm({ className }: React.ComponentProps<'form'>) {
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useBoolean();
  const [submitting, setSubmitting] = useBoolean();
  const { secondsLeft, isComplete, restart } = useCountdown(300);

  const handleSubmit = async (otp: string) => {
    try {
      setSubmitting.on();

      const response = await axiosClient.post('/proxy-auth/verify-email', { otp });

      const data: StandardResponse<VerifyEmailRes> = response.data;

      toast.success(ServerFormatter.formatSuccess(response), {
        description: 'Redirecting to dashboard...',
      });

      await signIn('credentials', {
        // next auth options
        redirect: true,
        redirectTo: DASHBOARD_ROUTES.DASHBOARD,

        // custom options
        flow: 'post-verify',
        accessToken: data.data?.accessToken,
        refreshToken: data.data?.refreshToken,
      });
    } catch (error) {
      console.error(error);
      toast.error('An error occured', {
        description: ServerFormatter.formatError(error),
      });
    } finally {
      setSubmitting.off();
      setOtpValue('');
    }
  };

  const handleResend = async () => {
    try {
      setLoading.on();
      const response = await axiosClient.post('/proxy-auth/resend-verify-email');
      restart();
      setOtpValue('');

      toast.success('Otp sent', {
        description: ServerFormatter.formatSuccess(response),
      });
    } catch (error) {
      console.error(error);
      toast.error('An error occured', {
        description: ServerFormatter.formatError(error),
      });
    } finally {
      setLoading.off();
    }
  };

  return (
    <div className={cn('pt-6', className)}>
      <FieldGroup>
        <Field orientation="horizontal" className="justify-center">
          <InputOTP
            required
            maxLength={6}
            id="otp-verification"
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
            containerClassName="gap-space-2"
            disabled={submitting || loading}
            value={otpValue}
            onChange={setOtpValue}
            onComplete={handleSubmit}
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

        <Field className="gap-space-3 flex flex-col items-center text-center">
          <Text variant="body-sm" color="secondary" className="text-text-secondary">
            Didn&apos;t get OTP code?
          </Text>
          {submitting && (
            <Text variant="body-sm" color="secondary" className="animate-pulse text-text-secondary">
              Verifying...
            </Text>
          )}
          {isComplete ? (
            <Button
              type="button"
              variant="secondary"
              disabled={!isComplete || loading || submitting}
              loading={loading}
              onClick={handleResend}
            >
              Resend code
            </Button>
          ) : (
            <Text variant="body-sm" color="secondary" className="text-text-tertiary">
              Resend in{' '}
              <CountdownDisplay
                value={secondsLeft}
                className="text-text-secondary font-medium tabular-nums"
              />
            </Text>
          )}

          <FieldDescription className="mb-space-2 mt-space-8! flex items-center justify-center gap-2 self-center text-sm">
            Wrong email?
            <StyledLink href={AUTH_ROUTES.SIGNUP}>Back to Signup</StyledLink>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  );
}
