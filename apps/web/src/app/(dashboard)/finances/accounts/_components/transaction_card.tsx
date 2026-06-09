'use client';

import { useFormatCurrency } from '@/hooks/use_format_currency';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import { format } from '@fintrack/utils/date';
import { cn } from '@ui/lib/utils';

export function TransactionMiniCard({ transaction }: { transaction: Transaction }) {
  const formatCurrency = useFormatCurrency();
  const isExpense = transaction.type === 'EXPENSE';
  const color = transaction.category?.color;

  return (
    <div className="bg-bg-surface shadow-card overflow-hidden rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-text-primary truncate text-[12px] font-medium">
            {transaction.merchant ?? transaction.description ?? 'Transaction'}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {transaction.category && (
              <span
                className="rounded-full border px-1.5 py-px text-[10px] font-medium"
                style={
                  color
                    ? {
                        background: `color-mix(in srgb, ${color} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                        color,
                      }
                    : {}
                }
              >
                {transaction.category.name}
              </span>
            )}
            <span className="text-text-disabled text-[10px]">
              {format(transaction.date, 'MMM D, YYYY')}
            </span>
          </div>
        </div>

        <span
          className={cn(
            'shrink-0 text-[12px] font-semibold tabular-nums',
            isExpense ? 'text-error' : 'text-success',
          )}
        >
          {isExpense ? '-' : '+'}
          {formatCurrency(parseFloat(transaction.amount))}
        </span>
      </div>
    </div>
  );
}
