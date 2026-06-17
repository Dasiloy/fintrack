'use client';

import * as React from 'react';
import { useRouter } from '@bprogress/next';
import { ChevronRight, Lock } from 'lucide-react';
import { Skeleton } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { api_client } from '@/lib/trpc_app/api_client';
import { useIsPro } from '@/app/providers/plan_usage_provider';
import { ScoreGauge } from './score_gauge';
import { FinancialHealthSheet } from './financial_health_sheet';

/**
 * Golden Financial Health Score card — a standalone card (beside the balance on
 * desktop, stacked below on mobile). Pro users see their live score and open the
 * 12-week trend; free users get a frosted, backdrop-blurred lock and the score
 * is never fetched (nothing sensitive reaches a free client).
 */
export function FinancialHealthCard() {
  const isPro = useIsPro();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  // Only Pro users ever fetch the score.
  const { data, isLoading } = api_client.finance.getBoard.useQuery(undefined, {
    enabled: isPro === true,
    staleTime: 5 * 60 * 1000,
  });
  const board = data?.data ?? null;

  // ── Loading (plan resolving / score loading) ──
  if (isPro === null || isLoading) {
    return (
      <GoldCardShell>
        <div className="flex items-center gap-4">
          <Skeleton className="size-[76px] rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>
      </GoldCardShell>
    );
  }

  // ── Free: named, blurred-gauge teaser + solid unlock pill ──
  if (!isPro) {
    return (
      <button
        type="button"
        onClick={() => router.push(STATIC_ROUTES.PRICING)}
        className="group block h-full w-full cursor-pointer text-left outline-none"
        aria-label="Unlock the Financial Health score with Pro"
      >
        <GoldCardShell interactive>
          <div className="flex items-center gap-4">
            {/* Blurred gauge = the locked signal (fake value, never real) */}
            <ScoreGauge
              score={0}
              blurred
              size={76}
              strokeWidth={8}
              showRating={false}
              className="opacity-70 blur-[3px]"
            />
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <span className="text-text-secondary text-[10px] font-bold tracking-widest uppercase">
                Financial Health
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950 transition-colors group-hover:bg-amber-300">
                <Lock className="size-3 shrink-0" />
                Unlock with Pro
              </span>
            </div>
          </div>
        </GoldCardShell>
      </button>
    );
  }

  // ── Pro: live score ──
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block h-full w-full cursor-pointer text-left outline-none"
        aria-label="View your Financial Health Score and 12-week trend"
      >
        <GoldCardShell interactive>
          <div className="flex items-center gap-4">
            <div className="transition-transform duration-300 group-hover:scale-105">
              <ScoreGauge score={board?.score ?? 0} size={76} strokeWidth={8} showRating={false} />
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <span className="text-text-secondary text-[10px] font-bold tracking-widest uppercase">
                Financial Health
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-amber-600 transition-colors group-hover:bg-amber-400/30">
                12-week trend
                <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </GoldCardShell>
      </button>
      <FinancialHealthSheet open={open} onOpenChange={setOpen} board={board} />
    </>
  );
}

/**
 * The golden card frame — gold-tinted gradient, subtle border, and an ambient
 * glow. Shared across loading / free / pro states for a consistent shell.
 */
function GoldCardShell({
  children,
  interactive = false,
}: {
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-card relative flex h-full min-h-[112px] items-center overflow-hidden border border-amber-400/45 px-5 py-5',
        'bg-bg-elevated',
        interactive &&
          'transition-all duration-300 group-hover:border-amber-400/60 group-hover:shadow-[0_0_28px_-6px_rgba(251,191,36,0.45)]',
      )}
    >
      {/* gold gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-amber-400/20 via-amber-400/8 to-transparent"
      />
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-10 size-36 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #FBBF24, transparent 70%)' }}
      />
      <div className="relative w-full">{children}</div>
    </div>
  );
}
