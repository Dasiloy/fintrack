'use client';

// ── ContextOracleSection ──────────────────────────────────────────────────────
// Displays live market data fetched by oracle tools: NGN/USD rate, Food CPI,
// CBN policy rate. Data is stub in this phase — real values come from the
// oracle tool endpoints defined in AI-SERVICE.md Domain 3.

import * as React from 'react';
import { Globe, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { STUB_INSIGHT } from '../_lib/advisor.stub';
import { relativeTime } from '../_lib/advisor.helpers';

export function ContextOracleSection() {
  const [expanded, setExpanded] = React.useState(true);
  const { macroContext } = STUB_INSIGHT;

  return (
    <div className="border-b border-border-subtle">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-bg-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <Globe className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
        <span className="flex-1 text-[12px] font-semibold text-text-primary">Market Signals</span>
        <span className="text-[10px] text-text-disabled mr-1">
          {relativeTime(new Date(macroContext.fetchedAt))}
        </span>
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
          <OracleStat
            label="USD / NGN"
            value={`₦${macroContext.ngnUsdRate.toLocaleString()}`}
            subtext="Exchange rate"
          />
          <OracleStat
            label="Food CPI"
            value={`+${macroContext.foodCpiYoY}%`}
            subtext="YoY inflation"
            trend="up"
            alert={macroContext.foodCpiYoY > 15}
          />
          <OracleStat
            label="CBN Rate"
            value={`${macroContext.cbnPolicyRate}%`}
            subtext="Policy rate"
            trend="up"
          />
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
        <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
          {label}
        </span>
        <span className="text-[10px] text-text-disabled">{subtext}</span>
      </div>
      <div className="flex items-center gap-1">
        {trend === 'up' && (
          <TrendingUp
            className={cn('size-3', alert ? 'text-warning' : 'text-text-disabled')}
            aria-hidden
          />
        )}
        {trend === 'down' && (
          <TrendingDown className="size-3 text-success" aria-hidden />
        )}
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
