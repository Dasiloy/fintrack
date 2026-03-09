'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Separator,
  toast,
} from '@ui/components';
import { PasswordInput } from '@ui/components';

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

  if (score <= 2) return { label: 'Weak', barClass: 'bg-red-500', textClass: 'text-red-400', fraction: 0.25 };
  if (score === 3) return { label: 'Fair', barClass: 'bg-amber-400', textClass: 'text-amber-400', fraction: 0.5 };
  if (score === 4) return { label: 'Good', barClass: 'bg-primary', textClass: 'text-primary', fraction: 0.75 };
  return { label: 'Strong', barClass: 'bg-success', textClass: 'text-success', fraction: 1 };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const noPaste = useCallback((e: React.ClipboardEvent) => e.preventDefault(), []);
  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = !!(currentPassword && newPassword && confirmPassword && !mismatch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up trpc mutation → packages/trpc_app/src/routers/auth.ts → changePassword
    toast.info('Coming soon', { description: 'Password change will be available soon.' });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-text-primary text-lg font-semibold">Password</h2>
        <p className="text-text-secondary mt-1 text-sm">Update your account login password.</p>
      </div>

      <Separator className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Description */}
        <div className="space-y-3">
          <p className="text-text-secondary text-sm leading-relaxed">
            Choose a strong, unique password you don&apos;t use anywhere else. We recommend at
            least 12 characters mixing uppercase, lowercase, numbers, and symbols.
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
              <Field>
                <FieldLabel>Current password</FieldLabel>
                <PasswordInput
                  placeholder="Your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onPaste={noPaste}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore
                />
              </Field>

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

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="sm" disabled={!canSubmit}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
