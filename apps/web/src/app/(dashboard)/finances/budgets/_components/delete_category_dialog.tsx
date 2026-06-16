'use client';

import * as React from 'react';
import { ArrowDownUp, ArrowRight, FolderInput, TriangleAlert } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { MISC_CATEGORY_SLUG } from '@fintrack/types/constants/category.constants';
import type { UnbudgetedCategory } from '@fintrack/types/protos/finance/budget';

interface DeleteCategoryDialogProps {
  /** The user-owned category being deleted. Null when the flow is closed. */
  category: UnbudgetedCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Performs the delete. When the category has linked items, `switchCatSlug` is
   * the category to reassign them to before deletion.
   */
  onDelete: (category: UnbudgetedCategory, switchCatSlug?: string) => Promise<void>;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  onDelete,
}: DeleteCategoryDialogProps) {
  const [step, setStep] = React.useState<'confirm' | 'swap'>('confirm');
  // The user has clicked Delete and we're waiting on the linked-items count.
  const [pending, setPending] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [targetSlug, setTargetSlug] = React.useState(MISC_CATEGORY_SLUG);

  // ── Linked-items count ──────────────────────────────────────────────────
  // Triggered as soon as the dialog opens. Keyed by slug (no cross-category
  // caching) and always refetched so the count is never stale.
  const countQuery = api_client.category.getLinkedItemsCount.useQuery(
    { slug: category?.slug ?? '' },
    {
      enabled: open && !!category?.slug,
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always',
    },
  );
  const counts = countQuery.data?.data;
  const totalLinked = counts ? counts.transactions + counts.budgets + counts.recurringItems : 0;

  // All categories for the reassignment picker.
  const categoriesQuery = api_client.category.getAll.useQuery(undefined, { enabled: open });
  const categories = categoriesQuery.data?.data ?? [];

  // Reset transient state whenever the dialog (re)opens for a category.
  React.useEffect(() => {
    if (open) {
      setStep('confirm');
      setPending(false);
      setIsDeleting(false);
    }
  }, [open, category?.slug]);

  const close = () => onOpenChange(false);

  const runDelete = React.useCallback(async () => {
    if (!category) return;
    setIsDeleting(true);
    try {
      await onDelete(category);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
      setPending(false);
    }
  }, [category, onDelete, onOpenChange]);

  // Once the user has committed to deleting, act on the count as soon as it
  // settles: no linked items → delete straight away; otherwise → reassignment.
  React.useEffect(() => {
    if (!pending) return;
    if (countQuery.isLoading || countQuery.isFetching) return;

    if (countQuery.isError) {
      toast.error('Could not check category usage', {
        description: 'Please try again in a moment.',
      });
      setPending(false);
      return;
    }

    if (!counts) return;

    if (totalLinked === 0) {
      void runDelete();
    } else {
      // Default the target to Miscellaneous, falling back to any other category.
      const fallback =
        categories.find((c) => c.slug === MISC_CATEGORY_SLUG && c.slug !== category?.slug)?.slug ??
        categories.find((c) => c.slug !== category?.slug)?.slug ??
        MISC_CATEGORY_SLUG;
      setTargetSlug(fallback);
      setPending(false);
      setStep('swap');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, countQuery.isLoading, countQuery.isFetching, countQuery.isError, counts]);

  const handleReassign = async () => {
    if (!category) return;
    if (targetSlug === category.slug) {
      toast.error('Pick a different category', {
        description: 'Items must move to a category other than the one being deleted.',
      });
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(category, targetSlug);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!category) return null;

  const targetCategory = categories.find((c) => c.slug === targetSlug);

  return (
    <>
      {/* ── Step 1: confirm ── */}
      <AlertDialog
        open={open && step === 'confirm'}
        onOpenChange={(v) => {
          if (!v && !pending && !isDeleting) close();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              <TriangleAlert className="text-warning size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete &quot;{category.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This category will be permanently deleted. If any transactions, budgets, or recurring
              items use it, you&apos;ll choose where to move them next.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending || isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={pending || isDeleting}
              onClick={() => setPending(true)}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Step 2: reassign linked items ── */}
      <Dialog
        open={open && step === 'swap'}
        onOpenChange={(v) => {
          if (!v && !isDeleting) close();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move items before deleting</DialogTitle>
            <DialogDescription>
              &quot;{category.name}&quot; is still in use. Choose a category to move its items to —
              then it will be safe to delete.
            </DialogDescription>
          </DialogHeader>

          {/* Usage summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Transactions', value: counts?.transactions ?? 0 },
              { label: 'Budgets', value: counts?.budgets ?? 0 },
              { label: 'Recurring', value: counts?.recurringItems ?? 0 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border-border-light bg-bg-surface flex flex-col items-center gap-0.5 rounded-lg border px-2 py-3"
              >
                <span className="text-text-primary text-[18px] leading-none font-semibold tabular-nums">
                  {stat.value}
                </span>
                <span className="text-text-tertiary text-[11px]">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* From → To pickers */}
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-end">
            <Field className="flex-1">
              <Label>From</Label>
              <Select value={category.slug} disabled>
                <SelectTrigger size="default" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={category.slug}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: category.color || '#8b8b98' }}
                      />
                      {category.name}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <ArrowRight className="text-text-disabled mb-2.5 hidden size-4 shrink-0 md:block" />

            <Field className="flex-1 mt-2.5">
              <Label>Move to</Label>
              <Select value={targetSlug} onValueChange={setTargetSlug}>
                <SelectTrigger size="default" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: cat.color || '#8b8b98' }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <DialogFooter showCloseButton>
            <Button
              onClick={handleReassign}
              loading={isDeleting}
              disabled={isDeleting}
              className="gap-2"
            >
              <FolderInput className="size-3.5" />
              Move to {targetCategory?.name ?? 'category'} &amp; delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
