'use client';

import { cn } from '@ui/lib/utils';
import { useRouter } from '@bprogress/next';
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
} from '@ui/components';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { AUTH_ROUTES, DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import { useCountdown, CountdownDisplay, StyledLink } from '@/app/_components';

export function VerifyEmailForm({ className }: React.ComponentProps<'form'>) {
  const router = useRouter();
  const { secondsLeft, isComplete, restart } = useCountdown();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(DASHBOARD_ROUTES.DASHBOARD);
  };

  const handleResend = () => {
    if (!isComplete) return;
    // TODO: call resend OTP API
    restart();
  };

  return (
    <form className={cn('pt-6', className)} onSubmit={handleSubmit}>
      <FieldGroup>
        <Field orientation="horizontal" className="justify-center">
          <InputOTP
            required
            maxLength={6}
            id="otp-verification"
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
            containerClassName="gap-space-2"
            onComplete={() => router.push(DASHBOARD_ROUTES.DASHBOARD)}
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
          {isComplete ? (
            <Button type="button" variant="secondary" onClick={handleResend}>
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
    </form>
  );
}
