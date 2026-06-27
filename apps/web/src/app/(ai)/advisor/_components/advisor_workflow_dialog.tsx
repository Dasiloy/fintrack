'use client';

import * as React from 'react';
import {
  CalendarCheck,
  Landmark,
  LineChart,
  Scale,
} from 'lucide-react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Slider,
} from '@ui/components';
import { cn } from '@ui/lib/utils';

import type { AdvisorWorkflowId, AdvisorWorkflowTool } from './advisor_workflow_tools';

type WorkflowFormState = {
  horizonDays: number;
  reviewDepth: 'quick' | 'standard' | 'deep';
  monthLabel: string;
  strictness: number;
  includeRecurring: boolean;
  includeSpending: boolean;
  includeBudgets: boolean;
  includeGoals: boolean;
  includeSplits: boolean;
  focusDuplicates: boolean;
  focusRisingCosts: boolean;
  focusStaleBills: boolean;
  overspentOnly: boolean;
};

const DEFAULT_STATE: WorkflowFormState = {
  horizonDays: 30,
  reviewDepth: 'standard',
  monthLabel: '',
  strictness: 50,
  includeRecurring: true,
  includeSpending: true,
  includeBudgets: true,
  includeGoals: true,
  includeSplits: true,
  focusDuplicates: true,
  focusRisingCosts: true,
  focusStaleBills: true,
  overspentOnly: false,
};

interface AdvisorWorkflowDialogProps {
  workflow: AdvisorWorkflowTool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prompt: string) => void;
}

