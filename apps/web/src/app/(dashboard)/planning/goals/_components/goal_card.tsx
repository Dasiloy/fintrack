'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  PlusCircle,
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
  Bar,
  BarChart,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ResponsiveContainer,
  toast,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';

import { format } from '@fintrack/utils/date';
import type { Goal } from '@fintrack/types/protos/finance/goal';
import { progressBarColor, priorityVariant, statusVariant, statusLabel } from '../helpers';
import { useFormatCurrency } from '@/hooks/use_format_currency';

interface GoalCardProps {
  goal: Goal;
  onOpen: (id: string) => void;
  onAddFunds: (id: string) => void;
  onEdit: (id: string) => void;
}

export function GoalCard({ goal, onOpen, onAddFunds, onEdit }: GoalCardProps) {
  const formatCurrency = useFormatCurrency();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const utils = api_client.useUtils();

  const deleteMutation = api_client.goal.delete.useMutation({
    onSuccess: () => {
      toast.success('Goal deleted');
      void utils.goal.getAll.invalidate();
      void utils.goal.getAggregate.invalidate();
      void utils.subscription.getGatedUsage.invalidate();
    },
    onError: (err) => toast.error('Failed to delete goal', { description: err.message }),
  });

  const updateStatusMutation = api_client.goal.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'ON_HOLD' ? 'Goal paused' : 'Goal resumed');
      void utils.goal.getAll.invalidate();
      void utils.goal.getAggregate.invalidate();
    },
    onError: (err) => toast.error('Failed to update status', { description: err.message }),
  });

  const contributed = goal.contributedAmount ?? 0;
  const target = goal.targetAmount;
  const pct = target > 0 ? Math.min(Math.round((contributed / target) * 100), 100) : 0;
  const isActive = goal.status === 'ACTIVE';
  const isCompleted = goal.status === 'COMPLETED';

  // Only use actual contribution months — no zero padding, so bars are tight and meaningful
  const chartData = React.useMemo(() => {
    const sorted = [...(goal.monthlyContributions ?? [])].sort((a, b) =>
      a.month.localeCompare(b.month),
    );
    return sorted.slice(-6).map((m) => ({ month: m.month.slice(5), amt: m.amount }));
  }, [goal.monthlyContributions]);

  const barFill = isCompleted
    ? '#22c55e'
    : pct >= 90
      ? '#34d399'
      : pct >= 50
        ? '#fbbf24'
        : 'var(--color-primary, #7c7aff)';

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(goal.id)}
        onKeyDown={(e) => e.key === 'Enter' && onOpen(goal.id)}
        className="border-border-subtle bg-bg-surface group focus-visible:ring-primary/40 relative flex cursor-pointer flex-col gap-0 rounded-xl border transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2 p-4 pb-3">
          <div className="min-w-0 flex-1">
            <p className="text-text-primary truncate text-[13px] leading-tight font-semibold">
              {goal.name}
            </p>
            <p className="text-text-tertiary mt-0.5 text-[11px]">
              Target: {format(new Date(goal.targetDate), 'MMM D, YYYY')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!isActive ? (
              <Badge variant={statusVariant(goal.status)} className="text-[10px]">
                {statusLabel(goal.status)}
              </Badge>
            ) : (
              <Badge variant={priorityVariant(goal.priority)} className="text-[10px]">
                {goal.priority}
              </Badge>
            )}

            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'text-text-disabled hover:text-text-primary hover:bg-bg-surface-hover flex size-6 cursor-pointer items-center justify-center rounded transition-all outline-none',
                    'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                  )}
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-md p-1.5">
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onOpen(goal.id);
                  }}
                >
                  <MoreHorizontal className="size-3.5 shrink-0" />
                  View
                </DropdownMenuItem>
                {!isCompleted && (
                  <DropdownMenuItem
                    className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onAddFunds(goal.id);
                    }}
                  >
                    <PlusCircle className="size-3.5 shrink-0" />
                    Add Funds
                  </DropdownMenuItem>
                )}
                {!isCompleted && (
                  <DropdownMenuItem
                    className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                    disabled={updateStatusMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      updateStatusMutation.mutate({
                        id: goal.id,
                        status: isActive ? 'ON_HOLD' : 'ACTIVE',
                      });
                    }}
                  >
                    <Pause className="size-3.5 shrink-0" />
                    {isActive ? 'Pause' : 'Resume'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(goal.id);
                  }}
                >
                  <Pencil className="size-3.5 shrink-0" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="size-3.5 shrink-0" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="px-4 pb-3">
          <div className="mb-2 flex items-baseline justify-between gap-1">
            <div className="flex min-w-0 items-baseline gap-1.5 overflow-hidden">
              <span className="text-text-primary min-w-0 truncate text-[17px] leading-none font-bold tabular-nums">
                {formatCurrency(contributed)}
              </span>
              <span className="text-text-disabled shrink-0 text-[11px] tabular-nums">
                /{formatCurrency(target)}
              </span>
            </div>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                isCompleted
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : pct >= 90
                    ? 'bg-emerald-400/15 text-emerald-400'
                    : pct >= 50
                      ? 'bg-amber-400/15 text-amber-400'
                      : 'bg-primary/15 text-primary',
              )}
            >
              {pct}%
            </span>
          </div>
          <div className="bg-border-light h-2 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progressBarColor(pct, goal.status),
              )}
              style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>

        {/* ── Contribution history chart ── */}
        <div className="px-4 pb-3">
          <p className="text-text-disabled mb-1.5 text-[9px] font-semibold tracking-widest uppercase">
            Contribution History
          </p>
          <div className="h-7 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  barCategoryGap={2}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <Bar dataKey="amt" fill={barFill} opacity={0.75} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-end gap-0.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-bg-muted flex-1 rounded-sm"
                    style={{ height: `${15 + i * 5}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Add Funds button ── */}
        {!isCompleted && (
          <div className="border-border-light border-t px-4 py-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddFunds(goal.id);
              }}
              className="text-text-tertiary hover:text-text-primary flex w-full cursor-pointer items-center justify-center gap-1.5 text-[12px] font-medium transition-colors"
            >
              <Plus className="size-3.5" />
              Add Funds
            </button>
          </div>
        )}
        {isCompleted && (
          <div className="border-border-light border-t px-4 py-2.5 text-center">
            <span className="text-[11px] font-semibold text-emerald-400">Goal Completed</span>
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10">
              <TriangleAlert className="size-6 text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete &quot;{goal.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This goal and all its contributions will be permanently deleted. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id: goal.id })}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
