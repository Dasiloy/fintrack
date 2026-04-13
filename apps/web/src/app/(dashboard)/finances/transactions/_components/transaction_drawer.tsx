'use client';

import * as React from 'react';
import { format } from '@fintrack/utils/date';
import { Edit2, FileImage, Tag, Trash2, X } from 'lucide-react';

import {
  Badge,
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  toast,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import type { Category } from '@fintrack/database/types';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import { TransactionFormDialog } from './transaction_form_dialog';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(amount: string, type: string) {
  const n = parseFloat(amount);
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
  return `₦${formatted}`;
}

function formatDateTime(date: string, createdAt?: string) {
  try {
    const d = new Date(date);
    const dateStr = format(d, 'MMM d, yyyy');
    const timeStr = createdAt ? format(new Date(createdAt), 'HH:mm') : '';
    return timeStr ? `${dateStr} • ${timeStr}` : dateStr;
  } catch {
    return date;
  }
}

// ---------------------------------------------------------------------------
// DetailRow
// ---------------------------------------------------------------------------

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-body-sm text-text-tertiary">{label}</span>
      <div className="text-body-sm text-text-primary text-right font-medium">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TransactionDrawer
// ---------------------------------------------------------------------------

interface TransactionDrawerProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onDeleted?: () => void;
}

export function TransactionDrawer({
  transactionId,
  open,
  onOpenChange,
  categories,
  onDeleted,
}: TransactionDrawerProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingNotes, setEditingNotes] = React.useState(false);
  const [notesValue, setNotesValue] = React.useState('');
  const [newTag, setNewTag] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);

  const { data, isLoading } = api_client.transaction.getById.useQuery(
    { id: transactionId! },
    { enabled: !!transactionId && open },
  );

  const transaction = data?.data;

  // Sync notes and tags from transaction
  React.useEffect(() => {
    if (transaction) {
      setNotesValue(transaction.notes ?? '');
      // Tags are stored locally for now (not in proto)
      setTags([]);
    }
  }, [transaction]);

  const utils = api_client.useUtils();

  const deleteMutation = api_client.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success('Transaction deleted');
      utils.transaction.getAll.invalidate();
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (err) => toast.error('Error', { description: err.message }),
  });

  const handleDelete = () => {
    if (!transaction) return;
    deleteMutation.mutate({ id: transaction.id });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const isExpense = transaction?.type === 'EXPENSE' || transaction?.type === '1';
  const isIncome = transaction?.type === 'INCOME' || transaction?.type === '0';
  const bankName = transaction?.bank?.bankName;
  const accountName = transaction?.bank?.accountName;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-border-subtle border-b px-6 pt-6 pb-4">
            <SheetTitle>Transaction Details</SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 px-6 py-8">
                <Skeleton className="size-16 rounded-2xl" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-9 w-40" />
              </div>
            ) : !transaction ? (
              <div className="text-text-tertiary text-body-sm flex h-40 items-center justify-center">
                Transaction not found
              </div>
            ) : (
              <div className="flex flex-col gap-0 px-6 py-6">
                {/* ── Merchant / icon / amount hero ── */}
                <div className="flex flex-col items-center gap-2 pb-6">
                  {/* Icon */}
                  <div className="bg-bg-surface-hover flex size-16 items-center justify-center rounded-2xl text-2xl">
                    {transaction.category?.icon || '💳'}
                  </div>

                  {/* Name + category */}
                  <div className="text-center">
                    <h2 className="text-h4 text-text-primary font-semibold">
                      {transaction.merchant ?? transaction.description ?? 'Transaction'}
                    </h2>
                    <p className="text-body-sm text-text-tertiary mt-0.5">
                      {transaction.category?.name ?? '—'}
                    </p>
                  </div>

                  {/* Amount */}
                  <p
                    className={cn(
                      'mt-1 text-2xl font-bold',
                      isExpense ? 'text-error' : 'text-success',
                    )}
                  >
                    {isExpense ? '—' : '+'}
                    {formatAmount(transaction.amount, transaction.type)}
                  </p>
                </div>

                <Separator className="bg-border-subtle" />

                {/* ── Details ── */}
                <div className="divide-border-subtle divide-y">
                  <DetailRow label="Status">
                    <Badge
                      variant={transaction.bankTransactionStatus === 'FAILED' ? 'error' : 'success'}
                      dot
                    >
                      {transaction.bankTransactionStatus ?? 'Completed'}
                    </Badge>
                  </DetailRow>

                  <DetailRow label="Date & Time">
                    {formatDateTime(transaction.date, transaction.createdAt)}
                  </DetailRow>

                  {(bankName || accountName) && (
                    <DetailRow label="Account">
                      <span className="flex items-center gap-1.5">
                        <span className="bg-primary/20 text-primary flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                          {(bankName ?? accountName ?? 'B')[0]}
                        </span>
                        {accountName ?? bankName}
                      </span>
                    </DetailRow>
                  )}

                  {transaction.source && (
                    <DetailRow label="Source">
                      <Badge variant="secondary">{transaction.source}</Badge>
                    </DetailRow>
                  )}

                  {transaction.split && (
                    <DetailRow label="Split">{transaction.split.name}</DetailRow>
                  )}
                </div>

                <Separator className="bg-border-subtle" />

                {/* ── Notes ── */}
                <div className="py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-caption text-text-tertiary font-medium tracking-wider uppercase">
                      Notes
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-primary h-auto px-2 py-1"
                      onClick={() => setEditingNotes((v) => !v)}
                    >
                      <Edit2 className="size-3" />
                      {editingNotes ? 'Done' : 'Edit'}
                    </Button>
                  </div>

                  {editingNotes ? (
                    <textarea
                      className="rounded-button border-border-subtle bg-bg-surface text-body text-text-primary placeholder:text-text-tertiary focus-visible:border-primary/30 focus-visible:ring-primary/50 duration-smooth w-full resize-none border px-3 py-2 transition-all outline-none focus-visible:ring-2"
                      rows={3}
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add notes about this transaction…"
                    />
                  ) : (
                    <p className="text-body-sm text-text-secondary rounded-button bg-bg-surface border-border-subtle min-h-[60px] border px-3 py-2">
                      {notesValue || (
                        <span className="text-text-tertiary italic">No notes yet</span>
                      )}
                    </p>
                  )}
                </div>

                {/* ── Tags ── */}
                <div className="py-4">
                  <div className="mb-2 flex items-center gap-1">
                    <Tag className="text-text-tertiary size-3" />
                    <span className="text-caption text-text-tertiary font-medium tracking-wider uppercase">
                      Tags
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="border-border-subtle bg-bg-surface text-caption text-text-secondary inline-flex items-center gap-1 rounded-full border px-2.5 py-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-text-tertiary hover:text-text-primary transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}

                    <input
                      type="text"
                      placeholder="+ Add Tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="border-border-light text-caption text-text-tertiary placeholder:text-text-disabled focus:border-primary/40 inline-flex w-24 min-w-0 items-center gap-1 rounded-full border border-dashed bg-transparent px-2.5 py-1 transition-colors focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* ── Footer actions ── */}
          {transaction && (
            <div className="border-border-subtle flex gap-3 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditOpen(true)}
              >
                <Edit2 className="size-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-text-secondary flex-1"
                onClick={() => toast.info('Receipt upload coming soon')}
              >
                <FileImage className="size-4" />
                Add Receipt
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                loading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {transaction && (
        <TransactionFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          categories={categories}
          transaction={transaction}
          onSuccess={() => {
            utils.transaction.getById.invalidate({ id: transaction.id });
          }}
        />
      )}
    </>
  );
}
