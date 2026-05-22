'use client';

import * as React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CalendarDays } from 'lucide-react';
import dayjs from '@fintrack/utils/date';
import { cn } from '@ui/lib/utils/cn';
import { Skeleton } from '@ui/components';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface SpendingHeatmapProps {
  data?: GetTransactionSummaryRes | null;
  isLoading: boolean;
}

export function SpendingHeatmap({ data, isLoading }: SpendingHeatmapProps) {
  const formatCurrency = useFormatCurrency();

  const cells = React.useMemo(() => {
    if (!data?.spendingHeatmap?.length) return [];
    return data.spendingHeatmap.map((d) => ({
      date: d.date,
      amount: parseFloat(d.amount),
    }));
  }, [data]);

  const maxAmount = React.useMemo(
    () => Math.max(...cells.map((c) => c.amount), 1),
    [cells],
  );

  // Build 12 columns × 7 rows grid (week columns, day rows)
  const grid = React.useMemo<Array<Array<{ date: string; amount: number } | null>>>(() => {
    if (!cells.length) return [];

    const rawDay = dayjs(cells[0]!.date).day();
    const isoIndex = (rawDay + 6) % 7;
    const padded: Array<{ date: string; amount: number } | null> = [
      ...Array.from({ length: isoIndex }, () => null),
      ...cells,
    ];

    const cols: Array<Array<{ date: string; amount: number } | null>> = [];
    for (let i = 0; i < padded.length; i += 7) {
      cols.push(padded.slice(i, i + 7));
    }
    return cols;
  }, [cells]);

  // Show month label only when the month changes column-to-column
  const monthLabels = React.useMemo(() => {
    let lastMonth = '';
    return grid.map((col) => {
      const firstCell = col.find((c) => c !== null);
      if (!firstCell) return null;
      const month = dayjs(firstCell.date).format('MMM');
      if (month !== lastMonth) {
        lastMonth = month;
        return month;
      }
      return null;
    });
  }, [grid]);

  return (
    <div className="glass-card rounded-card flex flex-col p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-text-primary">Spending Activity</h3>
          <p className="text-[11px] text-text-tertiary">Last 84 days</p>
        </div>
        <CalendarDays className="mt-0.5 size-3.5 text-text-disabled" />
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex gap-1">
              {Array.from({ length: 12 }).map((_, j) => (
                <Skeleton key={j} className="aspect-square w-full max-w-[20px] rounded-sm" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <Tooltip.Provider delayDuration={120}>
          {/* Month label row */}
          <div className="mb-1 flex gap-[3px]">
            {grid.map((_, wi) => (
              <div key={wi} className="flex-1 overflow-hidden">
                <span className="block truncate text-center text-[8px] leading-none text-text-disabled">
                  {monthLabels[wi] ?? ''}
                </span>
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex min-w-0 gap-[3px]">
            {grid.map((col, wi) => (
              <div key={wi} className="flex flex-1 flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, di) => {
                  const cell = col[di] ?? null;
                  if (!cell) {
                    return <div key={di} className="aspect-square w-full rounded-sm" />;
                  }
                  const intensity = cell.amount === 0 ? 0 : Math.max(0.08, cell.amount / maxAmount);
                  const isToday = cell.date === dayjs().format('YYYY-MM-DD');

                  return (
                    <Tooltip.Root key={di}>
                      <Tooltip.Trigger asChild>
                        <div
                          className={cn(
                            'aspect-square w-full cursor-default rounded-sm border transition-all duration-150',
                            isToday
                              ? 'ring-1 ring-primary ring-offset-1 ring-offset-bg-surface'
                              : '',
                          )}
                          style={{
                            background:
                              cell.amount === 0
                                ? 'var(--ft-color-bg-surface-hover)'
                                : `rgba(124, 122, 255, ${intensity})`,
                            borderColor:
                              cell.amount === 0
                                ? 'var(--ft-color-border-subtle)'
                                : `rgba(124, 122, 255, ${Math.min(intensity + 0.1, 1)})`,
                          }}
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="glass-card z-50 rounded-lg px-2.5 py-1.5 text-[11px] shadow-card"
                          sideOffset={4}
                        >
                          <p className="font-semibold text-text-primary">
                            {dayjs(cell.date).format('D MMM YYYY')}
                          </p>
                          <p className="tabular-nums text-text-secondary">
                            {cell.amount === 0 ? 'No spending' : formatCurrency(cell.amount)}
                          </p>
                          <Tooltip.Arrow className="fill-bg-surface" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  );
                })}
              </div>
            ))}
          </div>
        </Tooltip.Provider>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[9px] text-text-disabled">Less</span>
        {[0, 0.2, 0.4, 0.65, 0.9].map((v) => (
          <div
            key={v}
            className="size-2.5 rounded-sm"
            style={{
              background: v === 0 ? 'var(--ft-color-bg-surface-hover)' : `rgba(124,122,255,${v})`,
              border: '1px solid rgba(124,122,255,0.15)',
            }}
          />
        ))}
        <span className="text-[9px] text-text-disabled">More</span>
      </div>
    </div>
  );
}
