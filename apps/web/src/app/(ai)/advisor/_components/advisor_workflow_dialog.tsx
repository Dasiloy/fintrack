'use client';

import * as React from 'react';
import { CalendarCheck, Landmark, LineChart, Scale } from 'lucide-react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  MonthPicker,
  RadioGroup,
  RadioGroupItem,
  Slider,
} from '@ui/components';
import { cn } from '@ui/lib/utils';
import { capitalize } from '@fintrack/utils/format';
import type { AdvisorWorkflowId, AdvisorWorkflowRequest } from '@fintrack/types/interfaces/ai';

import type { AdvisorWorkflowRun } from '../_lib/advisor.types';
import type { AdvisorWorkflowTool } from './advisor_workflow_tools';

interface WorkflowFormState {
  horizonDays: number;
  reviewDepth: 'quick' | 'standard' | 'deep';
  selectedMonth: Date;
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
}

function defaultWorkflowState(): WorkflowFormState {
  const now = new Date();
  return {
    horizonDays: 30,
    reviewDepth: 'standard',
    selectedMonth: new Date(now.getFullYear(), now.getMonth(), 1),
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
}

export interface AdvisorWorkflowSubmission {
  prompt: string;
  workflow: AdvisorWorkflowRun;
  request: AdvisorWorkflowRequest;
}
interface AdvisorWorkflowDialogProps {
  workflow: AdvisorWorkflowTool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (submission: AdvisorWorkflowSubmission) => void;
}

export function AdvisorWorkflowDialog({
  workflow,
  open,
  onOpenChange,
  onSubmit,
}: AdvisorWorkflowDialogProps) {
  const [state, setState] = React.useState<WorkflowFormState>(() => defaultWorkflowState());

  React.useEffect(() => {
    if (open) setState(defaultWorkflowState());
  }, [open, workflow?.id]);

  if (!workflow) return null;

  const Icon = iconForWorkflow(workflow.id);

  const update = <K extends keyof WorkflowFormState>(key: K, value: WorkflowFormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    onSubmit(buildWorkflowSubmission(workflow, state));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-start pr-10 text-left">
          <div className="flex flex-col items-start gap-2.5">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="space-y-1">
              <DialogTitle className="text-[18px] leading-6">
                {dialogTitle(workflow.id)}
              </DialogTitle>
              <DialogDescription className="max-w-md text-[13px] leading-5">
                {dialogDescription(workflow.id)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="advisor-workflow-form" className="flex flex-col gap-5 py-2">
          {workflow.id === 'bill-subscription-auditor' && (
            <BillAuditorFields state={state} update={update} />
          )}
          {workflow.id === 'cash-flow-forecast' && <CashFlowFields state={state} update={update} />}
          {workflow.id === 'budget-rebalancer' && (
            <BudgetRebalancerFields state={state} update={update} />
          )}
          {workflow.id === 'monthly-money-review' && (
            <MonthlyReviewFields state={state} update={update} />
          )}
        </form>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" form="advisor-workflow-form" size="sm" onClick={handleSubmit}>
            Use workflow
          </Button>
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
        <div className="text-text-disabled flex justify-between text-[11px]">
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
  const [monthPickerOpen, setMonthPickerOpen] = React.useState(false);

  return (
    <>
      <FieldGroup label="Month">
        <div className="flex items-center justify-between gap-3">
          <p className="text-text-tertiary text-[12px] leading-5">
            Pick the budget month to rebalance.
          </p>
          <MonthPicker
            value={state.selectedMonth}
            onChange={(date) => update('selectedMonth', startOfMonth(date))}
            open={monthPickerOpen}
            onOpenChange={setMonthPickerOpen}
          />
        </div>
      </FieldGroup>

      <FieldGroup label={`Change appetite: ${strictnessLabel(state.strictness)}`}>
        <Slider
          value={[state.strictness]}
          min={0}
          max={100}
          step={5}
          onValueChange={([value]) => update('strictness', value ?? 50)}
        />
        <div className="text-text-disabled flex justify-between text-[11px]">
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
          onValueChange={(value) =>
            update('reviewDepth', value as WorkflowFormState['reviewDepth'])
          }
          className="grid gap-2 sm:grid-cols-3"
        >
          {(['quick', 'standard', 'deep'] as const).map((value) => (
            <Label
              key={value}
              className={cn(
                'border-border-subtle bg-bg-surface text-text-secondary flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors',
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

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-text-secondary text-[12px] font-semibold">{label}</Label>
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
    <Label className="border-border-subtle bg-bg-surface text-text-secondary flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px]">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
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
        'border-border-subtle bg-bg-surface text-text-secondary flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors',
        checked && 'border-primary/30 bg-primary/5 text-primary',
      )}
    >
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      {label}
    </Label>
  );
}

// ── Workflow submission builders ─────────────────────────────────────────────

/**
 * Builds the optimistic workflow submission used by the frontend chat.
 *
 * The gateway still rebuilds the authoritative prompt and durable workflow
 * metadata from `request`; the local `prompt` and `workflow` keep the UI feeling
 * immediate while the stream is being staged.
 */
function buildWorkflowSubmission(
  workflow: AdvisorWorkflowTool,
  state: WorkflowFormState,
): AdvisorWorkflowSubmission {
  const prompt = buildWorkflowPrompt(workflow, state);
  const runId = crypto.randomUUID();
  return {
    prompt,
    workflow: {
      id: runId,
      workflowId: workflow.id,
      title: dialogTitle(workflow.id),
      description: workflow.description,
      summaryItems: workflowSummaryItems(workflow.id, state),
      focusItems: workflowFocusItems(workflow.id, state),
      stages: workflowStages(workflow.id),
      status: 'started',
      activeStageIndex: 0,
      statusLabel: 'Workflow queued',
      startedAt: new Date().toISOString(),
    },
    request: {
      workflowId: workflow.id,
      runId,
      options: {
        horizonDays: state.horizonDays,
        reviewDepth: state.reviewDepth,
        monthLabel: formatMonthLabel(state.selectedMonth),
        month: state.selectedMonth.getMonth(),
        year: state.selectedMonth.getFullYear(),
        strictness: state.strictness,
        includeRecurring: state.includeRecurring,
        includeSpending: state.includeSpending,
        includeBudgets: state.includeBudgets,
        includeGoals: state.includeGoals,
        includeSplits: state.includeSplits,
        focusDuplicates: state.focusDuplicates,
        focusRisingCosts: state.focusRisingCosts,
        focusStaleBills: state.focusStaleBills,
        overspentOnly: state.overspentOnly,
      },
    },
  };
}

/**
 * Builds the local prompt used for optimistic stream identity and legacy paths.
 *
 * The gateway owns the authoritative workflow prompt once `request` is sent.
 */
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
    return `Run a bill and subscription auditor. Inspect ${joinList(sources)} for ${joinList(checks)}, show concrete evidence, and only recommend an action if the numbers support it. Structure the response as: Snapshot, Findings, Evidence, Recommended action.`;
  }

  if (workflow.id === 'cash-flow-forecast') {
    const sources = [
      state.includeRecurring ? 'recurring bills' : null,
      state.includeBudgets ? 'budgets' : null,
      state.includeGoals ? 'goals' : null,
      state.includeSpending ? 'recent spending' : null,
    ].filter(Boolean);
    return `Run a cash flow forecast for the next ${state.horizonDays} days using ${joinList(sources)}. Show expected pressure points, the biggest risk, and one next best action. Structure the response as: Forecast snapshot, Pressure points, Risk window, Recommended action.`;
  }

  if (workflow.id === 'budget-rebalancer') {
    return `Run a budget rebalancer for ${formatMonthLabel(state.selectedMonth)}. Use a ${strictnessLabel(state.strictness).toLowerCase()} change appetite${state.overspentOnly ? ' and focus only on overspent categories' : ''}. Compare spending against limits and recommend one useful budget adjustment if the numbers support it. Structure the response as: Budget snapshot, Categories to watch, Adjustment logic, Recommended action.`;
  }

  const sections = [
    state.includeBudgets ? 'budgets' : null,
    state.includeRecurring ? 'bills' : null,
    state.includeGoals ? 'goals' : null,
    state.includeSplits ? 'splits' : null,
  ].filter(Boolean);
  return `Run my monthly money review in a ${state.reviewDepth} style. Cover ${joinList(sections)}, summarize wins and risks, then recommend one next best action. Structure the response as: Monthly snapshot, Wins, Risks, Recommended action.`;
}

/**
 * Builds the optimistic key/value rows shown on the workflow launch card.
 */
function workflowSummaryItems(
  id: AdvisorWorkflowId,
  state: WorkflowFormState,
): Array<{ label: string; value: string }> {
  switch (id) {
    case 'bill-subscription-auditor':
      return [
        {
          label: 'Inspect',
          value: joinList([
            state.includeRecurring ? 'recurring bills' : null,
            state.includeSpending ? 'recent transactions' : null,
          ]),
        },
        {
          label: 'Look for',
          value: joinList([
            state.focusDuplicates ? 'duplicates' : null,
            state.focusRisingCosts ? 'rising costs' : null,
            state.focusStaleBills ? 'stale bills' : null,
          ]),
        },
      ];
    case 'cash-flow-forecast':
      return [
        { label: 'Horizon', value: `${state.horizonDays} days` },
        {
          label: 'Inputs',
          value: joinList([
            state.includeRecurring ? 'recurring bills' : null,
            state.includeBudgets ? 'budgets' : null,
            state.includeGoals ? 'goals' : null,
            state.includeSpending ? 'recent spending' : null,
          ]),
        },
      ];
    case 'budget-rebalancer':
      return [
        { label: 'Month', value: formatMonthLabel(state.selectedMonth) },
        { label: 'Appetite', value: strictnessLabel(state.strictness) },
      ];
    case 'monthly-money-review':
      return [
        { label: 'Depth', value: capitalize(state.reviewDepth) },
        {
          label: 'Sections',
          value: joinList([
            state.includeBudgets ? 'budgets' : null,
            state.includeRecurring ? 'bills' : null,
            state.includeGoals ? 'goals' : null,
            state.includeSplits ? 'splits' : null,
          ]),
        },
      ];
  }
  return [];
}

/**
 * Builds the optimistic focus chips shown on the workflow launch card.
 */
function workflowFocusItems(id: AdvisorWorkflowId, state: WorkflowFormState): string[] {
  switch (id) {
    case 'bill-subscription-auditor':
      return [
        state.focusDuplicates ? 'Duplicate charges' : null,
        state.focusRisingCosts ? 'Rising costs' : null,
        state.focusStaleBills ? 'Stale bills' : null,
      ].filter(Boolean) as string[];
    case 'cash-flow-forecast':
      return ['Pressure points', 'Biggest risk', 'Next best action'];
    case 'budget-rebalancer':
      return [
        state.overspentOnly ? 'Overspent categories only' : 'All active budgets',
        `${strictnessLabel(state.strictness)} changes`,
        'One useful adjustment',
      ];
    case 'monthly-money-review':
      return ['Wins', 'Risks', 'Next best action'];
  }
  return [];
}

/**
 * Returns the optimistic progress stages shown while the workflow is running.
 */
function workflowStages(id: AdvisorWorkflowId): string[] {
  switch (id) {
    case 'bill-subscription-auditor':
      return [
        'Starting audit',
        'Loading recurring bills',
        'Checking recent transactions',
        'Comparing patterns',
        'Building findings',
        'Preparing response',
      ];
    case 'cash-flow-forecast':
      return [
        'Starting forecast',
        'Loading commitments',
        'Reading recent spending',
        'Projecting cash flow',
        'Checking risk windows',
        'Preparing response',
      ];
    case 'budget-rebalancer':
      return [
        'Starting rebalance',
        'Loading budgets',
        'Comparing spend',
        'Sizing adjustments',
        'Checking recommendation limits',
        'Preparing response',
      ];
    case 'monthly-money-review':
      return [
        'Starting review',
        'Loading monthly signals',
        'Reviewing bills and budgets',
        'Checking goals and splits',
        'Scoring wins and risks',
        'Preparing response',
      ];
  }
  return ['Starting workflow', 'Loading records', 'Preparing response'];
}

// ── Workflow display labels ──────────────────────────────────────────────────

/**
 * Returns the dialog and launch-card title for a workflow id.
 */
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
  }
  return 'Advisor workflow';
}

/**
 * Returns the short setup-dialog description for a workflow id.
 */
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
  }
  return 'Choose the workflow options to include.';
}

/**
 * Returns the icon component used in the setup dialog header.
 */
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
  }
  return CalendarCheck;
}

/**
 * Converts the budget strictness slider value into a human label.
 */
function strictnessLabel(value: number): string {
  if (value < 34) return 'Gentle';
  if (value > 66) return 'Firm';
  return 'Balanced';
}

/**
 * Normalizes any picked date to the first day of its calendar month.
 */
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Formats workflow month selections for prompts and launch cards.
 */
function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats selected option labels as a natural-language list.
 */
function joinList(values: Array<string | null | undefined>): string {
  const items = values.filter(Boolean) as string[];
  if (items.length === 0) return 'the available data';
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
