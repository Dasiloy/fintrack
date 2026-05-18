'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from '@fintrack/utils/date';
import { onlyNumbers } from '@fintrack/utils/format';
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
import type { Category } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { api_client } from '@/lib/trpc_app/api_client';
import { MerchantSelector } from '@/app/_components';
import { FREQUENCIES } from '../helpers';

interface BillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess?: () => void;
}

export function BillFormDialog({ open, onOpenChange, categories, onSuccess }: BillFormDialogProps) {
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [type, setType] = React.useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [frequency, setFrequency] = React.useState('MONTHLY');
  const [categorySlug, setCategorySlug] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [merchant, setMerchant] = React.useState('');
  const [description, setDescription] = React.useState('');

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setName('');
      setAmount('');
      setType('EXPENSE');
      setFrequency('MONTHLY');
      setCategorySlug('');
      setStartDate(new Date());
      setEndDate(undefined);
      setMerchant('');
      setDescription('');
    }
  }, [open]);

  const utils = api_client.useUtils();

  const createMutation = api_client.recurring.create.useMutation({
    onSuccess: () => {
      toast.success('Bill created');
      void utils.recurring.getAll.invalidate();
      void utils.recurring.getSummary.invalidate();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to create bill', { description: err.message }),
  });

  const canSubmit = !!name && !!amount && !!categorySlug && !!startDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    createMutation.mutate({
      feature: Usage.MAX_RECURRING_ITEMS,
      name,
      amount: parseFloat(amount),
      type,
      frequency: frequency as any,
      categorySlug,
      startDate: format(startDate, 'YYYY-MM-DD'),
      endDate: endDate ? format(endDate, 'YYYY-MM-DD') : undefined,
      merchant: merchant || undefined,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bill</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['EXPENSE', 'INCOME'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg border py-2 text-[12px] font-medium transition-all',
                  type === t
                    ? t === 'INCOME'
                      ? 'bg-success/10 border-success/25 text-success'
                      : 'bg-error/10 border-error/25 text-error'
                    : 'border-border-light text-text-secondary hover:border-border-light',
                )}
              >
                {t === 'INCOME' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>

          {/* Name + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <Field className="col-span-2 sm:col-span-1">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Netflix, Rent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field className="col-span-2 sm:col-span-1">
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
          </div>

          {/* Frequency + Category */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger size="default" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <Label>Category</Label>
              <Select value={categorySlug} onValueChange={setCategorySlug}>
                <SelectTrigger size="default" className="w-full">
                  <SelectValue placeholder="Select" />
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
          </div>

          {/* Start date + End date */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Start date</Label>
              <AnchoredPopover
                modal={false}
                contentClassName="w-auto p-0"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="size-4" />
                    {format(startDate, 'MMM D, YYYY')}
                  </Button>
                }
              >
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  defaultMonth={startDate}
                />
              </AnchoredPopover>
            </Field>
            <Field>
              <Label>
                End date <span className="text-text-disabled font-normal">(optional)</span>
              </Label>
              <AnchoredPopover
                modal={false}
                contentClassName="w-auto p-0"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-text-tertiary',
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {endDate ? format(endDate, 'MMM D, YYYY') : 'No end date'}
                  </Button>
                }
              >
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  defaultMonth={endDate ?? startDate}
                  disabled={(d) => d < startDate}
                />
              </AnchoredPopover>
            </Field>
          </div>

          {/* Merchant */}
          <Field>
            <Label>
              Merchant <span className="text-text-disabled font-normal">(optional)</span>
            </Label>
            <MerchantSelector value={merchant} onChange={setMerchant} />
          </Field>

          {/* Description */}
          <Field>
            <Label>
              Description <span className="text-text-disabled font-normal">(optional)</span>
            </Label>
            <Input
              placeholder="Short note"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <DialogFooter showCloseButton>
            <Button type="submit" loading={createMutation.isPending} disabled={!canSubmit}>
              Add Bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
