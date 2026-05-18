'use client';

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  Label,
  toast,
} from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { onlyNumbers } from '@fintrack/utils/format';
import { Usage } from '@fintrack/types/constants/plan.constants';

interface SplitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SplitFormDialog({ open, onOpenChange }: SplitFormDialogProps) {
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setName('');
      setAmount('');
    }
  }, [open]);

  const utils = api_client.useUtils();

  const mutation = api_client.split.create.useMutation({
    onSuccess: () => {
      toast.success('Split created');
      void utils.split.getAll.invalidate();
      void utils.split.getAggregate.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to create split', { description: err.message }),
  });

  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit = name.trim().length > 0 && parsedAmount > 0 && !mutation.isPending;

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({
      feature: Usage.MAX_ACTIVE_SPLITS,
      name: name.trim(),
      amount: parsedAmount,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Split</DialogTitle>
        </DialogHeader>

        <form id="split-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <Field>
            <Label>Split Name</Label>
            <Input
              placeholder="e.g. Team Dinner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field>
            <Label>Total Amount (₦)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(onlyNumbers(e.target.value))}
              required
            />
          </Field>
        </form>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="split-form"
            size="sm"
            loading={mutation.isPending}
            disabled={!canSubmit}
          >
            Create Split
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
