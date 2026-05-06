'use client';

import * as React from 'react';
import { onlyNumbers } from '@fintrack/utils/format';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  toast,
} from '@ui/components';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { api_client } from '@/lib/trpc_app/api_client';
import { BudgetPeriod, PERIOD_OPTIONS } from '@/app/(dashboard)/finances/budgets/types';

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: Date;
  prefilledCategoryId?: string;
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  selectedMonth,
  prefilledCategoryId,
}: BudgetFormDialogProps) {
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [categorySlug, setCategorySlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [alertThresholdPct, setAlertThresholdPct] = React.useState(80);
  const [alertAtFrequency, setAlertAtFrequency] = React.useState(2);

  const { data: categoryData } = api_client.category.getAll.useQuery();
  const categories = categoryData?.data ?? [];

  React.useEffect(() => {
    if (!open) return;
    setName('');
    setAmount('');
    setCategorySlug('');
    setDescription('');
    setAlertThresholdPct(80);
    setAlertAtFrequency(2);
  }, [open]);

  React.useEffect(() => {
    if (prefilledCategoryId && categories.length > 0) {
      const cat = categories.find((c: any) => c.slug === prefilledCategoryId);
      if (cat) setCategorySlug((cat as any).slug ?? '');
    }
  }, [prefilledCategoryId, categories]);

  const utils = api_client.useUtils();

  const createMutation = api_client.budget.create.useMutation({
    onSuccess: () => {
      toast.success('Budget created');
      void utils.budget.getAll.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to create budget', { description: err.message }),
  });

  const canSubmit = !!name && !!amount && !!categorySlug;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    createMutation.mutate({
      feature: Usage.MAX_BUDGETS,
      name,
      amount: parseFloat(amount),
      categorySlug,
      period: BudgetPeriod.MONTHLY,
      month: selectedMonth.getMonth(),
      year: selectedMonth.getFullYear(),
      description: description || undefined,
      alertThreshold: alertThresholdPct / 100,
      alertAtFrequency,
    });
  };

  const categoryLocked = !!prefilledCategoryId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Budget</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <Label>Name</Label>
            <Input
              placeholder="e.g. Groceries, Transport"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Category</Label>
              <Select
                value={categorySlug}
                onValueChange={setCategorySlug}
                disabled={categoryLocked}
              >
                <SelectTrigger size="default" className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Label>Amount (₦)</Label>
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

          {/* Period — MONTHLY only in V1 */}
          <Field>
            <Label>Period</Label>
            <Select value={BudgetPeriod.MONTHLY} disabled>
              <SelectTrigger size="default" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value} disabled={value !== BudgetPeriod.MONTHLY}>
                    {label}
                    {value !== BudgetPeriod.MONTHLY && (
                      <span className="text-text-disabled ml-1 text-[10px]">(coming soon)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <Label>Alert threshold</Label>
              <span className="text-text-secondary text-xs tabular-nums">{alertThresholdPct}%</span>
            </div>
            <Slider
              min={10}
              max={100}
              step={5}
              value={[alertThresholdPct]}
              onValueChange={([v]) => setAlertThresholdPct(v!)}
              className="mt-1"
            />
            <p className="text-text-disabled mt-1 text-[11px]">
              Notify when spending reaches this percentage of the limit.
            </p>
          </Field>

          <Field>
            <Label>Re-alert every</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                className="w-20"
                value={String(alertAtFrequency)}
                onChange={(e) => {
                  const n = parseInt(onlyNumbers(e.target.value) || '1', 10);
                  setAlertAtFrequency(Math.min(30, Math.max(1, n)));
                }}
              />
              <span className="text-text-secondary text-sm">days</span>
            </div>
          </Field>

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
              Create Budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
