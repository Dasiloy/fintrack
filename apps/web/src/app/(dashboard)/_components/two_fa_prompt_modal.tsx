'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@ui/components';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';
import { api_client } from '@/lib/trpc_app/api_client';

interface TwoFaPromptModalProps {
  initialOpen?: boolean;
}

const SESSION_KEY = 'ft_2fa_prompt_seen';

export function TwoFaPromptModal({ initialOpen = false }: TwoFaPromptModalProps) {
  const [open, setOpen] = React.useState(false);
  const utils = api_client.useUtils();

  React.useEffect(() => {
    if (initialOpen && !sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { mutate: dismiss, isPending } = api_client.user.dismissTwoFaPrompt.useMutation({
    onSuccess: () => {
      void utils.user.getMe.invalidate();
      setOpen(false);
    },
  });

  if (!initialOpen && !open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        {/* ── Icon header ── */}
        <div className="from-bg-surface to-bg-deep flex h-32 items-center justify-center rounded-t-lg bg-linear-to-b">
          <div className="relative flex size-16 items-center justify-center">
            <div className="bg-primary/10 absolute inset-0 rounded-2xl" />
            <ShieldCheck className="text-primary relative size-8" />
            <span className="border-bg-surface bg-warning absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2">
              <ShieldAlert className="text-bg-surface size-3" fill="currentColor" />
            </span>
          </div>
        </div>

        <DialogHeader className="px-6 pt-2 pb-1 text-left">
          <DialogTitle className="text-text-primary text-[17px] font-semibold tracking-tight">
            Secure your account
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-[13px] leading-relaxed">
            Enable two-factor authentication to add an extra layer of protection.
          </DialogDescription>
        </DialogHeader>

        {/* ── Benefit callout ── */}
        <div className="border-border-light bg-bg-surface mx-6 flex items-start gap-3 rounded-xl border px-3.5 py-3">
          <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
          <p className="text-text-secondary text-[12px] leading-snug">
            2FA protects against phishing and credential theft.{' '}
            <span className="text-text-primary font-medium">
              Takes less than 2 minutes to set up.
            </span>
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2 px-6 pb-6">
          <Button asChild className="w-full gap-2" onClick={() => setOpen(false)}>
            <Link href={DASHBOARD_ROUTES.SETTINGS_SECURITY}>
              <ShieldCheck className="size-3.5" />
              Set up 2FA
            </Link>
          </Button>

          <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
            Remind me later
          </Button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => dismiss()}
            className="text-text-tertiary hover:text-text-secondary mx-auto mt-1 text-[12px] transition-colors disabled:opacity-50"
          >
            Don&apos;t show again
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
