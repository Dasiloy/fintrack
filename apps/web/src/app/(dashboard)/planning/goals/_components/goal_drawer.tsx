'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Badge,
  Button,
  Calendar,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { formatCurrency, onlyNumbers } from '@fintrack/utils/format';
import { format } from '@fintrack/utils/date';
import {
  DrawerFooter,
  DrawerHeader,
  DrawerSkeleton,
  EditRow,
  inputCls,
  Row,
  Section,
  SectionLabel,
} from '@/app/_components';
import { GoalContributionForm } from './goal_contribution_form';
import { progressBarColor, statusVariant, statusLabel, priorityVariant } from '../helpers';
import type { Goal } from '@fintrack/types/protos/finance/goal';

// ---------------------------------------------------------------------------
// PaceStatusBadge
// ---------------------------------------------------------------------------

function PaceStatusBadge({ status }: { status: 'ON_TRACK' | 'BEHIND' | 'OVERDUE' | 'COMPLETED' }) {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
        <CheckCircle2 className="size-3" />
        Completed
      </span>
    );
  }
  if (status === 'ON_TRACK') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
        <TrendingUp className="size-3" />
        On Track
      </span>
    );
  }
  if (status === 'OVERDUE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400">
        <AlertTriangle className="size-3" />
        Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
      <TrendingDown className="size-3" />
      Behind
    </span>
  );
}

// ---------------------------------------------------------------------------
// PaceDetails
// ---------------------------------------------------------------------------

