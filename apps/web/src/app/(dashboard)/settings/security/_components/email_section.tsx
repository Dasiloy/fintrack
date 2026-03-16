'use client';

import { useCallback, useState } from 'react';
import { signOut } from 'next-auth/react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  OtpInput,
  Separator,
  Text,
  toast,
} from '@ui/components';
import { PasswordInput } from '@ui/components';
import { ServerFormatter } from '@fintrack/utils/server';
import { api_client } from '@/lib/trpc_app/api_client';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_OTP_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailSection() {
  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // UI step: 'form' → fill in new email + password; 'verify' → enter inbox OTP
  const [step, setStep] = useState<'form' | 'verify'>('form');

  // Password attempt tracking (non-2FA path)
  const [pwdAttempts, setPwdAttempts] = useState(0);
  const [pwdLocked, setPwdLocked] = useState(false);

  // 2FA OTP dialog (shown when user has 2FA enabled, gates the initiate call)
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpLocked, setOtpLocked] = useState(false);

  const { data: get2faData } = api_client.auth.get2fa.useQuery();
  const has2fa = get2faData?.data?.twoFactorEnabled ?? false;

  const noPaste = useCallback((e: React.ClipboardEvent) => e.preventDefault(), []);

  const canSubmit = newEmail.trim().length > 0 && currentPassword.length > 0 && !pwdLocked;

  const promiseSignout = async () => {
    new Promise((resolve) => {
      toast.error('Session ended', {
        description: 'Too many failed attempts. Please sign in again.',
      });
      setTimeout(() => {
        signOut({ redirect: true, redirectTo: AUTH_ROUTES.LOGIN }).then(resolve);
      }, 1500);
    });
  };

  // ── Mutations ───────────────────────────────────────────────────────────────

  const initiateMutation = api_client.auth.initiateEmailChange.useMutation({
    async onError(error) {
      if (otpOpen) {
        if (error.data?.code === 'TOO_MANY_REQUESTS') {
          // Server-side rate limit hit
          setOtpLocked(true);
          await promiseSignout();
        } else if (error.data?.code === 'UNAUTHORIZED') {
          // Wrong OTP code — count the attempt
          const newAttempts = otpAttempts + 1;
          setOtpAttempts(newAttempts);
          if (newAttempts >= MAX_OTP_ATTEMPTS) {
            setOtpLocked(true);
            await promiseSignout();
          } else {
            toast.error('Invalid code', { description: ServerFormatter.formatError(error) });
          }
        } else {
          // Any other error (e.g. social-account block, bad request) — not an OTP failure,
          // so close the dialog without counting an attempt
          setOtpOpen(false);
          setOtpAttempts(0);
          toast.error('Could not send verification', {
            description: ServerFormatter.formatError(error),
          });
        }
      } else {
        // Non-2FA path: wrong password
        if (error.data?.code === 'TOO_MANY_REQUESTS') {
          setPwdLocked(true);
          await promiseSignout();
        } else if (error.data?.code === 'UNAUTHORIZED') {
          const newAttempts = pwdAttempts + 1;
          setPwdAttempts(newAttempts);
          if (newAttempts >= MAX_OTP_ATTEMPTS) {
            setPwdLocked(true);
            await promiseSignout();
          } else {
            toast.error('Incorrect password', { description: ServerFormatter.formatError(error) });
          }
        } else {
          toast.error('Could not send verification', {
            description: ServerFormatter.formatError(error),
          });
        }
      }
    },
    onSuccess() {
      setOtpOpen(false);
      setOtpAttempts(0);
      setOtpLocked(false);
      setPwdAttempts(0);
      setPwdLocked(false);
      setStep('verify');
    },
  });

  const verifyMutation = api_client.auth.verifyEmailChange.useMutation({
    async onSuccess() {
      toast.success('Email changed', {
        description: 'Your email has been updated. Please sign in again.',
      });
      await promiseSignout();
    },
    onError(error) {
      toast.error('Verification failed', { description: ServerFormatter.formatError(error) });
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (has2fa) {
      setOtpOpen(true);
    } else {
      initiateMutation.mutate({ newEmail: newEmail.trim(), currentPassword });
    }
  };

  const handleOtpComplete = (otpCode: string) => {
    initiateMutation.mutate({ newEmail: newEmail.trim(), currentPassword, otpCode });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-text-primary text-lg font-semibold">Email Address</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Update the email address associated with your account.
        </p>
      </div>

      <Separator className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Description */}
        <div className="space-y-3">
          <p className="text-text-secondary text-sm leading-relaxed">
            Your email is used for login, security alerts, and account notifications. After
            changing, you&apos;ll need to verify the new address before it takes effect.
          </p>
        </div>

        {/* Form or verify step */}
        <div className="border-border-subtle bg-bg-elevated rounded-card border p-6">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} autoComplete="off">
              {/*
               * Honeypot inputs — browsers autofill the first matching fields they find.
               * These hidden inputs absorb the fill so the real fields below stay empty.
               */}
              <input type="text" aria-hidden="true" tabIndex={-1} className="hidden" />
              <input type="password" aria-hidden="true" tabIndex={-1} className="hidden" />

              <FieldGroup>
                <Field>
                  <FieldLabel>New email address</FieldLabel>
                  <Input
                    type="text"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onPaste={noPaste}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore
                  />
                </Field>

                <Field>
                  <FieldLabel>Confirm with password</FieldLabel>
                  <PasswordInput
                    placeholder="Your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onPaste={noPaste}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore
                  />
                  <FieldDescription>
                    We verify your identity before changing your email.
                  </FieldDescription>
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

              {pwdAttempts > 0 && !pwdLocked && (
                <p className="mt-4 text-right text-xs text-amber-400">
                  Incorrect password —{' '}
                  <span className="font-medium">
                    {MAX_OTP_ATTEMPTS - pwdAttempts} attempt
                    {MAX_OTP_ATTEMPTS - pwdAttempts !== 1 ? 's' : ''} remaining
                  </span>
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit}
                  loading={initiateMutation.isPending && !has2fa}
                >
                  Update Email
                </Button>
              </div>
            </form>
          ) : (
            /* verify step — user enters OTP from their new inbox */
            <div className="flex flex-col items-center gap-6 py-2 text-center">
              <div>
                <p className="text-text-primary text-sm font-medium">Check your new inbox</p>
                <p className="text-text-secondary mt-1 text-xs">
                  We sent a 6-digit verification code to{' '}
                  <span className="text-text-primary font-medium">{newEmail}</span>. Enter it below
                  to confirm the change.
                </p>
              </div>

              <OtpInput
                onComplete={(otp) => verifyMutation.mutate({ otp })}
                disabled={verifyMutation.isPending}
              />

              {verifyMutation.isPending && (
                <Text variant="body-sm" className="text-text-secondary animate-pulse">
                  Verifying...
                </Text>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setNewEmail('');
                  setCurrentPassword('');
                  setPwdAttempts(0);
                  setPwdLocked(false);
                }}
                className="text-text-disabled hover:text-text-secondary text-xs transition-colors"
              >
                ← Change a different address
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2FA OTP dialog — only shown when user has 2FA enabled */}
      <Dialog
        open={otpOpen}
        onOpenChange={(open) => {
          if (!initiateMutation.isPending && !otpLocked) {
            setOtpOpen(open);
            if (!open) {
              setOtpAttempts(0);
              setOtpLocked(false);
            }
          }
        }}
      >
        <DialogContent
          showCloseButton={!initiateMutation.isPending && !otpLocked}
          className="max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Verify your identity</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to confirm the email change.
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
                  disabled={initiateMutation.isPending}
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
                {initiateMutation.isPending && (
                  <Text variant="body-sm" className="text-text-secondary animate-pulse">
                    Sending verification...
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
