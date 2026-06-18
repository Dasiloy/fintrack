'use client';

import * as React from 'react';
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
import { api_client } from '@/lib/trpc_app/api_client';
import { onlyNumbers } from '@fintrack/utils/format';
import { format } from '@fintrack/utils/date';
import { Usage } from '@fintrack/types/constants/plan.constants';

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalFormDialog({ open, onOpenChange }: GoalFormDialogProps) {
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [targetDate, setTargetDate] = React.useState<Date | undefined>();
  const [dateOpen, setDateOpen] = React.useState(false);
  const [priority, setPriority] = React.useState('MEDIUM');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setName('');
      setAmount('');
      setTargetDate(undefined);
      setPriority('MEDIUM');
      setDescription('');
    }
  }, [open]);

  const utils = api_client.useUtils();

  const mutation = api_client.goal.create.useMutation({
    onSuccess: () => {
      toast.success('Goal created');
      void utils.goal.getAll.invalidate();
      void utils.goal.getAggregate.invalidate();
      void utils.subscription.getGatedUsage.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to create goal', { description: err.message }),
  });

  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit =
    name.trim().length > 0 && parsedAmount > 0 && !!targetDate && !mutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !targetDate) return;
    mutation.mutate({
      feature: Usage.MAX_GOALS,
      name: name.trim(),
      targetAmount: parsedAmount,
      targetDate: format(targetDate, 'YYYY-MM-DD'),
      priority: priority as 'LOW' | 'MEDIUM' | 'HIGH',
      description: description.trim() || undefined,
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Goal</DialogTitle>
        </DialogHeader>

        <form id="goal-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Name */}
          <Field>
            <Label>Goal Name</Label>
            <Input
              placeholder="e.g. Emergency Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          {/* Target Amount */}
          <Field>
            <Label>Target Amount (₦)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(onlyNumbers(e.target.value))}
              required
            />
          </Field>

          {/* Target Date */}
          <Field>
            <Label>Target Date</Label>
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
                  {targetDate ? format(targetDate, 'MMMM D, YYYY') : 'Pick a date'}
                </Button>
              }
            >
              <Calendar
                mode="single"
                selected={targetDate}
                onSelect={(d) => {
                  if (d) setTargetDate(d);
                  setDateOpen(false);
                }}
                defaultMonth={targetDate ?? today}
                disabled={(d) => d <= today}
              />
            </AnchoredPopover>
          </Field>

          {/* Priority */}
          <Field>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Description */}
          <Field>
            <Label>
              Description <span className="text-text-disabled font-normal">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. 6-month safety net"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </form>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="goal-form"
            size="sm"
            loading={mutation.isPending}
            disabled={!canSubmit}
          >
            Create Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