function PaceDetails({ goal, remaining }: { goal: Goal; remaining: number }) {
  const { paceRequired = 0, paceActual = 0, paceStatus, monthsLeft = 0 } = goal;
  const gap = Math.max(0, paceRequired - paceActual);

  const rowCls = 'flex items-center justify-between py-2';
  const labelCls = 'text-text-tertiary flex items-center gap-1.5 text-[11px]';
  const valueCls = 'text-text-primary text-[11px] font-semibold tabular-nums';

  return (
    <div className="border-border-subtle w-full divide-y divide-white/5 rounded-lg border px-3">
      <div className={rowCls}>
        <span className={labelCls}>
          <Clock className="size-3" />
          Time remaining
        </span>
        <span className={valueCls}>
          {monthsLeft <= 0 ? 'Past due' : `${monthsLeft} month${monthsLeft === 1 ? '' : 's'}`}
        </span>
      </div>
      <div className={rowCls}>
        <span className={labelCls}>
          <CheckCircle2 className="size-3" />
          Amount remaining
        </span>
        <span className={valueCls}>{formatCurrency(remaining)}</span>
      </div>
      <div className={rowCls}>
        <span className={labelCls}>
          <TrendingUp className="size-3" />
          Pace needed / mo
        </span>
        <span className={cn(valueCls, monthsLeft <= 0 && 'text-red-400')}>
          {monthsLeft <= 0 ? '—' : formatCurrency(paceRequired)}
        </span>
      </div>
      <div className={rowCls}>
        <span className={labelCls}>
          <TrendingUp className="size-3" />
          Your avg / mo
        </span>
        <span
          className={cn(
            valueCls,
            paceStatus === 'ON_TRACK'
              ? 'text-emerald-400'
              : paceStatus === 'OVERDUE'
                ? 'text-red-400'
                : 'text-amber-400',
          )}
        >
          {formatCurrency(paceActual)}
        </span>
      </div>
      {paceStatus === 'BEHIND' && gap > 0 && (
        <div className={rowCls}>
          <span className={cn(labelCls, 'text-amber-400/70')}>
            <AlertTriangle className="size-3" />
            Extra needed / mo
          </span>
          <span className={cn(valueCls, 'text-amber-400')}>+{formatCurrency(gap)}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GoalDrawer
// ---------------------------------------------------------------------------

interface GoalDrawerProps {
  goalId: string | null;
  onOpenChange: (open: boolean) => void;
  initialEditMode?: boolean;
  initialAddFundsOpen?: boolean;
}

export function GoalDrawer({
  goalId,
  onOpenChange,
  initialEditMode = false,
  initialAddFundsOpen = false,
}: GoalDrawerProps) {
  const open = !!goalId;

  const [editMode, setEditMode] = React.useState(false);
  const [addFundsOpen, setAddFundsOpen] = React.useState(false);
  const [deleteGoalOpen, setDeleteGoalOpen] = React.useState(false);
  const [deleteContribId, setDeleteContribId] = React.useState<string | null>(null);
  const [dateOpen, setDateOpen] = React.useState(false);

  // Edit fields
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [targetDate, setTargetDate] = React.useState<Date | undefined>();
  const [priority, setPriority] = React.useState('MEDIUM');
  const [description, setDescription] = React.useState('');

  const { data, isLoading } = api_client.goal.getById.useQuery({ id: goalId! }, { enabled: open });

  const goal = data?.data;

  React.useEffect(() => {
    if (!open) {
      setEditMode(false);
      setAddFundsOpen(false);
      setDeleteGoalOpen(false);
      setDeleteContribId(null);
    } else {
      if (initialEditMode) setEditMode(true);
      if (initialAddFundsOpen) setAddFundsOpen(true);
    }
  }, [open, initialEditMode, initialAddFundsOpen]);

  React.useEffect(() => {
    if (goal) {
      setName(goal.name);
      setAmount(String(goal.targetAmount));
      setTargetDate(new Date(goal.targetDate));
      setPriority(goal.priority);
      setDescription(goal.description ?? '');
    }
  }, [goal]);

  const utils = api_client.useUtils();

  const updateMutation = api_client.goal.update.useMutation({
    onSuccess: () => {
      toast.success('Goal updated');
      void utils.goal.getAll.invalidate();
      void utils.goal.getById.invalidate({ id: goalId! });
      void utils.goal.getAggregate.invalidate();
      setEditMode(false);
    },
    onError: (err) => toast.error('Failed to update goal', { description: err.message }),
  });

  const updateStatusMutation = api_client.goal.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Status updated');
      void utils.goal.getAll.invalidate();
      void utils.goal.getById.invalidate({ id: goalId! });
      void utils.goal.getAggregate.invalidate();
    },
    onError: (err) => toast.error('Failed to update status', { description: err.message }),
  });

  const deleteMutation = api_client.goal.delete.useMutation({
    onSuccess: () => {
      toast.success('Goal deleted');
      void utils.goal.getAll.invalidate();
      void utils.goal.getAggregate.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to delete goal', { description: err.message }),
  });

  const deleteContribMutation = api_client.goal.deleteContribution.useMutation({
    onSuccess: () => {
      toast.success('Contribution removed');
      void utils.goal.getAll.invalidate();
      void utils.goal.getById.invalidate({ id: goalId! });
      void utils.goal.getAggregate.invalidate();
      setDeleteContribId(null);
    },
    onError: (err) => toast.error('Failed to remove contribution', { description: err.message }),
  });

  const contributed = goal?.contributedAmount ?? 0;
  const target = goal?.targetAmount ?? 0;
  const pct = target > 0 ? Math.min(Math.round((contributed / target) * 100), 100) : 0;
  const remaining = Math.max(target - contributed, 0);
  const canSave = name.trim().length > 0 && parseFloat(amount) > 0 && !!targetDate;
  const isCompleted = goal?.status === 'COMPLETED';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          title="Goal Details"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DrawerHeader
            title={editMode ? 'Edit Goal' : 'Goal Details'}
            editMode={editMode}
            onEdit={goal && !isCompleted ? () => setEditMode(true) : undefined}
            onCancel={() => setEditMode(false)}
            onClose={() => onOpenChange(false)}
          />

          <ScrollArea className="min-h-0 flex-1">
            {isLoading ? (
              <DrawerSkeleton />
            ) : !goal ? (
              <div className="text-text-tertiary flex h-40 items-center justify-center text-[13px]">
                Goal not found
              </div>
            ) : editMode ? (
              /* ── Edit mode ── */
              <div className="flex flex-col gap-5 px-6 py-6">
                <div>
                  <SectionLabel>Details</SectionLabel>
                  <div className="border-border-subtle divide-border-subtle divide-y overflow-hidden rounded-lg border">
                    <div className="divide-border-subtle divide-y px-3">
                      <EditRow label="Name">
                        <input
                          type="text"
                          className={inputCls}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Goal name"
                        />
                      </EditRow>
                      <EditRow label="Target (₦)">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputCls}
                          value={amount}
                          onChange={(e) => setAmount(onlyNumbers(e.target.value))}
                          placeholder="0.00"
                        />
                      </EditRow>
                      <EditRow label="Target Date">
                        <AnchoredPopover
                          open={dateOpen}
                          onOpenChange={setDateOpen}
                          modal={false}
                          contentClassName="w-auto p-0"
                          trigger={
                            <button
                              type="button"
                              className={cn(inputCls, 'flex items-center gap-2 text-left')}
                            >
                              <CalendarIcon className="size-3.5 shrink-0 opacity-50" />
                              {targetDate ? format(targetDate, 'MMM D, YYYY') : 'Pick a date'}
                            </button>
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
                      </EditRow>
                      <EditRow label="Priority">
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger className={cn(inputCls, 'border-0 p-0 shadow-none')}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </EditRow>
                      <EditRow label="Description">
                        <input
                          type="text"
                          className={inputCls}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Optional"
                        />
                      </EditRow>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border-subtle" />

                {/* Status control */}
                <div>
                  <SectionLabel>Status</SectionLabel>
                  <div className="mt-1">
                    {isCompleted ? (
                      <p className="text-text-tertiary text-[12px]">
                        This goal is completed and cannot be changed manually.
                      </p>
                    ) : (
                      <Select
                        value={goal.status}
                        disabled={updateStatusMutation.isPending}
                        onValueChange={(v) => {
                          if (v === goal.status) return;
                          updateStatusMutation.mutate({
                            id: goal.id,
                            status: v as 'ACTIVE' | 'ON_HOLD',
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="flex flex-col gap-6 px-6 py-6">
                {/* Hero progress */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-end gap-1">
                    <span className="text-text-primary text-[22px] leading-none font-bold tabular-nums">
                      {formatCurrency(contributed)}
                    </span>
                    <span className="text-text-tertiary mb-0.5 text-[13px]">
                      / {formatCurrency(target)}
                    </span>
                  </div>

                  <div className="w-full space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-500/25">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          progressBarColor(pct, goal.status),
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary text-[11px]">{pct}% funded</span>
                      <span className="text-text-tertiary text-[11px]">
                        {formatCurrency(remaining)} left
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <Badge variant={statusVariant(goal.status)} className="text-[11px]">
                      {statusLabel(goal.status)}
                    </Badge>
                    <Badge variant={priorityVariant(goal.priority)} className="text-[11px]">
                      {goal.priority} priority
                    </Badge>
                    {goal.paceStatus && <PaceStatusBadge status={goal.paceStatus as any} />}
                  </div>
                </div>

                {/* Pace details */}
                {goal.paceStatus && !isCompleted && (
                  <PaceDetails goal={goal} remaining={remaining} />
                )}

                <Separator className="bg-border-subtle" />

                {/* Details */}
                <Section label="Details">
                  <Row label="Target">{formatCurrency(goal.targetAmount)}</Row>
                  <Row label="Due">{format(new Date(goal.targetDate), 'MMMM D, YYYY')}</Row>
                  {goal.description && <Row label="Description">{goal.description}</Row>}
                  <Row label="Created">{format(new Date(goal.createdAt), 'MMM D, YYYY')}</Row>
                </Section>

                {/* Add Funds */}
                {!isCompleted && (
                  <>
                    <Separator className="bg-border-subtle" />
                    <div>
                      <button
                        type="button"
                        onClick={() => setAddFundsOpen((v) => !v)}
                        className="text-text-secondary hover:text-text-primary flex w-full cursor-pointer items-center justify-between pb-1 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <PlusCircle className="size-3.5" />
                          <span className="text-[12px] font-semibold">Add Funds</span>
                        </div>
                        {addFundsOpen ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </button>
                      {addFundsOpen && (
                        <div className="border-border-subtle mt-3 rounded-lg border p-3">
                          <GoalContributionForm
                            goalId={goal.id}
                            remainingAmount={remaining}
                            onSuccess={() => setAddFundsOpen(false)}
                            onCancel={() => setAddFundsOpen(false)}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Contributions list */}
                {(goal.contributions ?? []).length > 0 && (
                  <>
                    <Separator className="bg-border-subtle" />
                    <div>
                      <p className="text-text-disabled mb-3 text-[10px] font-semibold tracking-wider uppercase">
                        Contributions ({goal.contributions.length})
                      </p>
                      <ul className="space-y-2">
                        {[...(goal.contributions ?? [])]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((c) => (
                            <li
                              key={c.id}
                              className="border-border-subtle flex items-start justify-between gap-2 rounded-lg border p-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-[13px] font-semibold text-emerald-400 tabular-nums">
                                    +{formatCurrency(c.amount)}
                                  </span>
                                  <span className="text-text-tertiary text-[11px]">
                                    {format(new Date(c.date), 'MMM D, YYYY')}
                                  </span>
                                </div>
                                {c.description && (
                                  <p className="text-text-tertiary mt-0.5 truncate text-[11px]">
                                    {c.description}
                                  </p>
                                )}
                                {c.transaction && (
                                  <span className="text-primary bg-primary/10 mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium">
                                    Linked transaction
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setDeleteContribId(c.id)}
                                className="text-text-disabled hover:text-error mt-0.5 shrink-0 rounded p-0.5 transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {goal && (
            <DrawerFooter>
              {editMode ? (
                <Button
                  className="flex-1"
                  size="sm"
                  loading={updateMutation.isPending}
                  disabled={!canSave}
                  onClick={() => {
                    if (!canSave || !targetDate) return;
                    updateMutation.mutate({
                      id: goal.id,
                      name: name.trim(),
                      targetAmount: parseFloat(amount),
                      targetDate: format(targetDate, 'YYYY-MM-DD'),
                      priority: priority as 'LOW' | 'MEDIUM' | 'HIGH',
                      description: description.trim() || undefined,
                    });
                  }}
                >
                  Save Changes
                </Button>
              ) : (
                <Button variant="destructive" size="sm" onClick={() => setDeleteGoalOpen(true)}>
                  <Trash2 className="size-3.5" /> Delete Goal
                </Button>
              )}
            </DrawerFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete goal confirm */}
      <AlertDialog open={deleteGoalOpen} onOpenChange={setDeleteGoalOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10">
              <TriangleAlert className="size-6 text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete &quot;{goal?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This goal and all its contributions will be permanently deleted. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => goal && deleteMutation.mutate({ id: goal.id })}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete contribution confirm */}
      <AlertDialog open={!!deleteContribId} onOpenChange={(v) => !v && setDeleteContribId(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10">
              <TriangleAlert className="size-6 text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove contribution?</AlertDialogTitle>
            <AlertDialogDescription>
              This contribution will be permanently deleted and the goal balance will be adjusted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteContribMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteContribMutation.isPending}
              onClick={() => {
                if (!deleteContribId || !goalId) return;
                deleteContribMutation.mutate({ goalId, contributionId: deleteContribId });
              }}
            >
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
