'use client';

import * as React from 'react';
import { MoreHorizontal, Pencil, Trash2, TriangleAlert, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { formatCurrency } from '@fintrack/utils/format';
import { format } from '@fintrack/utils/date';
import type { Split } from '@fintrack/types/protos/finance/split';
import { progressBarColor, statusLabel, statusVariant } from '../helpers';

interface SplitCardProps {
  split: Split;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
}

export function SplitCard({ split, onOpen, onEdit }: SplitCardProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const utils = api_client.useUtils();

  const deleteMutation = api_client.split.delete.useMutation({
    onSuccess: () => {
      toast.success('Split deleted');
      void utils.split.getAll.invalidate();
      void utils.split.getAggregate.invalidate();
    },
    onError: (err) => toast.error('Failed to delete split', { description: err.message }),
  });

  const totalPaid = split.totalPaid ?? 0;
  const amount = split.amount;
  const totalOwed = split.totalOwed ?? amount - totalPaid;
  const pct = amount > 0 ? Math.min(Math.round((totalPaid / amount) * 100), 100) : 0;

  return (
    <>
      <div
        role="button"
        onClick={() => onOpen(split.id)}
        className="border-border-subtle bg-bg-surface group focus-visible:ring-primary/40 relative flex cursor-pointer flex-col gap-0 rounded-xl border transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2 p-4 pb-3">
          <div className="min-w-0 flex-1">
            <p className="text-text-primary truncate text-[13px] leading-tight font-semibold">
              {split.name}
            </p>
            <p className="text-text-tertiary mt-0.5 text-[11px]">
              {format(new Date(split.createdAt), 'MMM D, YYYY')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant={statusVariant(split.status)} className="text-[10px]">
              {statusLabel(split.status)}
            </Badge>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="px-4 pb-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-text-primary text-[18px] font-bold tabular-nums">
              {formatCurrency(totalPaid)}
            </span>
            <span className="text-text-tertiary text-[11px] tabular-nums">
              {formatCurrency(amount)}
            </span>
          </div>
          <div className="bg-border-light h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn('h-full rounded-full transition-all', progressBarColor(split.status))}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-text-tertiary mt-1.5 text-[11px]">
            {pct}% · {formatCurrency(totalOwed)} remaining
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="border-border-light flex items-center justify-between border-t px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="text-text-disabled size-3" />
            <span className="text-text-tertiary text-[11px]">
              {split.participants.length} participant{split.participants.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Context menu — stop propagation so card click doesn't open drawer */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="text-text-disabled hover:text-text-primary hover:bg-bg-surface-hover -mr-1 flex size-6 items-center justify-center rounded transition-colors"
                aria-label="Split options"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 rounded-md p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                onClick={() => {
                  setMenuOpen(false);
                  onOpen(split.id);
                }}
              >
                <Users className="size-3.5 shrink-0" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(split.id);
                }}
              >
                <Pencil className="size-3.5 shrink-0" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px] text-error focus:text-error focus:bg-error/10"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="size-3.5 shrink-0" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10">
              <TriangleAlert className="size-6 text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete &quot;{split.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This split and all its participants and settlement records will be permanently deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id: split.id })}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
