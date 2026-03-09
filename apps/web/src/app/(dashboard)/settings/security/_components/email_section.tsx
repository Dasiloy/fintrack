'use client';

import { useCallback, useState } from 'react';

import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Separator,
  toast,
} from '@ui/components';
import { PasswordInput } from '@ui/components';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmailSection() {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  const noPaste = useCallback((e: React.ClipboardEvent) => e.preventDefault(), []);

  const canSubmit = newEmail.trim().length > 0 && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up trpc mutation → packages/trpc_app/src/routers/auth.ts → changeEmail
    toast.info('Coming soon', { description: 'Email change will be available soon.' });
  };

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="mt-6 flex justify-end">
              <Button type="submit" size="sm" disabled={!canSubmit}>
                Update Email
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
