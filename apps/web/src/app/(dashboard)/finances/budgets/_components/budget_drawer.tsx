'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency, onlyNumbers } from '@fintrack/utils/format';
import {
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  Slider,
  toast,
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

interface BudgetDrawerProps {
  budgetId: string | null;
  initialEditMode?: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

function formatHistoryDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
}

export function BudgetDrawer({
  budgetId,
  initialEditMode = false,
  onOpenChange,
  onDeleted,
}: BudgetDrawerProps) {
  const open = !!budgetId;

  const [editMode, setEditMode] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [alertThresholdPct, setAlertThresholdPct] = React.useState(80);
  const [alertThrottleDays, setAlertThrottleDays] = React.useState(3);

  const { data, isLoading } = api_client.budget.getById.useQuery(
    { id: budgetId! },
    { enabled: open },
  );

  const detail = data?.data;
  const budget = detail?.budget;
  const history = detail?.history ?? [];

  React.useEffect(() => {
    if (!open) {
      setEditMode(false);
      setHistoryOpen(false);
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
      setAlertThrottleDays(3);
    }
  }, [budget]);

  const utils = api_client.useUtils();

  const updateMutation = api_client.budget.update.useMutation({
    onSuccess: () => {
      toast.success('Budget updated');
      void utils.budget.getAll.invalidate();
      void utils.budget.getById.invalidate({ id: budgetId! });
      setEditMode(false);
    },
    onError: (err) => toast.error('Failed to save', { description: err.message }),
  });

  const deleteMutation = api_client.budget.delete.useMutation({
    onSuccess: () => {
      toast.success('Budget deleted');
      void utils.budget.getAll.invalidate();
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (err) => toast.error('Failed to delete', { description: err.message }),
  });

  const handleSave = () => {
    if (!budget) return;
    updateMutation.mutate({
      id: budget.id,
      name,
      amount: parseFloat(amount),
      description: description || undefined,
      alertThreshold: alertThresholdPct / 100,
      alertThrottleDays,
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

  return (
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

              <Separator className="bg-border-subtle" />

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

              <Separator className="bg-border-subtle" />

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
                      value={String(alertThrottleDays)}
                      onChange={(e) => {
                        const n = parseInt(onlyNumbers(e.target.value) || '1', 10);
                        setAlertThrottleDays(Math.min(30, Math.max(1, n)));
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

                <h2 className="text-text-primary text-[17px] leading-snug font-semibold">
                  {budget.name}
                </h2>

                {budget.description && (
                  <p className="text-text-tertiary text-center text-[12px]">{budget.description}</p>
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
                    <span className="text-text-disabled text-[9px] font-medium tracking-wider uppercase">
                      used
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-border-subtle" />

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
                  <Separator className="bg-border-subtle" />
                  <div>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((v) => !v)}
                      className="text-text-secondary hover:text-text-primary flex w-full items-center justify-between pb-1 text-[11px] font-semibold tracking-wider uppercase transition-colors"
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
                      <ol className="border-border-subtle relative ml-[7px] mt-4 border-l">
                        {[...history].reverse().map((entry) => {
                          const isCurrent = !entry.endDate;
                          return (
                            <li key={entry.id} className="relative mb-5 ml-6 last:mb-0">
                              <span
                                className={cn(
                                  'ring-offset-bg-elevated absolute top-1 -left-[25px] size-3 rounded-full ring-2 ring-offset-2',
                                  isCurrent
                                    ? 'bg-primary ring-primary/30'
                                    : 'bg-bg-surface-hover ring-border-subtle',
                                )}
                              />
                              <p className="text-text-tertiary mb-0.5 text-[11px] font-medium tracking-wide uppercase">
                                {formatHistoryDate(entry.startDate)}
                                {entry.endDate
                                  ? ` → ${formatHistoryDate(entry.endDate)}`
                                  : ' · current'}
                              </p>
                              <p className="text-text-primary text-[15px] font-bold tabular-nums">
                                {formatCurrency(entry.limit)}
                                <span className="text-text-tertiary ml-1 text-[11px] font-normal">
                                  / {budget.period?.toLowerCase() ?? 'month'}
                                </span>
                              </p>
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
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate({ id: budget.id })}
              >
                <Trash2 className="size-3.5" />
                Delete Budget
              </Button>
            )}
          </DrawerFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
