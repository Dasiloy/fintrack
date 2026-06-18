'use client';

import * as React from 'react';
import { format } from '@fintrack/utils/date';
import { Trash2, TriangleAlert } from 'lucide-react';
import { onlyNumbers } from '@fintrack/utils/format';
import {
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  Slider,
  toast,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
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
import { RING_RADIUS, RING_STROKE, RING_CIRCUMFERENCE, ringColorClass } from '../helpers';
import { useFormatCurrency } from '@/hooks/use_format_currency';

interface BudgetDrawerProps {
  budgetId: string | null;
  initialEditMode?: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  selectedMonth: Date;
}

export function BudgetDrawer({
  budgetId,
  initialEditMode = false,
  onOpenChange,
  onDeleted,
  selectedMonth,
}: BudgetDrawerProps) {
  const formatCurrency = useFormatCurrency();
  const open = !!budgetId;

  const [editMode, setEditMode] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = React.useState(false);
  const [hardDeleteConfirm, setHardDeleteConfirmOpen] = React.useState(false);

  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [alertThresholdPct, setAlertThresholdPct] = React.useState(80);
  const [alertAtFrequency, setAlertAtFrequency] = React.useState(2);
  const [alertAtFrequencyInput, setAlertAtFrequencyInput] = React.useState('2');
  const [isHardDelete, setIsHardDelete] = React.useState(false);

  const month = selectedMonth.getMonth();
  const year = selectedMonth.getFullYear();
  const { data, isLoading } = api_client.budget.getById.useQuery(
    { id: budgetId!, month, year },
    { enabled: open },
  );

  const detail = data?.data;
  const budget = detail?.budget;
  const history = detail?.history ?? [];

  React.useEffect(() => {
    if (!open) {
      setEditMode(false);
      setHistoryOpen(false);
      setDeactivateConfirmOpen(false);
    } else if (initialEditMode) {
      setEditMode(true);
    }
  }, [open, initialEditMode]);

  React.useEffect(() => {
    if (budget) {
      setName(budget.name);
      setAmount(String(budget.amount));
      setDescription(budget.description ?? '');
      setAlertThresholdPct(Math.round((budget.alertThreshold ?? 0.8) * 100));
      setAlertAtFrequency(budget.alertAtFrequency);
      setAlertAtFrequencyInput(String(budget.alertAtFrequency));
    }
  }, [budget]);

  const utils = api_client.useUtils();

  const updateMutation = api_client.budget.update.useMutation({
    onSuccess: () => {
      toast.success('Budget updated');
      void utils.budget.getAll.invalidate();
      void utils.budget.getById.invalidate({ id: budgetId!, month, year });
      setEditMode(false);
    },
    onError: (err) => toast.error('Failed to save', { description: err.message }),
  });

  const deleteMutation = api_client.budget.delete.useMutation({
    onSuccess: () => {
      toast.success(`Budget ${isHardDelete ? 'deleted' : 'archived'}`);
      void utils.budget.getAll.invalidate();
      if (isHardDelete) utils.subscription.getGatedUsage.invalidate();
      onOpenChange(false);
      if (isHardDelete) setIsHardDelete(false);
      onDeleted?.();
    },
    onError: (err) => toast.error('Failed to delete', { description: err.message }),
  });

  const handleSave = () => {
    if (!budget) return;
    updateMutation.mutate({
      id: budget.id,
      name,
      month,
      year,
      amount: parseFloat(amount),
      description: description || undefined,
      alertThreshold: alertThresholdPct / 100,
      alertAtFrequency,
    });
  };

  const limit = budget ? Number(budget.amount) : 0;
  const spent = budget ? parseFloat(budget.spent) || 0 : 0;
  const ratio = limit > 0 ? spent / limit : 0;
  const remaining = Math.max(limit - spent, 0);
  const pct = Math.min(Math.round(ratio * 100), 100);
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(ratio, 1));
  const color = budget?.category?.color ?? '#7c7aff';
  const threshold = budget?.alertThreshold ?? 0.8;
  const canSave = !!name && !!amount;

  const isCurrentMonth =
    selectedMonth.getFullYear() === new Date().getFullYear() &&
    selectedMonth.getMonth() === new Date().getMonth();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          title="Budget Details"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DrawerHeader
            title={editMode ? 'Edit Budget' : 'Budget Details'}
            editMode={editMode}
            onEdit={budget ? () => setEditMode(true) : undefined}
            onCancel={() => setEditMode(false)}
            onClose={() => onOpenChange(false)}
          />

          <ScrollArea className="min-h-0 flex-1">
            {isLoading ? (
              <DrawerSkeleton />
            ) : !budget ? (
              <div className="text-text-tertiary flex h-40 items-center justify-center text-[13px]">
                Budget not found
              </div>
            ) : editMode ? (
              /* ── Edit mode ── */
              <div className="flex flex-col gap-5 px-6 py-6">
                <div>
                  <SectionLabel>Amount (₦)</SectionLabel>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={inputCls}
                    value={amount}
                    onChange={(e) => setAmount(onlyNumbers(e.target.value))}
                    placeholder="0.00"
                  />
                </div>

                <Separator className="bg-border-light" />

                <div>
                  <SectionLabel>Details</SectionLabel>
                  <div className="border-border-light divide-border-light divide-y overflow-hidden rounded-lg border">
                    <div className="divide-border-light divide-y px-3">
                      <EditRow label="Name">
                        <input
                          type="text"
                          className={inputCls}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Budget name"
                        />
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

                <Separator className="bg-border-light" />

                <div className="space-y-4">
                  <SectionLabel>Alerts</SectionLabel>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-text-secondary text-[12px]">Alert threshold</span>
                      <span className="text-text-secondary text-xs tabular-nums">
                        {alertThresholdPct}%
                      </span>
                    </div>
                    <Slider
                      min={10}
                      max={100}
                      step={5}
                      value={[alertThresholdPct]}
                      onValueChange={([v]) => setAlertThresholdPct(v!)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-[12px]">Re-alert every</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        className={cn(inputCls, 'w-14 text-center')}
                        value={alertAtFrequencyInput}
                        onChange={(e) => setAlertAtFrequencyInput(onlyNumbers(e.target.value))}
                        onBlur={() => {
                          const clamped = Math.min(
                            30,
                            Math.max(1, parseInt(alertAtFrequencyInput || '1', 10)),
                          );
                          setAlertAtFrequency(clamped);
                          setAlertAtFrequencyInput(String(clamped));
                        }}
                      />
                      <span className="text-text-secondary text-[12px]">days</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="flex flex-col gap-6 px-6 py-6">
                {/* Hero */}
                <div className="flex flex-col items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px] font-medium"
                    style={{
                      background: `color-mix(in srgb, ${color} 12%, transparent)`,
                      color,
                      border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                    }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: color }} />
                    {budget.category?.name ?? 'Uncategorised'}
                  </span>

                  {budget.deactivatedAt && (
                    <span className="text-warning bg-warning/10 rounded-full px-2 py-0.5 text-[10px] font-medium">
                      Inactive from {format(budget.deactivatedAt, 'MMM YYYY')}
                    </span>
                  )}

                  <h2 className="text-text-primary text-[17px] leading-snug font-semibold">
                    {budget.name}
                  </h2>

                  {budget.description && (
                    <p className="text-text-tertiary text-center text-[12px]">
                      {budget.description}
                    </p>
                  )}

                  {/* Ring */}
                  <div className="relative flex items-center justify-center">
                    <svg
                      width="96"
                      height="96"
                      viewBox="0 0 96 96"
                      fill="none"
                      className={cn('-rotate-90', ringColorClass(ratio, threshold))}
                    >
                      <circle
                        cx="48"
                        cy="48"
                        r={RING_RADIUS}
                        stroke="currentColor"
                        strokeWidth={RING_STROKE}
                        className="opacity-15"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r={RING_RADIUS}
                        stroke="currentColor"
                        strokeWidth={RING_STROKE}
                        strokeLinecap="round"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={offset}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span
                        className={cn(
                          'text-[18px] leading-none font-bold tabular-nums',
                          ringColorClass(ratio, threshold),
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border-light" />

                {/* Spending */}
                <Section label="Spending">
                  <Row label="Spent">{formatCurrency(spent)}</Row>
                  <Row label="Limit">{formatCurrency(limit)}</Row>
                  <Row label="Remaining">
                    <span className={ratio >= 1 ? 'text-error font-medium' : ''}>
                      {ratio >= 1 ? 'Over limit' : formatCurrency(remaining)}
                    </span>
                  </Row>
                  <Row label="Period">{budget.period}</Row>
                </Section>

                {/* Alert */}
                <Section label="Alerts">
                  <Row label="Threshold">{Math.round((budget.alertThreshold ?? 0.8) * 100)}%</Row>
                </Section>

                {/* History — expandable */}
                {history.length > 0 && (
                  <>
                    <Separator className="bg-border-light" />
                    <div>
                      <button
                        type="button"
                        onClick={() => setHistoryOpen((v) => !v)}
                        className="text-text-secondary hover:text-text-primary flex w-full cursor-pointer items-center justify-between pb-1 text-[11px] font-semibold tracking-wider uppercase transition-colors"
                      >
                        <span>Limit History</span>
                        <span
                          className={cn(
                            'text-[10px] transition-transform duration-200',
                            historyOpen ? 'rotate-180' : '',
                          )}
                        >
                          ▾
                        </span>
                      </button>

                      {historyOpen && (
                        <ol className="mt-4">
                          {history.map((entry, index) => {
                            const isCurrent = !entry.endDate;
                            const isLast = index === history.length - 1;
                            return (
                              <li key={entry.id} className="flex gap-3">
                                {/* Rail: dot + connecting line to next entry */}
                                <div className="flex flex-col items-center">
                                  <span
                                    className={cn(
                                      'ring-offset-bg-elevated mt-[3px] size-2.5 shrink-0 rounded-full ring-2 ring-offset-2',
                                      isCurrent
                                        ? 'bg-primary ring-primary/30'
                                        : 'bg-bg-muted ring-border-subtle',
                                    )}
                                  />
                                  {!isLast && (
                                    <div className="bg-border-light my-1.5 w-px flex-1" />
                                  )}
                                </div>
                                {/* Content */}
                                <div className={cn('min-w-0', !isLast && 'pb-5')}>
                                  <p className="text-text-tertiary mb-1 text-[11px] font-medium tracking-wide uppercase">
                                    {format(entry.startDate, 'MMM YYYY')}
                                    {!isCurrent &&
                                      entry.endDate &&
                                      ` → ${format(entry.endDate, 'MMM YYYY')}`}
                                  </p>
                                  <p className="text-text-primary text-[15px] font-bold tabular-nums">
                                    {formatCurrency(entry.limit)}
                                    <span className="text-text-tertiary ml-1 text-[11px] font-normal">
                                      / {budget.period?.toLowerCase() ?? 'month'}
                                    </span>
                                  </p>
                                  {isCurrent && (
                                    <span className="text-primary bg-primary/10 mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium">
                                      Current
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {budget && (
            <DrawerFooter>
              {editMode ? (
                <Button
                  className="flex-1"
                  size="sm"
                  loading={updateMutation.isPending}
                  disabled={!canSave}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              ) : (
                <>
                  {/* Deactivate only available when viewing the current month */}
                  {isCurrentMonth && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="border-warning/40 text-warning hover:bg-warning/10 flex-1"
                      loading={deleteMutation.isPending && !isHardDelete}
                      onClick={() => setDeactivateConfirmOpen(true)}
                    >
                      Deactivate
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className={isCurrentMonth ? '' : 'flex-1'}
                    onClick={() => {
                      setIsHardDelete(true);
                      setHardDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete All
                  </Button>
                </>
              )}
            </DrawerFooter>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deactivateConfirmOpen} onOpenChange={setDeactivateConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              <TriangleAlert className="text-warning size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Deactivate &quot;{budget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This budget will stop tracking from the current month onwards. Spending history is
              preserved and the budget can be restored at any time from archived budgets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending && !isHardDelete}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="secondary"
              className="border-warning/40 text-warning hover:bg-warning/10"
              loading={deleteMutation.isPending && !isHardDelete}
              onClick={() => {
                setIsHardDelete(false);
                deleteMutation.mutate({ id: budget?.id!, hardDelete: false });
              }}
            >
              Deactivate
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {hardDeleteConfirm && (
        <AlertDialog
          open={hardDeleteConfirm}
          onOpenChange={(v) => {
            setHardDeleteConfirmOpen(v);
            if (!v) setIsHardDelete(false);
          }}
        >
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-red-500/10">
                <TriangleAlert className="size-6 text-red-400" />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete &quot;{budget?.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This budget will be permanently deleted. Past Months budget will also be deleted. If
                you want to keep this budget history simply deactivate it instaed
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending && isHardDelete}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending && isHardDelete}
                onClick={() => deleteMutation.mutate({ id: budget?.id!, hardDelete: true })}
                loading={deleteMutation.isPending && isHardDelete}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
