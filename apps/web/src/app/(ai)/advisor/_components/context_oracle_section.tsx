'use client';

// ── ContextOracleSection ──────────────────────────────────────────────────────
// Live market signals read from the gateway macro-context cache (advisor.getMacroContext),
// independent of insight runs. Individual stats show "—" when a value is unavailable.

import * as React from 'react';
import { Globe, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { Skeleton } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { relativeTime } from '../_lib/advisor.helpers';

export function ContextOracleSection() {
  const [expanded, setExpanded] = React.useState(true);

  // Read macro context live from the gateway cache so values are never stale.
  const { data, isLoading } = api_client.advisor.getMacroContext.useQuery(undefined, {
    staleTime: 60_000,
  });

  const macroContext = data?.data ?? null;

  return (
    <div className="border-border-subtle border-b">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="hover:bg-bg-surface-hover flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors"
        aria-expanded={expanded}
      >
        <Globe className="text-text-tertiary size-3.5 shrink-0" aria-hidden />
        <span className="text-text-primary flex-1 text-[12px] font-semibold">Market Signals</span>
        {macroContext && (
          <span className="text-text-disabled mr-1 text-[10px]">
            {relativeTime(new Date(macroContext.fetchedAt))}
          </span>
        )}
        <ChevronDown
          className={cn(
            'text-text-tertiary size-3.5 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-1.5 px-4 pb-4">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </>
          ) : macroContext ? (
            <>
              <OracleStat
                label="USD / NGN"
                value={
                  macroContext.ngnUsdRate != null
                    ? `₦${macroContext.ngnUsdRate.toLocaleString()}`
                    : '—'
                }
                subtext="Exchange rate"
              />
              <OracleStat
                label="Food CPI"
                value={macroContext.foodCpiYoY != null ? `+${macroContext.foodCpiYoY}%` : '—'}
                subtext="YoY inflation"
                trend="up"
                alert={macroContext.foodCpiYoY != null && macroContext.foodCpiYoY > 15}
              />
              <OracleStat
                label="CBN Rate"
                value={macroContext.cbnPolicyRate != null ? `${macroContext.cbnPolicyRate}%` : '—'}
                subtext="Policy rate"
                trend="up"
              />
            </>
          ) : (
            <p className="text-text-disabled py-2 text-[11px]">
              No insights data available right now
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── OracleStat ────────────────────────────────────────────────────────────────

interface OracleStatProps {
  label: string;
  value: string;
  subtext: string;
  trend?: 'up' | 'down';
  alert?: boolean;
}

function OracleStat({ label, value, subtext, trend, alert = false }: OracleStatProps) {
  return (
    <div className="bg-bg-elevated flex items-center gap-3 rounded-lg px-3 py-2.5">
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-text-tertiary text-[10px] font-medium tracking-wide uppercase">
          {label}
        </span>
        <span className="text-text-disabled text-[10px]">{subtext}</span>
      </div>
      <div className="flex items-center gap-1">
        {trend === 'up' && (
          <TrendingUp
            className={cn('size-3', alert ? 'text-warning' : 'text-text-disabled')}
            aria-hidden
          />
        )}
        {trend === 'down' && <TrendingDown className="text-success size-3" aria-hidden />}
        <span
          className={cn(
            'text-[13px] font-semibold tabular-nums',
            alert ? 'text-warning' : 'text-text-primary',
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
