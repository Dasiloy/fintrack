'use client';

import * as React from 'react';
import { useRouter } from '@bprogress/next';
import { AlertCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@ui/lib/utils/cn';
import { useIsPro } from '@/app/providers/plan_usage_provider';
import { useRegionCheck } from '@/hooks/use_region_check';
import { RegionGateModal } from './region_gate_modal';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

export interface UsageBannerProps {
  used: number;
  limit: number;
  /** Short noun for the resource, e.g. "budgets", "insights", "bank account" */
  label: string;
  /** 'quota' for rolling monthly limits; 'slot' for capped resource counts */
  variant: 'quota' | 'slot';
  className?: string;
}

export function UsageBanner({ used, limit, label, variant, className }: UsageBannerProps) {
  const isPro = useIsPro();
  const router = useRouter();
  const { checkRegion, isPending } = useRegionCheck();
  const [regionGateOpen, setRegionGateOpen] = React.useState(false);

  // Hide while loading or for Pro users
  if (isPro === null || isPro) return null;

  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? used / limit : 0;

  const show = variant === 'quota' ? pct >= 0.6 : limit === 1 ? used >= 1 : used >= limit - 1;

  if (!show) return null;

  const isAtLimit = remaining === 0;

  const message =
    variant === 'quota'
      ? isAtLimit
        ? `You've reached your ${label} limit for this month.`
        : `${used} of ${limit} ${label} used this month.`
      : limit === 1 && isAtLimit
        ? `You've used your 1 free ${label}.`
        : remaining === 1
          ? `1 ${label} slot remaining on the free plan.`
          : `You've reached your ${label} limit.`;

  const handleUpgrade = async (e: React.MouseEvent) => {
    e.preventDefault();
    const { isNigeria } = await checkRegion();
    if (!isNigeria) {
      setRegionGateOpen(true);
      return;
    }
    router.push(STATIC_ROUTES.PRICING);
  };

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-2 rounded-lg px-3 py-2 text-[12px] md:flex-row md:items-center',
          isAtLimit ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning',
          className,
        )}
      >
        <div className="flex flex-1 items-center gap-2">
          {isAtLimit ? (
            <AlertCircle className="size-3 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="size-3 shrink-0" aria-hidden />
          )}
          <span className="flex-1">{message}</span>
        </div>
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={isPending}
          className={cn(
            'flex shrink-0 cursor-pointer items-center gap-1 font-semibold whitespace-nowrap underline-offset-2 hover:underline',
            isAtLimit ? 'text-error' : 'text-warning',
          )}
        >
          <Sparkles className="size-2.5" />
          Upgrade to Pro
        </button>
      </div>
      <RegionGateModal open={regionGateOpen} onClose={() => setRegionGateOpen(false)} />
    </>
  );
}
