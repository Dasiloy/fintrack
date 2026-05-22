'use client';

import * as React from 'react';
import { ArchiveX, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { format } from '@fintrack/utils/date';

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
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  Skeleton,
  toast,
} from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { DrawerHeader } from '@/app/_components';
import type { Budget } from '@fintrack/types/protos/finance/budget';
import { useFormatCurrency } from '@/hooks/use_format_currency';

interface ArchivedBudgetsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ArchivedBudgetItem({
  budget,
  onRestore,
  onDelete,
  isRestoring,
}: {
  budget: Budget;
  onRestore: () => void;
  onDelete: () => void;
  isRestoring: boolean;
}) {
  const formatCurrency = useFormatCurrency();
  const color = budget.category?.color ?? '#7c7aff';
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
          <span className="text-text-tertiary truncate text-[11px]">
            {budget.category?.name ?? 'Uncategorised'}
          </span>
        </div>
        <p className="text-text-primary truncate text-[13px] font-medium">{budget.name}</p>
        <p className="text-text-disabled mt-0.5 text-[11px]">
          Inactive since {format(budget.deactivatedAt!, 'MMM YYYY')} ·{' '}
          {formatCurrency(budget.amount)}/mo
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" variant="outline" loading={isRestoring} onClick={onRestore}>
          <RefreshCw className="size-3" />
          Restore
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-error hover:bg-error/10"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ArchivedListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border-light px-5 py-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-2.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-2.5 w-28 rounded" />
          </div>
          <Skeleton className="h-7 w-20 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function ArchivedBudgetsSheet({
  open, onOpenChange }: ArchivedBudgetsSheetProps) {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const utils = api_client.useUtils();

  const { data, isLoading } = api_client.budget.getArchived.useQuery(undefined, {
    enabled: open,
  });
  const archived = data?.data?.budgets ?? [];

  const restoreMutation = api_client.budget.restore.useMutation({
    onSuccess: () => {
      toast.success('Budget restored');
      void utils.budget.getArchived.invalidate();
      void utils.budget.getAll.invalidate();
    },
    onError: (err) => toast.error('Failed to restore', { description: err.message }),
  });

  const deleteMutation = api_client.budget.delete.useMutation({
    onSuccess: () => {
      toast.success('Budget permanently deleted');
      void utils.budget.getArchived.invalidate();
      setConfirmDeleteId(null);
    },
    onError: (err) => toast.error('Failed to delete', { description: err.message }),
  });

  const confirmingBudget = archived.find((b) => b.id === confirmDeleteId);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          title="Archived Budgets"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DrawerHeader title="Archived Budgets" onClose={() => onOpenChange(false)} />

          <ScrollArea className="min-h-0 flex-1">
            {isLoading ? (
              <ArchivedListSkeleton />
            ) : archived.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <ArchiveX className="text-text-disabled size-10" />
                <p className="text-text-secondary text-[13px] font-medium">No archived budgets</p>
                <p className="text-text-disabled text-[11px] leading-snug">
                  Budgets you deactivate will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-border-light flex flex-col divide-y px-5 py-2">
                {archived.map((budget, i) => (
                  <React.Fragment key={budget.id}>
                    <ArchivedBudgetItem
                      budget={budget}
                      onRestore={() => restoreMutation.mutate({ id: budget.id })}
                      onDelete={() => setConfirmDeleteId(budget.id)}
                      isRestoring={
                        restoreMutation.isPending &&
                        restoreMutation.variables?.id === budget.id
                      }
                    />
                    {i < archived.length - 1 && <Separator className="bg-border-light" />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(v) => {
          if (!v) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10">
              <TriangleAlert className="size-6 text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete &quot;{confirmingBudget?.name ?? 'this budget'}&quot; permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All history entries will be erased. This cannot be undone. To keep the history,
              restore the budget instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() =>
                confirmDeleteId &&
                deleteMutation.mutate({ id: confirmDeleteId, hardDelete: true })
              }
            >
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
