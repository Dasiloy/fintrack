'use client';

// ── ContextOracleSection ──────────────────────────────────────────────────────
// Live market signals from the latest insight's macroContext field.
// If no insight exists yet the section shows placeholder dashes.

import * as React from 'react';
import { Globe, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { Skeleton } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { relativeTime, getMacroContext } from '../_lib/advisor.helpers';

export function ContextOracleSection() {
  const [expanded, setExpanded] = React.useState(true);

  const { data, isLoading } = api_client.advisor.getInsights.useQuery(
    { limit: 1 },
    { staleTime: 60_000 },
  );

  const insight = data?.data?.[0] ?? null;
  const macroContext = insight ? getMacroContext(insight) : null;

  return (
    <div className="border-b border-border-subtle">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-bg-surface-hover"
        aria-expanded={expanded}
      >
        <Globe className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
        <span className="flex-1 text-[12px] font-semibold text-text-primary">Market Signals</span>
        {macroContext && (
          <span className="mr-1 text-[10px] text-text-disabled">
            {relativeTime(new Date(macroContext.fetchedAt))}
          </span>
        )}
        <ChevronDown
          className={cn(
            'size-3.5 text-text-tertiary transition-transform duration-200',
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
              <OracleStat label="USD / NGN" value={`₦${macroContext.ngnUsdRate.toLocaleString()}`} subtext="Exchange rate" />
              <OracleStat
                label="Food CPI"
                value={`+${macroContext.foodCpiYoY}%`}
                subtext="YoY inflation"
                trend="up"
                alert={macroContext.foodCpiYoY > 15}
              />
              <OracleStat label="CBN Rate" value={`${macroContext.cbnPolicyRate}%`} subtext="Policy rate" trend="up" />
            </>
          ) : (
            <p className="py-2 text-[11px] text-text-disabled">
              Market data will appear after the first insights run.
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
    <div className="flex items-center gap-3 rounded-lg bg-bg-elevated px-3 py-2.5">
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">{label}</span>
        <span className="text-[10px] text-text-disabled">{subtext}</span>
      </div>
      <div className="flex items-center gap-1">
        {trend === 'up' && (
          <TrendingUp className={cn('size-3', alert ? 'text-warning' : 'text-text-disabled')} aria-hidden />
        )}
        {trend === 'down' && <TrendingDown className="size-3 text-success" aria-hidden />}
        <span className={cn('text-[13px] font-semibold tabular-nums', alert ? 'text-warning' : 'text-text-primary')}>
          {value}
        </span>
      </div>
    </div>
  );
}
