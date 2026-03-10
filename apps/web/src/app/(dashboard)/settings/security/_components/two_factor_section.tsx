'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Check, Copy, Download, ShieldCheck, ShieldOff } from 'lucide-react';

import { Button, Field, FieldGroup, OtpInput, Separator, Text, toast } from '@ui/components';
import { ServerFormatter } from '@fintrack/utils/server';
import { api_client } from '@/lib/trpc_app/api_client';
import { signOut } from 'next-auth/react';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_OTP_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TwoFactorState =
  | 'disabled'
  | 'setup-scan'
  | 'setup-confirm'
  | 'setup-backup-codes'
  | 'enabled'
  | 'disabling'
  | 'regenerating'
  | 'new-backup-codes';

// ---------------------------------------------------------------------------
// Left visual panel — animated shield that reacts to state
// ---------------------------------------------------------------------------

function TwoFactorVisual({ state }: { state: TwoFactorState }) {
  const isEnabled = state === 'enabled';
  const isSetup = state.startsWith('setup') || state === 'setup-scan' || state === 'setup-confirm';
  const isDisabling = state === 'disabling';
  const isRegenerating = state === 'regenerating' || state === 'new-backup-codes';

  const STEPS = [
    { id: 'setup-scan', label: 'Scan QR code' },
    { id: 'setup-confirm', label: 'Verify code' },
    { id: 'setup-backup-codes', label: 'Save backup codes' },
  ] as const;

  return (
    <div className="flex flex-col items-center justify-start gap-6 pt-2">
      {/* Shield visual — size-28 matches the outer ring so rings don't clip */}
      <div className="relative mx-auto flex size-28 items-center justify-center">
        {/* Outer ring — animated */}
        <div
          className={`absolute size-28 rounded-full transition-all duration-700 ${
            isEnabled
              ? 'bg-success/10 animate-pulse'
              : isSetup
                ? 'bg-primary/10 animate-pulse'
                : isRegenerating
                  ? 'animate-pulse bg-amber-500/10'
                  : 'bg-bg-surface-hover'
          }`}
        />
        {/* Middle ring */}
        <div
          className={`absolute size-20 rounded-full border transition-all duration-700 ${
            isEnabled
              ? 'border-success/30'
              : isSetup
                ? 'border-primary/30'
                : isRegenerating
                  ? 'border-amber-500/30'
                  : 'border-border-subtle'
          }`}
        />
        {/* Icon container */}
        <div
          className={`relative z-10 flex size-14 items-center justify-center rounded-2xl border transition-all duration-700 ${
            isEnabled
              ? 'border-success/30 bg-success/10 shadow-[0_0_24px_rgba(34,197,94,0.2)]'
              : isDisabling
                ? 'border-red-500/30 bg-red-500/10'
                : isRegenerating
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : isSetup
                    ? 'border-primary/30 bg-primary/10'
                    : 'border-border-subtle bg-bg-surface'
          }`}
        >
          {isEnabled ? (
            <ShieldCheck className="text-success size-6" />
          ) : isDisabling ? (
            <ShieldOff className="size-6 text-red-400" />
          ) : isRegenerating ? (
            <ShieldCheck className="size-6 text-amber-400" />
          ) : (
            <ShieldCheck
              className={`size-6 transition-colors duration-500 ${isSetup ? 'text-primary' : 'text-text-disabled'}`}
            />
          )}
        </div>
      </div>

      {/* Status label */}
      <div className="text-center">
        <p
          className={`text-sm font-semibold transition-colors duration-500 ${isEnabled ? 'text-success' : isDisabling ? 'text-red-400' : isRegenerating ? 'text-amber-400' : isSetup ? 'text-primary' : 'text-text-secondary'}`}
        >
          {isEnabled
            ? 'Account Protected'
            : isDisabling
              ? 'Removing protection'
              : isRegenerating
                ? 'Regenerating codes'
                : isSetup
                  ? 'Setting up 2FA'
                  : 'Not Protected'}
        </p>
        <p className="text-text-disabled mt-0.5 text-xs">
          {isEnabled
            ? 'Two-factor authentication is active'
            : isRegenerating
              ? 'Replacing your backup codes'
              : isSetup
                ? '3-step setup process'
                : 'Your account uses only a password'}
        </p>
      </div>

      {/* Setup step indicator */}
      {(isSetup || state === 'setup-backup-codes') && (
        <div className="w-full space-y-2">
          {STEPS.map((step, i) => {
            const stepIndex = STEPS.findIndex((s) => s.id === state);
            const isDone = i < stepIndex || state === 'setup-backup-codes';
            const isCurrent = step.id === state;

            return (
              <div key={step.id} className="flex items-center gap-2.5">
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                    isDone
                      ? 'bg-success text-white'
                      : isCurrent
                        ? 'bg-primary text-white'
                        : 'bg-bg-surface-hover text-text-disabled border-border-subtle border'
                  }`}
                >
                  {isDone ? <Check className="size-3" /> : i + 1}
                </div>
                <span
                  className={`text-xs transition-colors duration-300 ${
                    isCurrent
                      ? 'text-text-primary font-medium'
                      : isDone
                        ? 'text-text-tertiary line-through'
                        : 'text-text-disabled'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Info blurb — only on disabled state */}
      {state === 'disabled' && (
        <div className="border-border-subtle bg-bg-surface rounded-lg border px-4 py-3">
          <p className="text-text-tertiary text-xs leading-relaxed">
            2FA adds a second verification step at login. Even if your password is stolen, your
            account stays safe.
          </p>
        </div>
      )}

      {/* Enabled — backup codes info */}
      {state === 'enabled' && (
        <div className="border-success/15 bg-success/5 rounded-lg border px-4 py-3">
          <p className="text-text-tertiary text-xs leading-relaxed">
            Keep your backup codes in a safe place. They let you access your account if you lose
            your authenticator device.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper — fills full width, content constrained via grid
// ---------------------------------------------------------------------------

function TwoFactorShell({ children, state }: { children: React.ReactNode; state: TwoFactorState }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-text-primary text-lg font-semibold">Two-Factor Authentication</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Require a verification code in addition to your password.
        </p>
      </div>

      <Separator className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <TwoFactorVisual state={state} />

        <div className="border-border-subtle bg-bg-elevated rounded-card border p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

function DisabledState({ onEnable, isLoading }: { isLoading: boolean; onEnable: () => void }) {
  return (
    <TwoFactorShell state="disabled">
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <span className="bg-bg-surface text-text-tertiary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
            <span className="bg-text-disabled size-1.5 rounded-full" />
            Disabled
          </span>
          <p className="text-text-secondary mt-4 text-sm leading-relaxed">
            Protect your account with an authenticator app. You&apos;ll be asked for a 6-digit code
            each time you sign in.
          </p>
        </div>
        <Button size="sm" onClick={onEnable} loading={isLoading} className="w-fit">
          Enable 2FA
        </Button>
      </div>
    </TwoFactorShell>
  );
}

function SetupScanStep({
  secret,
  otpauthUri,
  onNext,
  onCancel,
}: {
  secret: string;
  otpauthUri: string;
  onNext: () => void;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TwoFactorShell state="setup-scan">
      <p className="text-text-secondary mb-5 text-sm">
        Open your authenticator app and scan the QR code below. Works with Google Authenticator,
        Authy, 1Password, and Bitwarden.
      </p>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 self-start rounded-xl bg-white p-3 shadow-sm">
          <QRCode value={otpauthUri} size={148} />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-text-secondary mb-1.5 text-xs font-medium">
              Can&apos;t scan? Enter this key manually:
            </p>
            <div className="border-border-subtle bg-bg-surface flex items-center gap-2 rounded-lg border px-3 py-2">
              <code className="text-text-primary min-w-0 flex-1 font-mono text-xs tracking-widest break-all">
                {secret.match(/.{1,4}/g)?.join(' ')}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="text-text-tertiary hover:text-text-secondary shrink-0 transition-colors"
                aria-label="Copy secret"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-text-disabled text-[11px] leading-relaxed">
            Your app will show a 6-digit code that refreshes every 30 seconds.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onNext}>
          Next — Enter code
        </Button>
      </div>
    </TwoFactorShell>
  );
}

function SetupConfirmStep({
  onConfirm,
  onBack,
  isLoading,
}: {
  onConfirm: (code: string) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [otp, setOtp] = useState('');

  return (
    <TwoFactorShell state="setup-confirm">
      <p className="text-text-secondary mb-6 text-sm">
        Enter the 6-digit code from your authenticator app to verify it&apos;s working correctly.
      </p>

      <FieldGroup>
        <Field orientation="horizontal" className="justify-center">
          <OtpInput disabled={isLoading} value={otp} onChange={setOtp} onComplete={onConfirm} />
        </Field>
        {isLoading && (
          <Text variant="body-sm" className="text-text-secondary animate-pulse text-center">
            Verifying...
          </Text>
        )}
      </FieldGroup>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="text-text-disabled hover:text-text-secondary text-xs transition-colors disabled:pointer-events-none"
        >
          ← Back to QR code
        </button>
      </div>
    </TwoFactorShell>
  );
}

function BackupCodesStep({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [allCopied, setAllCopied] = useState(false);

  const copyAll = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
    toast.success('Copied', { description: 'All backup codes copied to clipboard.' });
  };

  const download = () => {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fintrack-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TwoFactorShell state="setup-backup-codes">
      <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs font-medium text-amber-400">
          Save these backup codes now — they won&apos;t be shown again.
        </p>
        <p className="text-text-tertiary mt-1 text-xs">
          Each code can be used once to access your account if you lose your authenticator.
        </p>
      </div>

      <div className="bg-bg-surface border-border-subtle mb-5 grid grid-cols-2 gap-2 rounded-lg border p-4">
        {codes.map((code) => (
          <code key={code} className="text-text-primary font-mono text-sm tracking-widest">
            {code}
          </code>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={copyAll}>
          {allCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {allCopied ? 'Copied' : 'Copy all'}
        </Button>
        <Button variant="secondary" size="sm" onClick={download}>
          <Download className="size-3.5" />
          Download
        </Button>
        <Button size="sm" className="ml-auto" onClick={onDone}>
          Done — I&apos;ve saved these
        </Button>
      </div>
    </TwoFactorShell>
  );
}

function EnabledState({
  backupCodesRemaining,
  onDisable,
  onRegenerate,
}: {
  backupCodesRemaining: number;
  onDisable: () => void;
  onRegenerate: () => void;
}) {
  return (
    <TwoFactorShell state="enabled">
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="space-y-4">
          <span className="bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
            <span className="bg-success size-1.5 rounded-full" />
            Active
          </span>

          <p className="text-text-secondary text-sm leading-relaxed">
            Your account is protected with two-factor authentication. Each sign-in requires a code
            from your authenticator app.
          </p>

          {backupCodesRemaining <= 2 && backupCodesRemaining > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-xs text-amber-400">
                Only {backupCodesRemaining} backup code
                {backupCodesRemaining !== 1 ? 's' : ''} remaining. Consider regenerating them.
              </p>
            </div>
          )}

          {backupCodesRemaining === 0 && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-error text-xs">
                No backup codes remaining. Regenerate them to ensure account recovery access.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {backupCodesRemaining <= 2 && (
            <Button variant="secondary" size="sm" onClick={onRegenerate} className="w-fit">
              Regenerate backup codes
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={onDisable} className="w-fit">
            <ShieldOff className="size-3.5" />
            Disable 2FA
          </Button>
        </div>
      </div>
    </TwoFactorShell>
  );
}

function DisablingState({
  onConfirm,
  onCancel,
  isLoading,
  failedAttempts,
  isLocked,
}: {
  onConfirm: (code: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  failedAttempts: number;
  isLocked: boolean;
}) {
  const [otp, setOtp] = useState('');
  const attemptsLeft = MAX_OTP_ATTEMPTS - failedAttempts;

  // Reset the input after each failed attempt so the user can re-enter a new code
  useEffect(() => {
    if (failedAttempts > 0) setOtp('');
  }, [failedAttempts]);

  return (
    <TwoFactorShell state="disabling">
      <p className="text-text-secondary mb-2 text-sm">
        Enter your current authenticator code to confirm you want to disable 2FA.
      </p>
      <p className="text-text-tertiary mb-6 text-xs">
        This will remove 2FA protection and delete all backup codes.
      </p>

      {isLocked ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-4">
          <p className="text-error text-sm font-medium">Too many failed attempts</p>
          <p className="text-text-secondary mt-1 text-xs">
            Your session has been ended for security. Please sign in again to continue.
          </p>
        </div>
      ) : (
        <>
          <FieldGroup>
            <Field orientation="horizontal" className="justify-center">
              <OtpInput
                key={failedAttempts}
                disabled={isLoading}
                value={otp}
                onChange={setOtp}
                onComplete={onConfirm}
              />
            </Field>
            {failedAttempts > 0 && (
              <p className="text-center text-xs text-amber-400">
                Incorrect code —{' '}
                <span className="font-medium">
                  {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                </span>
              </p>
            )}
            {isLoading && (
              <Text variant="body-sm" className="text-text-secondary animate-pulse text-center">
                Disabling 2FA...
              </Text>
            )}
          </FieldGroup>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-text-disabled hover:text-text-secondary text-xs transition-colors disabled:pointer-events-none"
            >
              ← Cancel and keep 2FA enabled
            </button>
          </div>
        </>
      )}
    </TwoFactorShell>
  );
}

function RegeneratingState({
  onConfirm,
  onCancel,
  isLoading,
  failedAttempts,
  isLocked,
}: {
  onConfirm: (code: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  failedAttempts: number;
  isLocked: boolean;
}) {
  const [otp, setOtp] = useState('');
  const attemptsLeft = MAX_OTP_ATTEMPTS - failedAttempts;

  useEffect(() => {
    if (failedAttempts > 0) setOtp('');
  }, [failedAttempts]);

  return (
    <TwoFactorShell state="regenerating">
      <p className="text-text-secondary mb-2 text-sm">
        Enter your current authenticator code to regenerate your backup codes.
      </p>
      <p className="text-text-tertiary mb-6 text-xs">
        All existing backup codes will be replaced with 10 new ones.
      </p>

      {isLocked ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-4">
          <p className="text-error text-sm font-medium">Too many failed attempts</p>
          <p className="text-text-secondary mt-1 text-xs">
            Your session has been ended for security. Please sign in again to continue.
          </p>
        </div>
      ) : (
        <>
          <FieldGroup>
            <Field orientation="horizontal" className="justify-center">
              <OtpInput
                key={failedAttempts}
                disabled={isLoading}
                value={otp}
                onChange={setOtp}
                onComplete={onConfirm}
              />
            </Field>
            {failedAttempts > 0 && (
              <p className="text-center text-xs text-amber-400">
                Incorrect code —{' '}
                <span className="font-medium">
                  {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                </span>
              </p>
            )}
            {isLoading && (
              <Text variant="body-sm" className="text-text-secondary animate-pulse text-center">
                Regenerating codes...
              </Text>
            )}
          </FieldGroup>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-text-disabled hover:text-text-secondary text-xs transition-colors disabled:pointer-events-none"
            >
              ← Cancel
            </button>
          </div>
        </>
      )}
    </TwoFactorShell>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function TwoFactorSection() {
  const utils = api_client.useUtils();
  const { data } = api_client.auth.get2fa.useQuery();

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [uiState, setUiState] = useState<TwoFactorState>(
    data?.data?.twoFactorEnabled ? 'enabled' : 'disabled',
  );
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [disableAttempts, setDisableAttempts] = useState(0);
  const [disableLocked, setDisableLocked] = useState(false);
  const [regenAttempts, setRegenAttempts] = useState(0);
  const [regenLocked, setRegenLocked] = useState(false);

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

  const initiateMutation = api_client.auth.init2fa.useMutation({
    onError(error) {
      toast.error('Could not start 2FA setup', { description: ServerFormatter.formatError(error) });
    },
    onSuccess(data) {
      toast.success('Success', { description: ServerFormatter.formatSuccess(data) });
      setSetupData(data.data);
      setUiState('setup-scan');
    },
  });

  const confirmMuatation = api_client.auth.confirm2fa.useMutation({
    onError(error) {
      toast.error('Could not confirm 2FA setup', {
        description: ServerFormatter.formatError(error),
      });
    },
    onSuccess(data) {
      toast.success('Success', { description: ServerFormatter.formatSuccess(data) });
      setBackupCodes(data.data?.backupCodes ?? []);
      setUiState('setup-backup-codes');
    },
  });

  const disableMutation = api_client.auth.disable2fa.useMutation({
    async onError(error) {
      if (error.data?.code === 'TOO_MANY_REQUESTS') {
        setDisableLocked(true);
        await promiseSignout();
      } else {
        const newAttempts = disableAttempts + 1;
        setDisableAttempts(newAttempts);
        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          setDisableLocked(true);
          await promiseSignout();
        } else {
          toast.error('Could not disable 2FA', { description: ServerFormatter.formatError(error) });
        }
      }
    },
    onSuccess() {
      setUiState('disabled');
      setDisableAttempts(0);
      setDisableLocked(false);
      utils.auth.get2fa.invalidate();
      toast.success('2FA disabled', { description: '2FA has been removed from your account.' });
    },
  });

  const regenMutation = api_client.auth.regenerateBackupCodes.useMutation({
    async onError(error) {
      if (error.data?.code === 'TOO_MANY_REQUESTS') {
        setRegenLocked(true);
        await promiseSignout();
      } else {
        const newAttempts = regenAttempts + 1;
        setRegenAttempts(newAttempts);
        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          setRegenLocked(true);
          await promiseSignout();
        } else {
          toast.error('Invalid code', { description: ServerFormatter.formatError(error) });
        }
      }
    },
    onSuccess(data) {
      setBackupCodes(data.data?.backupCodes ?? []);
      setRegenAttempts(0);
      setRegenLocked(false);
      setUiState('new-backup-codes');
    },
  });

  const handleBackupCodesDone = () => {
    utils.auth.get2fa.invalidate();
    setBackupCodes([]);
    setSetupData(null);
    setUiState('enabled');
    toast.success('2FA enabled', { description: 'Your account is now protected with 2FA.' });
  };

  if (uiState === 'disabled')
    return (
      <DisabledState
        isLoading={initiateMutation.isPending}
        onEnable={() => initiateMutation.mutate()}
      />
    );
  if (uiState === 'setup-scan' && setupData)
    return (
      <SetupScanStep
        secret={setupData.secret}
        otpauthUri={setupData.otpauthUri}
        onNext={() => setUiState('setup-confirm')}
        onCancel={() => setUiState('disabled')}
      />
    );
  if (uiState === 'setup-confirm')
    return (
      <SetupConfirmStep
        onConfirm={(code) => confirmMuatation.mutate({ code })}
        onBack={() => setUiState('setup-scan')}
        isLoading={confirmMuatation.isPending}
      />
    );
  if (uiState === 'setup-backup-codes')
    return <BackupCodesStep codes={backupCodes} onDone={handleBackupCodesDone} />;
  if (uiState === 'enabled')
    return (
      <EnabledState
        backupCodesRemaining={data?.data?.codeLeft ?? 0}
        onDisable={() => setUiState('disabling')}
        onRegenerate={() => setUiState('regenerating')}
      />
    );
  if (uiState === 'disabling')
    return (
      <DisablingState
        onConfirm={(code) => disableMutation.mutate({ code })}
        onCancel={() => {
          setDisableAttempts(0);
          setDisableLocked(false);
          setUiState('enabled');
        }}
        isLoading={disableMutation.isPending}
        failedAttempts={disableAttempts}
        isLocked={disableLocked}
      />
    );
  if (uiState === 'regenerating')
    return (
      <RegeneratingState
        onConfirm={(code) => regenMutation.mutate({ code })}
        onCancel={() => {
          setRegenAttempts(0);
          setRegenLocked(false);
          setUiState('enabled');
        }}
        isLoading={regenMutation.isPending}
        failedAttempts={regenAttempts}
        isLocked={regenLocked}
      />
    );
  if (uiState === 'new-backup-codes')
    return (
      <BackupCodesStep
        codes={backupCodes}
        onDone={() => {
          utils.auth.get2fa.invalidate();
          setBackupCodes([]);
          setRegenAttempts(0);
          setRegenLocked(false);
          setUiState('enabled');
        }}
      />
    );

  return null;
}