export function AdvisorWorkflowDialog({
  workflow,
  open,
  onOpenChange,
  onSubmit,
}: AdvisorWorkflowDialogProps) {
  const [state, setState] = React.useState<WorkflowFormState>(DEFAULT_STATE);

  React.useEffect(() => {
    if (open) setState(DEFAULT_STATE);
  }, [open, workflow?.id]);

  if (!workflow || workflow.id === 'document-review-workspace') return null;

  const Icon = iconForWorkflow(workflow.id);

  const update = <K extends keyof WorkflowFormState>(
    key: K,
    value: WorkflowFormState[K],
  ) => setState((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    onSubmit(buildWorkflowPrompt(workflow, state));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="border-border-subtle border-b bg-bg-surface/60 p-5">
          <DialogHeader className="text-left">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <DialogTitle className="text-[18px]">
                  {dialogTitle(workflow.id)}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {dialogDescription(workflow.id)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-5">
          {workflow.id === 'bill-subscription-auditor' && (
            <BillAuditorFields state={state} update={update} />
          )}
          {workflow.id === 'cash-flow-forecast' && (
            <CashFlowFields state={state} update={update} />
          )}
          {workflow.id === 'budget-rebalancer' && (
            <BudgetRebalancerFields state={state} update={update} />
          )}
          {workflow.id === 'monthly-money-review' && (
            <MonthlyReviewFields state={state} update={update} />
          )}
        </div>

        <DialogFooter className="m-0 border-t border-border-subtle bg-bg-surface/40 px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Use workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BillAuditorFields({
  state,
  update,
}: {
  state: WorkflowFormState;
  update: <K extends keyof WorkflowFormState>(key: K, value: WorkflowFormState[K]) => void;
}) {
  return (
    <>
      <FieldGroup label="Data to inspect">
        <CheckRow
          label="Recurring bills"
          checked={state.includeRecurring}
          onCheckedChange={(checked) => update('includeRecurring', checked)}
        />
        <CheckRow
          label="Recent transactions"
          checked={state.includeSpending}
          onCheckedChange={(checked) => update('includeSpending', checked)}
        />
      </FieldGroup>

      <FieldGroup label="What to look for">
        <div className="grid gap-2 sm:grid-cols-3">
          <CheckPill
            label="Duplicates"
            checked={state.focusDuplicates}
            onCheckedChange={(checked) => update('focusDuplicates', checked)}
          />
          <CheckPill
            label="Rising costs"
            checked={state.focusRisingCosts}
            onCheckedChange={(checked) => update('focusRisingCosts', checked)}
          />
          <CheckPill
            label="Stale bills"
            checked={state.focusStaleBills}
            onCheckedChange={(checked) => update('focusStaleBills', checked)}
          />
        </div>
      </FieldGroup>
    </>
  );
}

function CashFlowFields({
  state,
  update,
}: {
  state: WorkflowFormState;
  update: <K extends keyof WorkflowFormState>(key: K, value: WorkflowFormState[K]) => void;
}) {
  return (
    <>
      <FieldGroup label={`Forecast horizon: ${state.horizonDays} days`}>
        <Slider
          value={[state.horizonDays]}
          min={7}
          max={60}
          step={1}
          onValueChange={([value]) => update('horizonDays', value ?? 30)}
        />
        <div className="flex justify-between text-[11px] text-text-disabled">
          <span>7 days</span>
          <span>30 days</span>
          <span>60 days</span>
        </div>
      </FieldGroup>

      <FieldGroup label="Include">
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckPill
            label="Recurring bills"
            checked={state.includeRecurring}
            onCheckedChange={(checked) => update('includeRecurring', checked)}
          />
          <CheckPill
            label="Budgets"
            checked={state.includeBudgets}
            onCheckedChange={(checked) => update('includeBudgets', checked)}
          />
          <CheckPill
            label="Goals"
            checked={state.includeGoals}
            onCheckedChange={(checked) => update('includeGoals', checked)}
          />
          <CheckPill
            label="Recent spending"
            checked={state.includeSpending}
            onCheckedChange={(checked) => update('includeSpending', checked)}
          />
        </div>
      </FieldGroup>
    </>
  );
}

function BudgetRebalancerFields({
  state,
  update,
}: {
  state: WorkflowFormState;
  update: <K extends keyof WorkflowFormState>(key: K, value: WorkflowFormState[K]) => void;
}) {
  return (
    <>
      <FieldGroup label="Month">
        <Input
          value={state.monthLabel}
          onChange={(event) => update('monthLabel', event.target.value)}
          placeholder="Current month"
        />
      </FieldGroup>

      <FieldGroup label={`Change appetite: ${strictnessLabel(state.strictness)}`}>
        <Slider
          value={[state.strictness]}
          min={0}
          max={100}
          step={5}
          onValueChange={([value]) => update('strictness', value ?? 50)}
        />
        <div className="flex justify-between text-[11px] text-text-disabled">
          <span>Gentle</span>
          <span>Balanced</span>
          <span>Firm</span>
        </div>
      </FieldGroup>

      <CheckRow
        label="Focus only on overspent categories"
        checked={state.overspentOnly}
        onCheckedChange={(checked) => update('overspentOnly', checked)}
      />
    </>
  );
}

function MonthlyReviewFields({
  state,
  update,
}: {
  state: WorkflowFormState;
  update: <K extends keyof WorkflowFormState>(key: K, value: WorkflowFormState[K]) => void;
}) {
  return (
    <>
      <FieldGroup label="Review style">
        <RadioGroup
          value={state.reviewDepth}
          onValueChange={(value) => update('reviewDepth', value as WorkflowFormState['reviewDepth'])}
          className="grid gap-2 sm:grid-cols-3"
        >
          {(['quick', 'standard', 'deep'] as const).map((value) => (
            <Label
              key={value}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-[12px] font-medium text-text-secondary transition-colors',
                state.reviewDepth === value && 'border-primary/30 bg-primary/5 text-primary',
              )}
            >
              <RadioGroupItem value={value} />
              {capitalize(value)}
            </Label>
          ))}
        </RadioGroup>
      </FieldGroup>

      <FieldGroup label="Sections">
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckPill
            label="Budgets"
            checked={state.includeBudgets}
            onCheckedChange={(checked) => update('includeBudgets', checked)}
          />
          <CheckPill
            label="Bills"
            checked={state.includeRecurring}
            onCheckedChange={(checked) => update('includeRecurring', checked)}
          />
          <CheckPill
            label="Goals"
            checked={state.includeGoals}
            onCheckedChange={(checked) => update('includeGoals', checked)}
          />
          <CheckPill
            label="Splits"
            checked={state.includeSplits}
            onCheckedChange={(checked) => update('includeSplits', checked)}
          />
        </div>
      </FieldGroup>
    </>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[12px] font-semibold text-text-secondary">{label}</Label>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2.5 text-[13px] text-text-secondary">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </Label>
  );
}

