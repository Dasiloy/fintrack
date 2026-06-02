'use client';

import { Globe } from 'lucide-react';
import { Button, Dialog, DialogContent } from '@ui/components';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_FINTRACK_SUPPORT_EMAIL ?? 'support@fintrack.live';

interface RegionGateModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Shown when a user outside Nigeria attempts to upgrade to Pro.
 * Pro subscriptions are currently only available to Nigerian users (NGN billing via Paystack).
 */
export function RegionGateModal({ open, onClose }: RegionGateModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="overflow-hidden p-0 sm:max-w-sm">
        {/* ── Illustration ── */}
        <div className="from-bg-surface to-bg-deep flex h-40 items-center justify-center bg-linear-to-b">
          <div className="border-border-subtle bg-bg-elevated flex size-16 items-center justify-center rounded-2xl border shadow-lg">
            <Globe className="text-text-tertiary size-7" />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col gap-4 px-6 pt-4 pb-6">
          {/* Region badge */}
          <span className="bg-primary/10 text-primary inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
            Coming soon to your region
          </span>

          {/* Title + description */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-text-primary text-[17px] leading-snug font-semibold tracking-tight">
              Pro isn't available in your region yet
            </h2>
            <p className="text-text-secondary text-[13px] leading-relaxed">
              FinTrack Pro is currently available to users in Nigeria only, as billing is
              processed in Naira (₦). We're actively expanding to more African markets —
              your region is next.
            </p>
          </div>

          {/* Info row */}
          <div className="border-border-light bg-bg-surface rounded-xl border px-3.5 py-3">
            <p className="text-text-secondary text-[12px] leading-snug">
              You can continue using the{' '}
              <span className="text-text-primary font-semibold">free plan</span> with no
              restrictions while we work on bringing Pro to your country.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 pt-1">
            <Button asChild className="w-full gap-2" variant="outline">
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Notify me when FinTrack Pro launches in my region`}>
                Notify me when it&apos;s available
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-tertiary w-full"
              onClick={onClose}
            >
              Continue with free plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
