'use client';

import * as React from 'react';
import { CalendarIcon, RotateCcw } from 'lucide-react';
import {
  Button,
  Calendar,
  Field,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { onlyNumbers } from '@fintrack/utils/format';
import { format } from '@fintrack/utils/date';
import type { ExtractedData } from './scan_stepper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const genSourceId = () => `trnx_${Math.random().toString(36).slice(2, 10)}`;

// ---------------------------------------------------------------------------
// ReviewStep
// ---------------------------------------------------------------------------

interface ReviewStepProps {
  initialData: ExtractedData;
  onSuccess: () => void;
  onStartOver: () => void;
}

export function ReviewStep({ initialData, onSuccess, onStartOver }: ReviewStepProps) {
  const [amount, setAmount] = React.useState(initialData.amount);
  const [type, setType] = React.useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [categorySlug, setCategorySlug] = React.useState(initialData.categorySlug);
  const [merchant, setMerchant] = React.useState(initialData.merchant);
  const [description, setDescription] = React.useState(initialData.description);
  const [date, setDate] = React.useState<Date | undefined>(
    initialData.date ? new Date(initialData.date) : new Date(),
  );
  const [dateOpen, setDateOpen] = React.useState(false);

  const { data: catData, isLoading: catsLoading } = api_client.category.getAll.useQuery();
  const categories = catData?.data ?? [];

  const utils = api_client.useUtils();
  const createMutation = api_client.transaction.create.useMutation({
    onSuccess: () => {
      toast.success('Transaction added');
      utils.transaction.getAll.invalidate();
      onSuccess();
    },
    onError: (err) => toast.error('Failed to save', { description: err.message }),
  });

  const canSubmit = !!amount && !!categorySlug && !!date && !createMutation.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !categorySlug || !amount) return;

    createMutation.mutate({
      amount: parseFloat(amount),
      date: format(date, 'YYYY-MM-DD'),
      type,
      source: 'MANUAL',
      sourceId: genSourceId(),
      categorySlug,
      merchant: merchant || undefined,
      description: description || undefined,
    });
  };

  return (
    <div className="w-full max-w-[440px]">
      <div className="glass-card rounded-card p-5">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-text-primary text-[17px] font-semibold">Review & Confirm</h2>
          <p className="text-text-tertiary mt-0.5 text-[13px]">
            Check the details below and fill in anything missing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount + Type */}
          <div className="grid grid-cols-2 gap-3">
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
            <Field>
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as 'INCOME' | 'EXPENSE')}
              >
                <SelectTrigger size="default" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Category */}
          <Field>
            <Label>Category</Label>
            {catsLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <Select value={categorySlug} onValueChange={setCategorySlug}>
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
            )}
          </Field>

          {/* Date */}
          <Field>
            <Label>Date</Label>
            <AnchoredPopover
              open={dateOpen}
              onOpenChange={setDateOpen}
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
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setDateOpen(false);
                }}
                defaultMonth={date}
              />
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

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onStartOver}
              className="text-text-tertiary gap-1.5 hover:text-text-secondary"
            >
              <RotateCcw className="size-3" />
              Start over
            </Button>
            <Button type="submit" loading={createMutation.isPending} disabled={!canSubmit}>
              Add Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
