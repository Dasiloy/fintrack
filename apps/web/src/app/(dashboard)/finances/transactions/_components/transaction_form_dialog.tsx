'use client';

import * as React from 'react';
import { format } from '@fintrack/utils/date';
import { CalendarIcon } from 'lucide-react';

import {
  Button,
  Calendar,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import type { Category } from '@fintrack/database/types';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  /** When provided, the dialog is in edit mode */
  transaction?: Transaction;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// TransactionFormDialog
// ---------------------------------------------------------------------------

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  transaction,
  onSuccess,
}: TransactionFormDialogProps) {
  const isEdit = !!transaction;

  const [amount, setAmount] = React.useState(
    transaction ? String(parseFloat(transaction.amount)) : '',
  );
  const [date, setDate] = React.useState<Date | undefined>(
    transaction ? new Date(transaction.date) : new Date(),
  );
  const [type, setType] = React.useState(transaction?.type ?? 'EXPENSE');
  const [categorySlug, setCategorySlug] = React.useState(transaction?.category?.slug ?? '');
  const [merchant, setMerchant] = React.useState(transaction?.merchant ?? '');
  const [description, setDescription] = React.useState(transaction?.description ?? '');

  // Reset state when transaction changes
  React.useEffect(() => {
    if (open) {
      setAmount(transaction ? String(parseFloat(transaction.amount)) : '');
      setDate(transaction ? new Date(transaction.date) : new Date());
      setType(transaction?.type ?? 'EXPENSE');
      setCategorySlug(transaction?.category?.slug ?? '');
      setMerchant(transaction?.merchant ?? '');
      setDescription(transaction?.description ?? '');
    }
  }, [open, transaction]);

  const utils = api_client.useUtils();

  const createMutation = api_client.transaction.create.useMutation({
    onSuccess: () => {
      toast.success('Transaction created');
      utils.transaction.getAll.invalidate();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Error', { description: err.message }),
  });

  const updateMutation = api_client.transaction.update.useMutation({
    onSuccess: () => {
      toast.success('Transaction updated');
      utils.transaction.getAll.invalidate();
      utils.transaction.getById.invalidate({ id: transaction!.id });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Error', { description: err.message }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !categorySlug || !amount) return;

    if (isEdit) {
      updateMutation.mutate({
        id: transaction.id,
        amount: parseFloat(amount),
        date: format(date, 'YYYY-MM-DD'),
        type: type as 'INCOME' | 'EXPENSE',
        categorySlug,
        merchant: merchant || undefined,
        description: description || undefined,
      });
    } else {
      createMutation.mutate({
        amount: parseFloat(amount),
        date: format(date, 'YYYY-MM-DD'),
        type: type as 'INCOME' | 'EXPENSE',
        source: 'MANUAL',
        sourceId: 'manual',
        categorySlug,
        merchant: merchant || undefined,
        description: description || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount + Type row */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
            <Field>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Category */}
          <Field>
            <Label>Category</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Date */}
          <Field>
            <Label>Date</Label>
            <AnchoredPopover
              modal={false}
              contentClassName="w-auto p-0"
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-text-tertiary',
                  )}
                >
                  <CalendarIcon className="size-4" />
                  {date ? format(date, 'MMMM D, YYYY') : 'Pick a date'}
                </Button>
              }
            >
              <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} />
            </AnchoredPopover>
          </Field>

          {/* Merchant */}
          <Field>
            <Label>Merchant</Label>
            <Input
              placeholder="e.g. Shoprite, Netflix"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
          </Field>

          {/* Description */}
          <Field>
            <Label>Description</Label>
            <Input
              placeholder="Optional note"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <DialogFooter showCloseButton>
            <Button type="submit" loading={isPending} disabled={!amount || !categorySlug || !date}>
              {isEdit ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
