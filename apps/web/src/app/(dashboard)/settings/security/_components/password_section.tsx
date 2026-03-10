'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  OtpInput,
  Separator,
  Text,
  toast,
} from '@ui/components';
import { PasswordInput } from '@ui/components';
import { ServerFormatter } from '@fintrack/utils/server';
import { api_client } from '@/lib/trpc_app/api_client';
import { signOut } from 'next-auth/react';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Strength = { label: string; barClass: string; textClass: string; fraction: number };

function getPasswordStrength(password: string): Strength {
  if (!password) return { label: '', barClass: '', textClass: '', fraction: 0 };

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (score <= 2)
    return { label: 'Weak', barClass: 'bg-red-500', textClass: 'text-red-400', fraction: 0.25 };
  if (score === 3)
    return { label: 'Fair', barClass: 'bg-amber-400', textClass: 'text-amber-400', fraction: 0.5 };
  if (score === 4)
    return { label: 'Good', barClass: 'bg-primary', textClass: 'text-primary', fraction: 0.75 };
  return { label: 'Strong', barClass: 'bg-success', textClass: 'text-success', fraction: 1 };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PasswordSection() {
  // states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpLocked, setOtpLocked] = useState(false);
  const [pwdAttempts, setPwdAttempts] = useState(0);
  const [pwdLocked, setPwdLocked] = useState(false);

  const utils = api_client.useUtils();
  const { data: get2faData } = api_client.auth.get2fa.useQuery();
  const has2fa = get2faData?.data?.twoFactorEnabled ?? false;
  // Default true so we never flash the "Set password" UI for local users on load
  const hasPassword = get2faData?.data?.hasPassword ?? true;

  const noPaste = useCallback((e: React.ClipboardEvent) => e.preventDefault(), []);
  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const canSubmit = hasPassword
    ? !!(currentPassword && newPassword && confirmPassword && !mismatch && !pwdLocked)
    : !!(newPassword && confirmPassword && !mismatch);

  const MAX_OTP_ATTEMPTS = 3;
  const promiseSignout = async () => {
    new Promise((ressolve) => {
      toast.error('Session ended', {
        description: 'Too many failed attempts. Please sign in again.',
      });
      setTimeout(() => {
        signOut({
          redirect: true,
          redirectTo: AUTH_ROUTES.LOGIN,
        }).then(ressolve);
      }, 1500);
    });
  };

  const changePwdMutation = api_client.auth.chnagePassword.useMutation({
    async onError(error) {
      if (otpOpen) {
        // Error came from the OTP dialog phase
        if (error.data?.code === 'TOO_MANY_REQUESTS') {
          setOtpLocked(true);
          await promiseSignout();
        } else {
          const newAttempts = otpAttempts + 1;
          setOtpAttempts(newAttempts);
          if (newAttempts >= MAX_OTP_ATTEMPTS) {
            setOtpLocked(true);
            await promiseSignout();
          } else {
            toast.error('Invalid code', { description: ServerFormatter.formatError(error) });
          }
        }
      } else if (hasPassword) {
        // Wrong current password path
        if (error.data?.code === 'TOO_MANY_REQUESTS') {
          setPwdLocked(true);
          await promiseSignout();
        } else {
          const newAttempts = pwdAttempts + 1;
          setPwdAttempts(newAttempts);
          if (newAttempts >= MAX_OTP_ATTEMPTS) {
            setPwdLocked(true);
            await promiseSignout();
          } else {
            toast.error('Could not update password', {
              description: ServerFormatter.formatError(error),
            });
          }
        }
      } else {
        // Create-password path — no current password to rate-limit, just show the error
        toast.error('Could not set password', { description: ServerFormatter.formatError(error) });
      }
    },
    async onSuccess(data) {
      toast.success(hasPassword ? 'Password updated' : 'Password set', {
        description: hasPassword
          ? ServerFormatter.formatSuccess(data)
          : 'You can now sign in with your email and password.',
      });
      setOtpOpen(false);
      setOtpAttempts(0);
      setOtpLocked(false);
      setPwdAttempts(0);
      setPwdLocked(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (hasPassword) {
        // Password change drops all sessions — redirect to login
        await signOut({ redirect: true, redirectTo: AUTH_ROUTES.LOGIN });
      } else {
        // Password creation keeps the current session active — just refresh the 2FA data
        await utils.auth.get2fa.invalidate();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (has2fa) {
      setOtpOpen(true);
    } else {
      changePwdMutation.mutate({
        ...(hasPassword ? { currentPassword } : {}),
        newPassword,
      });
    }
  };

  const handleOtpComplete = (otpCode: string) => {
    changePwdMutation.mutate({
      ...(hasPassword ? { currentPassword } : {}),
      newPassword,
      otpCode,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-text-primary text-lg font-semibold">
          {hasPassword ? 'Password' : 'Set Password'}
        </h2>
        <p className="text-text-secondary mt-1 text-sm">
          {hasPassword
            ? 'Update your account login password.'
            : 'Add password-based login to your account alongside your social login.'}
        </p>
      </div>

      <Separator className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Description */}
        <div className="space-y-3">
          <p className="text-text-secondary text-sm leading-relaxed">
            {hasPassword ? (
              <>
                Choose a strong, unique password you don&apos;t use anywhere else. We recommend at
                least 12 characters mixing uppercase, lowercase, numbers, and symbols.
              </>
            ) : (
              <>
                Setting a password lets you sign in with your email address in addition to your
                social account. It also unlocks two-factor authentication.
              </>
            )}
          </p>
          <div className="border-border-subtle bg-bg-surface rounded-lg border px-4 py-3">
            <p className="text-text-tertiary text-xs leading-relaxed">
              <span className="text-text-secondary font-medium">Tip:</span> Use a password manager
              like 1Password or Bitwarden to generate and store a secure password.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="border-border-subtle bg-bg-elevated rounded-card border p-6">
          <form onSubmit={handleSubmit} autoComplete="off">
            {/*
             * Honeypot inputs — browsers autofill the first matching fields they find.
             * These hidden inputs absorb the fill so the real fields below stay empty.
             */}
            <input type="text" aria-hidden="true" tabIndex={-1} className="hidden" />
            <input type="password" aria-hidden="true" tabIndex={-1} className="hidden" />

            <FieldGroup>
              {hasPassword && (
                <Field>
                  <FieldLabel>Current password</FieldLabel>
                  <PasswordInput
                    placeholder="Your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onPaste={noPaste}
                    autoComplete="password"
                    data-lpignore="true"
                    data-1p-ignore
                  />
                </Field>
              )}

              <Field>
                <FieldLabel>New password</FieldLabel>
                <PasswordInput
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onPaste={noPaste}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore
                />
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="bg-bg-surface-hover h-1 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.barClass}`}
                        style={{ width: `${strength.fraction * 100}%` }}
                      />
                    </div>
                    <p className="text-text-disabled text-[11px]">
                      Strength:{' '}
                      <span className={`font-medium ${strength.textClass}`}>{strength.label}</span>
                    </p>
                  </div>
                )}
              </Field>

              <Field data-invalid={mismatch || undefined}>
                <FieldLabel>Confirm new password</FieldLabel>
                <PasswordInput
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPaste={noPaste}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore
                />
                {mismatch && <FieldError>Passwords do not match</FieldError>}
              </Field>
            </FieldGroup>

            {pwdLocked && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-error text-sm font-medium">Too many failed attempts</p>
                <p className="text-text-secondary mt-1 text-xs">
                  Your account has been locked. Reset your password to regain access.
                </p>
              </div>
            )}

            {pwdAttempts > 0 && !pwdLocked && hasPassword && (
              <p className="mt-4 text-right text-xs text-amber-400">
                Incorrect current password —{' '}
                <span className="font-medium">
                  {MAX_OTP_ATTEMPTS - pwdAttempts} attempt
                  {MAX_OTP_ATTEMPTS - pwdAttempts !== 1 ? 's' : ''} remaining
                </span>
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!canSubmit}
                loading={changePwdMutation.isPending && !has2fa}
              >
                {hasPassword ? 'Update Password' : 'Set Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* OTP verification dialog — only shown for users with 2FA enabled */}
      <Dialog
        open={otpOpen}
        onOpenChange={(open) => {
          if (!changePwdMutation.isPending && !otpLocked) {
            setOtpOpen(open);
            if (!open) {
              setOtpAttempts(0);
              setOtpLocked(false);
            }
          }
        }}
      >
        <DialogContent
          showCloseButton={!changePwdMutation.isPending && !otpLocked}
          className="max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Verify your identity</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to confirm the password{' '}
              {hasPassword ? 'change' : 'creation'}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {otpLocked ? (
              <div className="w-full rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-4 text-center">
                <p className="text-error text-sm font-medium">Too many failed attempts</p>
                <p className="text-text-secondary mt-1 text-xs">
                  Your session has been ended for security. Please sign in again.
                </p>
              </div>
            ) : (
              <>
                <OtpInput
                  key={otpAttempts}
                  onComplete={handleOtpComplete}
                  disabled={changePwdMutation.isPending}
                />
                {otpAttempts > 0 && (
                  <p className="text-xs text-amber-400">
                    Incorrect code —{' '}
                    <span className="font-medium">
                      {MAX_OTP_ATTEMPTS - otpAttempts} attempt
                      {MAX_OTP_ATTEMPTS - otpAttempts !== 1 ? 's' : ''} remaining
                    </span>
                  </p>
                )}
                {changePwdMutation.isPending && (
                  <Text variant="body-sm" className="text-text-secondary animate-pulse">
                    {hasPassword ? 'Updating password...' : 'Setting password...'}
                  </Text>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
