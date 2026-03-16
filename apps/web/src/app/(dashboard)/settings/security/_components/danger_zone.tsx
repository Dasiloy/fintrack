'use client';

import { useState } from 'react';
import { Loader2, Trash2, TriangleAlert } from 'lucide-react';
import { signOut } from 'next-auth/react';

import {
  toast,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Field,
  FieldGroup,
  Label,
  OtpInput,
  PasswordInput,
} from '@ui/components';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { api_client } from '@/lib/trpc_app/api_client';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DangerZone() {
  const { data: tfaData } = api_client.auth.get2fa.useQuery();
  const hasPassword = tfaData?.data?.hasPassword ?? false;
  const twoFactorEnabled = tfaData?.data?.twoFactorEnabled ?? false;

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const { mutate: deleteAccount, isPending } = api_client.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success('Your account has been scheduled for deletion. Signing you out…');
      void signOut({ redirect: true, redirectTo: AUTH_ROUTES.LOGIN });
    },
    onError: (err) => {
      const msg = err.message?.toLowerCase() ?? '';
      if (msg.includes('resource_exhausted') || msg.includes('too many')) {
        toast.error('Too many failed attempts. Please reset your password to regain access.');
      } else if (msg.includes('unauthenticated') || msg.includes('invalid')) {
        toast.error('Invalid password or authentication code.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    },
  });

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setPassword('');
      setOtpCode('');
    }
  };

  const handleConfirm = () => {
    deleteAccount({
      password: hasPassword ? password : undefined,
      otpCode: twoFactorEnabled ? otpCode : undefined,
    });
  };

  const canSubmit =
    (!hasPassword || password.length > 0) && (!twoFactorEnabled || otpCode.length === 6);

  return (
    <div className="rounded-card border border-red-500/20 bg-red-500/2 p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Icon */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
          <TriangleAlert className="size-5 text-red-400" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-text-primary mb-1 text-sm font-semibold tracking-wider uppercase">
            Danger Zone
          </h3>
          <p className="text-text-secondary mb-5 text-sm leading-relaxed">
            Permanently deletes your account, all financial records, and revokes every active
            session. This action <strong className="text-text-primary">cannot be undone</strong>.
          </p>

          <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-3.5" />
                Delete Account
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-red-500/10">
                  <TriangleAlert className="size-7 text-red-400" />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your account will be scheduled for deletion. You will be signed out immediately.
                  All data is permanently removed after 30 days.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Verification inputs */}
              {(hasPassword || twoFactorEnabled) && (
                <FieldGroup>
                  {hasPassword && (
                    <Field>
                      <Label>Confirm your password</Label>
                      <PasswordInput
                        placeholder="Current password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={isPending}
                      />
                    </Field>
                  )}
                  {twoFactorEnabled && (
                    <Field>
                      <Label>Authenticator code</Label>
                      <OtpInput value={otpCode} onChange={setOtpCode} disabled={isPending} />
                    </Field>
                  )}
                </FieldGroup>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={isPending || !canSubmit}
                  onClick={handleConfirm}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    'Yes, delete my account'
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
