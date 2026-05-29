'use client';

import * as React from 'react';
import { Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components';
import { cn } from '@ui/lib/utils';

import type { UnbudgetedCategory } from '@fintrack/types/protos/finance/budget';
import { useFormatCurrency } from '@/hooks/use_format_currency';

interface UnbudgetedCategoryCardProps {
  category: UnbudgetedCategory;
  onSetBudget: (categorySlug: string) => void;
  onEdit: (category: UnbudgetedCategory) => void;
  onDelete: (category: UnbudgetedCategory) => Promise<void>;
}

export function UnbudgetedCategoryCard({
  category,
  onSetBudget,
  onEdit,
  onDelete,
}: UnbudgetedCategoryCardProps) {
  const formatCurrency = useFormatCurrency();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const color = category.color ?? '#8b8b98';
  const showMenu = category.isUserOwned;

  console.log('showmenu', showMenu);

  return (
    <>
      <div className="border-border-light bg-bg-surface group flex flex-col rounded-xl border border-dashed p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
            <p className="text-text-primary truncate text-[13px] font-semibold">{category.name}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {showMenu && (
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'text-text-disabled hover:text-text-primary hover:bg-bg-surface-hover flex size-6 cursor-pointer items-center justify-center rounded transition-all duration-150 outline-none',
                      'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                    )}
                    aria-label={`Options for ${category.name}`}
                  >
                    <span className="flex flex-col items-center justify-center gap-[3px]">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="block size-[3px] rounded-full bg-current" />
                      ))}
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-36 rounded-md p-1.5">
                  <DropdownMenuItem
                    className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit!(category);
                    }}
                  >
                    <Pencil className="size-3.5 shrink-0" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="size-3.5 shrink-0" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              type="button"
              onClick={() => onSetBudget(category.slug)}
              className="bg-primary/10 text-primary hover:bg-primary/20 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
              aria-label={`Set budget for ${category.name}`}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Spend info */}
        <div className="mt-4 space-y-1">
          <p className="text-text-primary text-[15px] font-semibold tabular-nums">
            {formatCurrency(category.spent)}
          </p>
          <p className="text-text-tertiary text-[11px]">spent this month</p>
        </div>

        <p className="text-text-disabled mt-3 text-[11px] font-medium">No budget set</p>
      </div>

      {showMenu && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-warning/10">
                <TriangleAlert className="text-warning size-6" />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete &quot;{category.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This category will be permanently deleted. Transactions assigned to it will keep
                their data, but the category itself cannot be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                loading={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDelete!(category);
                    setConfirmOpen(false);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
