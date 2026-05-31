'use client';

import * as React from 'react';
import Cookies from 'js-cookie';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Skeleton } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import { useUserPreferences } from '@/app/providers/user_preferences_provider';
import { langToLocale } from '@fintrack/utils/format';
import {
  COOKIE_BALANCE,
  COOKIE_BALANCE_VALUE_DISABLED,
  COOKIE_BALANCE_VALUE_ENABLED,
  getCookieExpiry,
} from '@/lib/constants/cookies';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface DashboardHeroProps {
  data?: GetTransactionSummaryRes | null;
  isLoading: boolean;
  initialBalanceHidden?: boolean;
}

function ChangeBadge({ pct }: { pct: number }) {
  const positive = pct > 0;
  const neutral = pct === 0;

  if (neutral) {
    return (
      <span className="bg-border-light/50 text-text-tertiary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold">
        <Minus className="size-3" />
        No change
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        positive ? 'bg-emerald-500/12 text-emerald-400' : 'bg-red-500/12 text-red-400',
      )}
    >
      {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {positive ? '+' : ''}
      {pct.toFixed(1)}% vs last month
    </span>
  );
}

export function DashboardHero({
  data,
  isLoading,
  initialBalanceHidden = false,
}: DashboardHeroProps) {
  const formatCurrency = useFormatCurrency();
  const { currency, language } = useUserPreferences();

  const [hidden, setHidden] = React.useState(initialBalanceHidden);

  const toggleHidden = () => {
    setHidden((h) => {
      const next = !h;
      Cookies.set(
        COOKIE_BALANCE,
        next ? COOKIE_BALANCE_VALUE_DISABLED : COOKIE_BALANCE_VALUE_ENABLED,
        { expires: getCookieExpiry(COOKIE_BALANCE), sameSite: 'lax' },
      );
      return next;
    });
  };

  const locale = langToLocale(language);
  const formatCompact = React.useCallback(
    (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount),
    [currency, locale],
  );

  const netBalance = data ? parseFloat(data.netBalance) : 0;
  const pct = data?.balanceChangePct ?? 0;

  const income = data?.monthlySeries?.reduce((sum, m) => sum + parseFloat(m.income), 0) ?? 0;
  const expense = data?.monthlySeries?.reduce((sum, m) => sum + parseFloat(m.expense), 0) ?? 0;

  return (
    <div className="glass-card rounded-card px-6 py-5" style={{ border: 'none' }}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Balance section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <p className="text-text-disabled text-[11px] font-semibold tracking-widest uppercase">
              Net Balance
            </p>
            <button
              type="button"
              onClick={toggleHidden}
              className="text-text-disabled hover:text-text-tertiary cursor-pointer transition-colors"
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
            >
              {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>

          {isLoading ? (
            <Skeleton className="h-10 w-48 rounded-lg" />
          ) : hidden ? (
            <p className="text-text-primary text-[2.25rem] leading-none font-bold tracking-tight select-none">
              ••••••
            </p>
          ) : (
            <p
              className={cn(
                'text-[1.875rem] leading-none font-bold tracking-tight tabular-nums sm:text-[2.25rem]',
                {
                  'text-text-primary': netBalance === 0,
                  'text-emerald-400': netBalance > 0,
                  'text-red-400': netBalance < 0,
                },
              )}
            >
              {formatCurrency(Math.abs(netBalance))}
            </p>
          )}

          <div className="mt-1">
            {isLoading ? <Skeleton className="h-5 w-32 rounded-full" /> : <ChangeBadge pct={pct} />}
          </div>
        </div>

        {/* Month chips */}
        <div className="flex min-w-0 gap-3 xl:flex-col xl:items-end xl:gap-2">
          {/* Income chip */}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-2.5 xl:flex-none">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
              <ArrowUpRight className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-wider text-emerald-500/70 uppercase">
                Total Income
              </p>
              {isLoading ? (
                <Skeleton className="h-4 w-20 rounded" />
              ) : hidden ? (
                <p className="text-[15px] leading-none font-bold text-emerald-400 select-none">
                  •••
                </p>
              ) : (
                <p className="text-[15px] leading-none font-bold text-emerald-400 tabular-nums">
                  {formatCompact(income)}
                </p>
              )}
            </div>
          </div>

          {/* Expense chip */}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/8 px-3 py-2.5 xl:flex-none">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-red-500/15 text-red-400">
              <ArrowDownRight className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-wider text-red-500/70 uppercase">
                Total Spent
              </p>
              {isLoading ? (
                <Skeleton className="h-4 w-20 rounded" />
              ) : hidden ? (
                <p className="text-[15px] leading-none font-bold text-red-400 select-none">•••</p>
              ) : (
                <p className="text-[15px] leading-none font-bold text-red-400 tabular-nums">
                  {formatCompact(expense)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