function CheckPill({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-[12px] font-medium text-text-secondary transition-colors',
        checked && 'border-primary/30 bg-primary/5 text-primary',
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </Label>
  );
}

function buildWorkflowPrompt(workflow: AdvisorWorkflowTool, state: WorkflowFormState): string {
  if (workflow.id === 'bill-subscription-auditor') {
    const sources = [
      state.includeRecurring ? 'recurring bills' : null,
      state.includeSpending ? 'recent transactions' : null,
    ].filter(Boolean);
    const checks = [
      state.focusDuplicates ? 'duplicates' : null,
      state.focusRisingCosts ? 'rising costs' : null,
      state.focusStaleBills ? 'stale bills' : null,
    ].filter(Boolean);
    return `Run a bill and subscription auditor. Inspect ${joinList(sources)} for ${joinList(checks)}, show the concrete evidence, then recommend one practical action if the numbers support it.`;
  }

  if (workflow.id === 'cash-flow-forecast') {
    const sources = [
      state.includeRecurring ? 'recurring bills' : null,
      state.includeBudgets ? 'budgets' : null,
      state.includeGoals ? 'goals' : null,
      state.includeSpending ? 'recent spending' : null,
    ].filter(Boolean);
    return `Run a cash flow forecast for the next ${state.horizonDays} days using ${joinList(sources)}. Show expected pressure points, the biggest risk, and one next best action.`;
  }

  if (workflow.id === 'budget-rebalancer') {
    return `Run a budget rebalancer for ${state.monthLabel.trim() || 'the current month'}. Use a ${strictnessLabel(state.strictness).toLowerCase()} change appetite${state.overspentOnly ? ' and focus only on overspent categories' : ''}. Compare spending against limits and recommend one useful budget adjustment if the numbers support it.`;
  }

  const sections = [
    state.includeBudgets ? 'budgets' : null,
    state.includeRecurring ? 'bills' : null,
    state.includeGoals ? 'goals' : null,
    state.includeSplits ? 'splits' : null,
  ].filter(Boolean);
  return `Run my monthly money review in a ${state.reviewDepth} style. Cover ${joinList(sections)}, summarize wins and risks, then recommend one next best action.`;
}

function dialogTitle(id: AdvisorWorkflowId): string {
  switch (id) {
    case 'bill-subscription-auditor':
      return 'Bill & subscription audit';
    case 'cash-flow-forecast':
      return 'Cash flow forecast';
    case 'budget-rebalancer':
      return 'Budget rebalancer';
    case 'monthly-money-review':
      return 'Monthly money review';
    case 'document-review-workspace':
      return 'Document review';
  }
}

function dialogDescription(id: AdvisorWorkflowId): string {
  switch (id) {
    case 'bill-subscription-auditor':
      return 'Choose the signals the advisor should inspect before recommending a change.';
    case 'cash-flow-forecast':
      return 'Set the forecast window and which commitments should shape the projection.';
    case 'budget-rebalancer':
      return 'Tune how aggressively the advisor should suggest budget changes.';
    case 'monthly-money-review':
      return 'Choose the review depth and the areas to include.';
    case 'document-review-workspace':
      return 'Attach files for the advisor to inspect.';
  }
}

function iconForWorkflow(id: AdvisorWorkflowId) {
  switch (id) {
    case 'bill-subscription-auditor':
      return Landmark;
    case 'cash-flow-forecast':
      return LineChart;
    case 'budget-rebalancer':
      return Scale;
    case 'monthly-money-review':
      return CalendarCheck;
    case 'document-review-workspace':
      return Landmark;
  }
}

function strictnessLabel(value: number): string {
  if (value < 34) return 'Gentle';
  if (value > 66) return 'Firm';
  return 'Balanced';
}

function capitalize(value: string): string {
  return `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`;
}

function joinList(values: Array<string | null | undefined>): string {
  const items = values.filter(Boolean) as string[];
  if (items.length === 0) return 'the available data';
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
