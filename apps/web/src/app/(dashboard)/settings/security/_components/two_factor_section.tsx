'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Check, Copy, Download, ShieldCheck, ShieldOff } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

import {
  Button,
  Field,
  FieldGroup,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Skeleton,
  Text,
  toast,
} from '@ui/components';
import { ServerFormatter } from '@fintrack/utils/server';
import { api_client } from '@/lib/trpc_app/api_client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TwoFactorState =
  | 'loading'
  | 'disabled'
  | 'setup-scan'
  | 'setup-confirm'
  | 'setup-backup-codes'
  | 'enabled'
  | 'disabling';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border-subtle bg-bg-elevated rounded-card border p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
          <ShieldCheck className="text-primary size-4" />
        </div>
        <div>
          <p className="text-text-primary text-sm font-medium">Two-Factor Authentication</p>
          <p className="text-text-tertiary text-xs">
            Require a verification code in addition to your password
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <SectionShell>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
    </SectionShell>
  );
}

// ── Disabled state ────────────────────────────────────────────────────────────

function DisabledState({ onEnable }: { onEnable: () => void }) {
  return (
    <SectionShell>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-bg-surface text-text-tertiary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
            <span className="bg-text-disabled size-1.5 rounded-full" />
            Disabled
          </span>
        </div>
        <Button size="sm" onClick={onEnable}>
          Enable 2FA
        </Button>
      </div>
      <p className="text-text-tertiary mt-4 text-xs leading-relaxed">
        Add an extra layer of security to your account. When enabled, you&apos;ll need your
        authenticator app to log in.
      </p>
    </SectionShell>
  );
}

// ── Setup: Step 1 — Scan QR code ──────────────────────────────────────────────

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
    <SectionShell>
      <p className="text-text-secondary mb-5 text-sm">
        Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, or
        Bitwarden).
      </p>

      <div className="flex flex-col items-start gap-6 sm:flex-row">
        {/* QR code */}
        <div className="shrink-0 rounded-xl bg-white p-3 shadow-sm">
          <QRCode value={otpauthUri} size={160} />
        </div>

        {/* Manual entry */}
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
            After scanning, your app will show a 6-digit code that changes every 30 seconds.
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
    </SectionShell>
  );
}

// ── Setup: Step 2 — Confirm code ──────────────────────────────────────────────

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
    <SectionShell>
      <p className="text-text-secondary mb-6 text-sm">
        Enter the 6-digit code from your authenticator app to confirm setup.
      </p>

      <FieldGroup>
        <Field orientation="horizontal" className="justify-center">
          <InputOTP
            required
            maxLength={6}
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
            containerClassName="gap-space-2"
            disabled={isLoading}
            value={otp}
            onChange={setOtp}
            onComplete={onConfirm}
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

        {isLoading && (
          <Text variant="body-sm" className="text-text-secondary animate-pulse text-center">
            Verifying...
          </Text>
        )}
      </FieldGroup>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
      </div>
    </SectionShell>
  );
}

// ── Setup: Step 3 — Backup codes ─────────────────────────────────────────────

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
    <SectionShell>
      <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs font-medium text-amber-400">
          Save these backup codes now — they will not be shown again.
        </p>
        <p className="text-text-tertiary mt-1 text-xs">
          Each code can only be used once to access your account if you lose your authenticator
          device.
        </p>
      </div>

      {/* Grid of codes */}
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
    </SectionShell>
  );
}

// ── Enabled state ─────────────────────────────────────────────────────────────

function EnabledState({
  backupCodesRemaining,
  onDisable,
}: {
  backupCodesRemaining: number;
  onDisable: () => void;
}) {
  return (
    <SectionShell>
      <div className="flex items-center justify-between">
        <span className="bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
          <span className="bg-success size-1.5 rounded-full" />
          Active
        </span>
        <Button variant="destructive" size="sm" onClick={onDisable}>
          <ShieldOff className="size-3.5" />
          Disable 2FA
        </Button>
      </div>

      {backupCodesRemaining <= 2 && backupCodesRemaining > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-amber-400">
            Only {backupCodesRemaining} backup code{backupCodesRemaining !== 1 ? 's' : ''}{' '}
            remaining. Consider regenerating them.
          </p>
        </div>
      )}

      {backupCodesRemaining === 0 && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-error text-xs">
            No backup codes remaining. Regenerate them to ensure account recovery access.
          </p>
        </div>
      )}
    </SectionShell>
  );
}

