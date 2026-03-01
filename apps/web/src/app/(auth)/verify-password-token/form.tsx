'use client';

import { useBoolean } from '@ui/hooks';
import { cn } from '@ui/lib/utils';
import {
  Button,
  Field,
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
import { useRouter } from 'next/navigation';
import { ServerFormatter } from '@fintrack/utils/server';
import { axiosClient } from '@/lib/axios/axios_client';
import { useCountdown, CountdownDisplay } from '@/app/_components';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

export function VerifyPasswordTokenForm({ className }: React.ComponentProps<'form'>) {
  const router = useRouter();
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useBoolean();
  const [submitting, setSubmitting] = useBoolean();
  const { secondsLeft, isComplete, restart } = useCountdown(300);

  const handleSubmit = async (otp: string) => {
    try {
      setSubmitting.on();
      await axiosClient.post('/proxy-auth/verify-password-token', { otp });

      toast.success('Otp verified', {
        description: 'Redirecting to reset password...',
      });

      router.push(AUTH_ROUTES.RESET_PASSWORD);
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
      const response = await axiosClient.post('/proxy-auth/resend-forgot-password-token');
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
            <Text variant="body-sm" color="secondary" className="text-text-secondary animate-pulse">
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
        </Field>
      </FieldGroup>
    </div>
  );
}
