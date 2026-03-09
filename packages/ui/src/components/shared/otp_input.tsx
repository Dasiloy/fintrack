import { REGEXP_ONLY_DIGITS } from 'input-otp';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  type InputOTPProps,
} from '@ui/components/atoms';

export const OtpInput = ({
  required = true,
  id = 'otp-verification',
  inputMode = 'numeric',
  ...props
}: Omit<InputOTPProps, 'render' | 'maxLength'>) => {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      required={required}
      inputMode={inputMode}
      pattern={REGEXP_ONLY_DIGITS}
      containerClassName="gap-space-2"
      {...props}
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
  );
};
