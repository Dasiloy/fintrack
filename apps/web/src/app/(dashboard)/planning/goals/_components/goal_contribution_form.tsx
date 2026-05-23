'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import {
  Button,
  Calendar,
  Field,
  Input,
  Label,
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { onlyNumbers } from '@fintrack/utils/format';
import { format } from '@fintrack/utils/date';
import { useFormatCurrency } from '@/hooks/use_format_currency';

interface GoalContributionFormProps {
  goalId: string;
  remainingAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function GoalContributionForm({
  goalId,
  remainingAmount,
  onSuccess,
  onCancel,
}: GoalContributionFormProps) {
  const formatCurrency = useFormatCurrency();
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState<Date>(new Date());
  const [dateOpen, setDateOpen] = React.useState(false);
  const [description, setDescription] = React.useState('');

  const utils = api_client.useUtils();

  const mutation = api_client.goal.createContribution.useMutation({
    onSuccess: () => {
      toast.success('Contribution added');
      void utils.goal.getAll.invalidate();
      void utils.goal.getById.invalidate({ id: goalId });
      void utils.goal.getAggregate.invalidate();
      onSuccess();
    },
    onError: (err) => toast.error('Failed to add contribution', { description: err.message }),
  });

  const parsedAmount = parseFloat(amount) || 0;
  const exceedsRemaining = remainingAmount > 0 && parsedAmount > remainingAmount;
  const canSubmit = parsedAmount > 0 && !exceedsRemaining && !mutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({
      goalId,
      amount: parsedAmount,
      date: format(date, 'YYYY-MM-DD'),
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Amount */}
      <Field>
        <div className="flex items-center justify-between">
          <Label>Amount (₦)</Label>
          {remainingAmount > 0 && (
            <span className="text-text-disabled text-[10px]">
              max {formatCurrency(remainingAmount)}
            </span>
          )}
        </div>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(onlyNumbers(e.target.value))}
          required
        />
        {exceedsRemaining && (
          <p className="text-error text-[11px]">
            Amount exceeds remaining balance of {formatCurrency(remainingAmount)}
          </p>
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
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="size-4" />
              {format(date, 'MMMM D, YYYY')}
            </Button>
          }
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) setDate(d);
              setDateOpen(false);
            }}
            defaultMonth={date}
            disabled={(d) => d > new Date()}
          />
        </AnchoredPopover>
      </Field>

      {/* Description */}
      <Field>
        <Label>
          Description{' '}
          <span className="text-text-disabled font-normal">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. Monthly top-up"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className={cn('flex gap-2 pt-1')}>
        <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="flex-1" loading={mutation.isPending} disabled={!canSubmit}>
          Add Funds
        </Button>
      </div>
    </form>
  );
}
