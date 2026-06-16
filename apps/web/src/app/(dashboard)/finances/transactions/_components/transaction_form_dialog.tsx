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
import { isForcedIncomeCategory } from '@fintrack/types/constants/category.constants';
import { genTransactionSourceId, onlyNumbers } from '@fintrack/utils/format';
import { MerchantSelector } from '@/app/_components';

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess?: () => void;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: TransactionFormDialogProps) {
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [categorySlug, setCategorySlug] = React.useState('');
  const [type, setType] = React.useState<'' | 'INCOME' | 'EXPENSE'>('');
  const [merchant, setMerchant] = React.useState('');
  const [description, setDescription] = React.useState('');

  // Forced-income categories (Income, Savings & Investments) lock the type to
  // INCOME. Every other category defaults to EXPENSE but stays user-editable.
  const typeLocked = isForcedIncomeCategory(categorySlug);

  // Picking a category (re)defaults the type synchronously: forced-income →
  // INCOME (locked), anything else → EXPENSE (still switchable by the user).
  const onCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    setType(isForcedIncomeCategory(slug) ? 'INCOME' : 'EXPENSE');
  };

  // Reset state each time the dialog opens
  React.useEffect(() => {
    if (open) {
      setAmount('');
      setDate(new Date());
      setCategorySlug('');
      setType('');
      setMerchant('');
      setDescription('');
    }
  }, [open]);

  const utils = api_client.useUtils();

  const createMutation = api_client.transaction.create.useMutation({
    onSuccess: () => {
      toast.success('Transaction created');
      void utils.transaction.getAll.invalidate();
      void utils.transaction.getSummary.invalidate();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Error', { description: err.message }),
  });

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!date || !categorySlug || !amount || !type) {
      toast('Incomplete data! Please check your input.');
      return;
    }

    createMutation.mutate({
      amount: parseFloat(amount),
      date: format(date, 'YYYY-MM-DD'),
      type,
      source: 'MANUAL',
      sourceId: genTransactionSourceId(new Date()),
      categorySlug,
      merchant: merchant || undefined,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <Label>Amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(onlyNumbers(e.target.value))}
              required
            />
          </Field>

          {/* Category */}
          <Field>
            <Label>Category</Label>
            <Select value={categorySlug} onValueChange={onCategoryChange}>
              <SelectTrigger size="sm" className="w-full">
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

          <Field>
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as 'INCOME' | 'EXPENSE')}
              disabled={typeLocked || !categorySlug}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="Select a category first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
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
            <MerchantSelector value={merchant} onChange={setMerchant} />
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
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!amount || !categorySlug || !date}
            >
              Add Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
