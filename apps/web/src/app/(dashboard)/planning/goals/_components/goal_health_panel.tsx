'use client';

import { Flame } from 'lucide-react';
import { Badge } from '@ui/components';

import type { GoalsAggregate } from '@fintrack/types/protos/finance/goal';
import { milestoneForStreak, monthLabel } from '../helpers';
import { GoalHealthPanelSkeleton } from './goal_health_panel_skeleton';
import { useFormatCurrency } from '@/hooks/use_format_currency';

interface GoalHealthPanelProps {
  aggregate: GoalsAggregate | undefined;
  isLoading: boolean;
}

export function GoalHealthPanel({
  aggregate, isLoading }: GoalHealthPanelProps) {
  const formatCurrency = useFormatCurrency();
  if (isLoading) return <GoalHealthPanelSkeleton />;

  const streak = aggregate?.streakMonths ?? 0;
  const heatmap = aggregate?.contributionHeatmap ?? [];
  const milestone = milestoneForStreak(streak);
  const maxHeat = Math.max(...heatmap.map((m) => m.amount), 1);

  return (
    <div className="glass-card rounded-card border-border-subtle flex flex-col gap-5 border p-5">
      {/* ── Streak block ── */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        {streak === 0 ? (
          <>
            <div className="bg-bg-muted flex size-12 items-center justify-center rounded-xl">
              <Flame className="text-text-disabled size-6" />
            </div>
            <p className="text-text-secondary mt-1 text-[13px] font-medium">No streak yet</p>
            <p className="text-text-disabled max-w-[220px] text-[11px] leading-snug">
              Contribute to any goal this month to start your streak
            </p>
          </>
        ) : (
          <>
            <div className="flex items-end gap-1">
              <span className="text-text-primary text-[42px] leading-none font-bold tabular-nums">
                {streak}
              </span>
              <span className="text-text-tertiary mb-1.5 text-[14px] font-medium">
                month{streak !== 1 ? 's' : ''}
              </span>
            </div>
            {milestone && (
              <span
                className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${milestone.cls}`}
              >
                <milestone.icon className="size-3" />
                {milestone.label}
              </span>
            )}
          </>
        )}
      </div>

      {/* ── 12-month heatmap ── */}
      {heatmap.length > 0 && (
        <div>
          <p className="text-text-disabled mb-2 text-[10px] font-semibold tracking-wider uppercase">
            Last 12 Months
          </p>
          <div className="grid grid-cols-12 gap-1">
            {heatmap.map((cell) => {
              const intensity = cell.amount > 0 ? 0.15 + (cell.amount / maxHeat) * 0.85 : 0;
              return (
                <div
                  key={cell.month}
                  title={`${monthLabel(cell.month)}: ${formatCurrency(cell.amount)}`}
                  className="border-border-light aspect-square rounded-sm border"
                  style={{
                    background:
                      intensity > 0
                        ? `rgba(124, 122, 255, ${intensity})`
                        : 'var(--ft-color-bg-muted)',
                  }}
                />
              );
            })}
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-text-disabled text-[9px]">{monthLabel(heatmap[0]!.month)}</span>
            <span className="text-text-disabled text-[9px]">
              {monthLabel(heatmap[heatmap.length - 1]!.month)}
            </span>
          </div>
        </div>
      )}

      {/* ── Stats block ── */}
      {aggregate && (
        <div className="border-border-light divide-border-light divide-y border-t pt-4">
          <StatRow label="Avg. monthly" value={formatCurrency(aggregate.avgMonthlyContribution)} />
          <StatRow
            label="On track"
            value={`${aggregate.onTrackCount} / ${aggregate.activeCount} goals`}
          />
          <StatRow
            label="Total saved"
            value={`${formatCurrency(aggregate.totalSaved)} · ${Math.round(aggregate.activePercent)}%`}
          />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-text-tertiary text-[12px]">Status split</span>
            <div className="flex items-center gap-2">
              {aggregate.activeCount > 0 && (
                <Badge variant="info" className="text-[10px]">
                  {aggregate.activeCount} active
                </Badge>
              )}
              {aggregate.completedCount > 0 && (
                <Badge variant="success" className="text-[10px]">
                  {aggregate.completedCount} done
                </Badge>
              )}
              {aggregate.onHoldCount > 0 && (
                <Badge variant="warning" className="text-[10px]">
                  {aggregate.onHoldCount} paused
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-text-tertiary text-[12px]">{label}</span>
      <span className="text-text-primary text-[12px] font-medium tabular-nums">{value}</span>
    </div>
  );
}
