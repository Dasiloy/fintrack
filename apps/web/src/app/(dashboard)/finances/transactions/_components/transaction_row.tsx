import { TransactionSource } from '@fintrack/database/types';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import { format } from '@fintrack/utils/date';
import { capitalize, formatCurrency } from '@fintrack/utils/format';
import { cn } from '@ui/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components';
import { Edit2, Eye, MoreHorizontal, Trash2 } from 'lucide-react';

export interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionRow({
  transaction,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const expense = transaction.type;
  const recurring = transaction.source === TransactionSource.RECURRING;
  const time = format(transaction.date, 'h:mm a');
  const color = transaction.category?.color;
  const subtitleParts = [time, transaction.description].filter(Boolean);

  return (
    <div
      role="button"
      onClick={onSelect}
      className={cn(
        'group flex cursor-pointer items-center gap-4 px-5',
        'border-l-[3px] py-3.5 transition-colors duration-150',
        isSelected
          ? 'bg-bg-surface-hover border-primary'
          : 'hover:bg-bg-surface-hover/50 border-transparent',
      )}
    >
      {/* Name + subtitle — always visible, takes remaining space */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-text-primary truncate text-[14px] leading-5 font-medium">
            {transaction.merchant ?? transaction.description ?? 'Transaction'}
          </span>
          {recurring && (
            <span className="text-primary shrink-0 text-[11px] font-medium">Recurring</span>
          )}
        </div>
        {subtitleParts.length > 0 && (
          <p className="text-text-tertiary mt-0.5 truncate text-[12px] leading-4">
            {subtitleParts.join(' · ')}
          </p>
        )}
      </div>

      {/* Category — tablet+ */}
      <div className="hidden w-36 shrink-0 bg-red-500 sm:block">
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] leading-none font-medium"
          style={
            color
              ? {
                  background: `color-mix(in srgb, ${color} 12%, transparent)`,
                  borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                  color,
                }
              : {
                  background: 'var(--color-bg-surface-hover)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                }
          }
        >
          {transaction.category!.name}
        </span>
      </div>

      {/* Source — desktop+ */}
      <div className="hidden w-24 shrink-0 md:block">
        <span className="text-text-tertiary text-[12px]">{capitalize(transaction.source)}</span>
      </div>

      {/* Amount + menu — always visible */}
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            'text-[13px] font-semibold tracking-tight tabular-nums',
            expense ? 'text-error' : 'text-success',
          )}
        >
          {formatCurrency(parseFloat(transaction.amount))}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={cn(
                'flex size-6 cursor-pointer items-center justify-center rounded',
                'text-text-disabled hover:text-text-primary hover:bg-bg-surface',
                'transition-all duration-150 outline-none',
                'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              )}
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-md p-1.5">
            <DropdownMenuItem
              className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <Eye className="size-3.5 shrink-0" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="size-3.5 shrink-0" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="size-3.5 shrink-0" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
