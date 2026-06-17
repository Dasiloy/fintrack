'use client';

import * as React from 'react';
import { useRouter } from '@bprogress/next';
import { Lock, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  Button,
  ScrollArea,
  Sheet,
  SheetContent,
  Skeleton,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import dayjs from '@fintrack/utils/date';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import {
  BUDGET_WEIGHT,
  GOAL_WEIGHT,
  SAVING_WEIGHT,
  SPLIT_WEIGHT,
} from '@fintrack/types/constants/finance.constant';
import type { FinanceBoard } from '@fintrack/types/protos/finance/finance';
import { api_client } from '@/lib/trpc_app/api_client';
import { ScoreGauge } from './score_gauge';
import { useIsPro } from '@/app/providers/plan_usage_provider';

interface FinancialHealthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The live current-week board (already fetched by the trigger). */
  board: FinanceBoard | null;
}

const COMPONENTS = [
  { key: 'budgetScore', label: 'Budget adherence', max: BUDGET_WEIGHT, color: '#34d399' },
  { key: 'savingScore', label: 'Savings rate', max: SAVING_WEIGHT, color: '#fbbf24' },
  { key: 'goalScore', label: 'Goal pacing', max: GOAL_WEIGHT, color: '#a78bfa' },
  { key: 'splitScore', label: 'Split settlement', max: SPLIT_WEIGHT, color: '#fb7185' },
] as const;

const chartConfig = { score: { label: 'Score', color: '#fbbf24' } };

export function FinancialHealthSheet({ open, onOpenChange, board }: FinancialHealthSheetProps) {
  const isPro = useIsPro();
  const router = useRouter();
  const { data, isLoading } = api_client.finance.getHistory.useQuery(undefined, {
    enabled: open && isPro === true,
    staleTime: 5 * 60 * 1000,
  });

  const history = data?.data ?? [];

  // Trend = persisted weeks + the live current week appended (deduped by week).
  const points = React.useMemo(() => {
    const rows: FinanceBoard[] = [...history];
    if (board && (rows.length === 0 || rows[rows.length - 1]?.startDate !== board.startDate)) {
      rows.push(board);
    }
    return rows.map((b, i) => ({
      label: i === rows.length - 1 ? 'Now' : dayjs(b.startDate).format('MMM D'),
      score: Math.round(b.score),
    }));
  }, [history, board]);

  // Week-over-week delta: live score vs the most recent persisted week.
  const lastPersisted = history.length ? history[history.length - 1] : null;
  const delta =
    board && lastPersisted ? Math.round((board.score - lastPersisted.score) * 10) / 10 : null;

  const score = board?.score ?? 0;

  // Defensive: a non-Pro user should never reach the trigger, but if they do,
  // show an upgrade boilerplate instead of any score data.
  if (!isPro) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          title="Financial Health"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/30">
              <Lock className="size-6 text-amber-500" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-text-primary text-[16px] font-semibold">
                Financial Health is a Pro feature
              </h2>
              <p className="text-text-tertiary text-[13px] leading-relaxed">
                Unlock your weekly score and 12-week trend across budgets, savings, goals, and
                splits.
              </p>
            </div>
            <Button onClick={() => router.push(STATIC_ROUTES.PRICING)} className="gap-1.5">
              <Lock className="size-3.5" />
              Upgrade to Pro
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        title="Financial Health"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        {/* ── Header ── */}
        <div className="border-border-subtle relative shrink-0 overflow-hidden border-b px-6 pt-6 pb-5">
          {/* gold ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #FBBF24, transparent 70%)' }}
          />
          <p className="text-text-disabled text-[11px] font-semibold tracking-widest uppercase">
            Financial Health Score
          </p>
          <div className="mt-3 flex items-center gap-4">
            <ScoreGauge score={score} size={104} strokeWidth={9} />
            <div className="flex flex-col gap-1.5">
              <DeltaBadge delta={delta} />
              <p className="text-text-tertiary text-[12px] leading-snug">
                {board
                  ? `Week of ${dayjs(board.startDate).format('MMM D')} – ${dayjs(board.endDate).format('MMM D')}`
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-6 px-6 py-6">
            {/* ── 12-week trend ── */}
            <section className="flex flex-col gap-3">
              <h3 className="text-text-primary text-[13px] font-semibold">Last 12 weeks</h3>
              {isLoading ? (
                <Skeleton className="h-44 w-full rounded-xl" />
              ) : points.length <= 1 ? (
                <div className="border-border-subtle flex h-44 items-center justify-center rounded-xl border border-dashed">
                  <p className="text-text-disabled text-[12px]">
                    Not enough history yet — check back next week.
                  </p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-44 w-full overflow-hidden">
                  <AreaChart data={points} margin={{ top: 6, right: 6, bottom: 4, left: -16 }}>
                    <defs>
                      <linearGradient id="ft-score-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--ft-color-border-subtle)"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 10, fill: 'var(--ft-color-text-disabled)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      tick={{ fontSize: 10, fill: 'var(--ft-color-text-disabled)' }}
                      width={36}
                    />
                    <ChartTooltip
                      cursor={{ stroke: 'var(--ft-color-border-subtle)', strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="glass-card shadow-card rounded-lg px-3 py-2 text-[11px]">
                            <p className="text-text-primary mb-0.5 font-semibold">{label}</p>
                            <p className="text-amber-300 tabular-nums">{payload[0]?.value} / 100</p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#FBBF24"
                      strokeWidth={2}
                      fill="url(#ft-score-area)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#FBBF24' }}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </section>

            {/* ── Component breakdown ── */}
            <section className="flex flex-col gap-3">
              <h3 className="text-text-primary text-[13px] font-semibold">
                This week&apos;s breakdown
              </h3>
              <div className="flex flex-col gap-3.5">
                {COMPONENTS.map((c) => {
                  const value = board ? (board[c.key] as number) : 0;
                  const pct = c.max > 0 ? Math.min(100, (value / c.max) * 100) : 0;
                  return (
                    <div key={c.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary text-[12px]">{c.label}</span>
                        <span className="text-text-primary text-[12px] font-semibold tabular-nums">
                          {Math.round(value * 10) / 10}
                          <span className="text-text-disabled font-normal"> / {c.max}</span>
                        </span>
                      </div>
                      <div className="bg-bg-surface-hover h-1.5 w-full overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
                          style={{ width: `${pct}%`, background: c.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <p className="text-text-disabled text-[11px] leading-relaxed">
              Your score blends budget adherence, savings rate, goal pacing, and how promptly you
              settle splits. It refreshes every week.
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="bg-bg-surface-hover text-text-tertiary inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold">
        New
      </span>
    );
  }
  const up = delta > 0;
  const flat = delta === 0;
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        flat
          ? 'bg-border-light/50 text-text-tertiary'
          : up
            ? 'bg-emerald-500/12 text-emerald-400'
            : 'bg-red-500/12 text-red-400',
      )}
    >
      {flat ? (
        <Minus className="size-3" />
      ) : up ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {up ? '+' : ''}
      {delta} pts vs last week
    </span>
  );
}