// ── Disabling state — inline confirmation ─────────────────────────────────────

function DisablingState({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: (code: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [otp, setOtp] = useState('');

  return (
    <SectionShell>
      <p className="text-text-secondary mb-2 text-sm">
        Enter the current code from your authenticator app to disable 2FA.
      </p>
      <p className="text-text-tertiary mb-6 text-xs">
        This will remove 2FA protection from your account and delete all backup codes.
      </p>

      <FieldGroup>
        <Field orientation="horizontal" className="justify-center">
          <InputOTP
            required
            maxLength={6}
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
            containerClassName="gap-space-2"
            disabled={isLoading}
            value={otp}
            onChange={setOtp}
            onComplete={onConfirm}
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

        {isLoading && (
          <Text variant="body-sm" className="text-text-secondary animate-pulse text-center">
            Disabling 2FA...
          </Text>
        )}
      </FieldGroup>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TwoFactorSection() {
  const [uiState, setUiState] = useState<TwoFactorState>('loading');
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(10);

  // ── tRPC ────────────────────────────────────────────────────────────────

  // api_client.auth.twoFactor.status.useQuery(undefined, {
  //   onSuccess(data) {
  //     setBackupCodesRemaining(data.backupCodesRemaining);
  //     setUiState(data.enabled ? 'enabled' : 'disabled');
  //   },
  //   onError() {
  //     setUiState('disabled');
  //   },
  // });

  // const initiateMutation = api_client.auth.twoFactor.initiate.useMutation();
  // const confirmMutation = api_client.auth.twoFactor.confirm.useMutation();
  // const disableMutation = api_client.auth.twoFactor.disable.useMutation();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleEnable = async () => {
    // try {
    //   const data = await initiateMutation.mutateAsync();
    //   setSetupData(data);
    //   setUiState('setup-scan');
    // } catch (error) {
    //   toast.error('Could not start 2FA setup', { description: ServerFormatter.formatError(error) });
    // }
  };

  const handleConfirm = async (code: string) => {
    // try {
    //   const result = await confirmMutation.mutateAsync({ code });
    //   setBackupCodes(result.backupCodes);
    //   setUiState('setup-backup-codes');
    // } catch (error) {
    //   toast.error('Invalid code', { description: ServerFormatter.formatError(error) });
    // }
  };

  const handleBackupCodesDone = () => {
    setBackupCodes([]);
    setSetupData(null);
    setBackupCodesRemaining(10);
    setUiState('enabled');
    toast.success('2FA enabled', { description: 'Your account is now protected with 2FA.' });
  };

  const handleDisableConfirm = async (code: string) => {
    // try {
    //   await disableMutation.mutateAsync({ code });
    //   setUiState('disabled');
    //   toast.success('2FA disabled', { description: '2FA has been removed from your account.' });
    // } catch (error) {
    //   toast.error('Invalid code', { description: ServerFormatter.formatError(error) });
    // }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (uiState === 'loading') return <LoadingSkeleton />;

  if (uiState === 'disabled') return <DisabledState onEnable={handleEnable} />;

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
        onConfirm={handleConfirm}
        onBack={() => setUiState('setup-scan')}
        isLoading
        // isLoading={confirmMutation.isPending}
      />
    );

  if (uiState === 'setup-backup-codes')
    return <BackupCodesStep codes={backupCodes} onDone={handleBackupCodesDone} />;

  if (uiState === 'enabled')
    return (
      <EnabledState
        backupCodesRemaining={backupCodesRemaining}
        onDisable={() => setUiState('disabling')}
      />
    );

  if (uiState === 'disabling')
    return (
      <DisablingState
        onConfirm={handleDisableConfirm}
        onCancel={() => setUiState('enabled')}
        isLoading
        // isLoading={disableMutation.isPending}
      />
    );

  return null;
}
