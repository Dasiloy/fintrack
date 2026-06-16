'use client';

import * as React from 'react';
import { CalendarIcon, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { format, parseLocalDate } from '@fintrack/utils/date';
import { onlyNumbers } from '@fintrack/utils/format';
import {
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
  Switch,
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import type { Category } from '@fintrack/database/types';
import { api_client } from '@/lib/trpc_app/api_client';
import {
  DrawerFooter,
  DrawerHeader,
  DrawerSkeleton,
  EditRow,
  inputCls,
  MerchantSelector,
  Row,
  Section,
  SectionLabel,
} from '@/app/_components';
import { FREQUENCIES, frequencyLabel, frequencyShort, toEditState } from '../helpers';
import type { BillEditState } from '../types';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import { isForcedIncomeCategory } from '@fintrack/types/constants/category.constants';

interface BillDrawerProps {
  billId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  /** When true, drawer opens directly in edit mode */
  initialEditMode?: boolean;
  onDeleted?: () => void;
}

export function BillDrawer({
  billId,
  open,
  onOpenChange,
  categories,
  initialEditMode = false,
  onDeleted,
}: BillDrawerProps) {
  const formatCurrency = useFormatCurrency();
  const [editMode, setEditMode] = React.useState(false);
  const [edit, setEdit] = React.useState<BillEditState>({
    name: '',
    amount: '',
    type: 'EXPENSE',
    frequency: 'MONTHLY',
    categorySlug: '',
    startDate: '',
    endDate: '',
    merchant: '',
    description: '',
    reminderEnabled: true,
  });

  const { data, isLoading } = api_client.recurring.getById.useQuery(
    { id: billId! },
    { enabled: !!billId && open },
  );

  const item = data?.data;

  React.useEffect(() => {
    if (item) setEdit(toEditState(item));
  }, [item]);

  React.useEffect(() => {
    if (!open) setEditMode(false);
    else if (initialEditMode) setEditMode(true);
  }, [open, initialEditMode]);

  const utils = api_client.useUtils();

  const updateMutation = api_client.recurring.update.useMutation({
    onSuccess: () => {
      toast.success('Bill updated');
      void utils.recurring.getAll.invalidate();
      void utils.recurring.getSummary.invalidate();
      void utils.recurring.getById.invalidate({ id: item!.id });
      setEditMode(false);
    },
    onError: (err) => toast.error('Failed to save', { description: err.message }),
  });

  const toggleMutation = api_client.recurring.toggle.useMutation({
    onSuccess: (data) => {
      const isNowActive = data.data?.isActive;
      toast.success(isNowActive ? 'Resumed' : 'Paused');
      void utils.recurring.getAll.invalidate();
      void utils.recurring.getSummary.invalidate();
      void utils.recurring.getById.invalidate({ id: item!.id });
    },
    onError: (err) => toast.error('Failed to update status', { description: err.message }),
  });

  const deleteMutation = api_client.recurring.delete.useMutation({
    onSuccess: () => {
      toast.success('Bill deleted');
      void utils.recurring.getAll.invalidate();
      void utils.recurring.getSummary.invalidate();
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (err) => toast.error('Failed to delete', { description: err.message }),
  });

  const handleSave = () => {
    if (!item) return;
    updateMutation.mutate({
      id: item.id,
      name: edit.name || undefined,
      amount: edit.amount ? parseFloat(edit.amount) : undefined,
      type: edit.type as any,
      frequency: edit.frequency as any,
      categorySlug: edit.categorySlug || undefined,
      startDate: edit.startDate || undefined,
      endDate: edit.endDate || undefined,
      merchant: edit.merchant || undefined,
      description: edit.description || undefined,
      reminderEnabled: edit.reminderEnabled,
    });
  };

  const setField = <K extends keyof BillEditState>(key: K, val: BillEditState[K]) =>
    setEdit((s) => ({ ...s, [key]: val }));

  // Forced-income categories (Income, Savings & Investments) lock the type to
  // INCOME. Picking a category (re)defaults the type synchronously.
  const typeLocked = isForcedIncomeCategory(edit.categorySlug);

  const onCategoryChange = (slug: string) =>
    setEdit((s) => ({
      ...s,
      categorySlug: slug,
      type: isForcedIncomeCategory(slug) ? 'INCOME' : 'EXPENSE',
    }));

  const accentColor = item?.category?.color ?? '#6366f1';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        title="Bill Details"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DrawerHeader
          title={editMode ? 'Edit Bill' : 'Bill Details'}
          editMode={editMode}
          onEdit={item ? () => setEditMode(true) : undefined}
          onCancel={() => setEditMode(false)}
          onClose={() => onOpenChange(false)}
        />

        {/* ── Body ── */}
        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <DrawerSkeleton />
          ) : !item ? (
            <div className="text-text-tertiary flex h-40 items-center justify-center text-[13px]">
              Bill not found
            </div>
          ) : editMode ? (
            /* ── Edit mode ── */
            <div className="flex flex-col gap-5 px-6 py-6">
              {/* Type toggle — locked to Income for forced-income categories */}
              <div className="flex gap-2">
                {(['EXPENSE', 'INCOME'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={typeLocked}
                    onClick={() => setField('type', t)}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-[12px] font-medium transition-all',
                      typeLocked ? 'cursor-not-allowed' : 'cursor-pointer',
                      edit.type === t
                        ? t === 'INCOME'
                          ? 'bg-success/10 border-success/25 text-success'
                          : 'bg-error/10 border-error/25 text-error'
                        : 'border-border-light text-text-secondary hover:border-border-light',
                      typeLocked && edit.type !== t && 'opacity-40',
                    )}
                  >
                    {t === 'INCOME' ? 'Income' : 'Expense'}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <SectionLabel>Amount</SectionLabel>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={edit.amount}
                  onChange={(e) => setField('amount', onlyNumbers(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              <Separator className="bg-border-light" />

              {/* Core fields */}
              <div>
                <SectionLabel>Details</SectionLabel>
                <div className="border-border-light divide-border-light divide-y overflow-hidden rounded-lg border">
                  <div className="divide-border-light divide-y px-3">
                    <EditRow label="Name">
                      <input
                        type="text"
                        className={inputCls}
                        value={edit.name}
                        onChange={(e) => setField('name', e.target.value)}
                        placeholder="e.g. Netflix, Rent"
                      />
                    </EditRow>

                    <EditRow label="Frequency">
                      <Select
                        value={edit.frequency}
                        onValueChange={(v) => setField('frequency', v)}
                      >
                        <SelectTrigger size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditRow>

                    <EditRow label="Category">
                      <Select
                        value={edit.categorySlug}
                        onValueChange={onCategoryChange}
                      >
                        <SelectTrigger size="sm" className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.slug} value={cat.slug}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditRow>

                    <EditRow label="Start date">
                      <AnchoredPopover
                        modal={false}
                        contentClassName="w-auto p-0"
                        trigger={
                          <button
                            type="button"
                            className={cn(
                              inputCls,
                              'flex cursor-pointer items-center gap-2 text-left',
                            )}
                          >
                            <CalendarIcon className="text-text-disabled size-3.5 shrink-0" />
                            <span
                              className={
                                edit.startDate ? 'text-text-primary' : 'text-text-disabled'
                              }
                            >
                              {edit.startDate
                                ? format(parseLocalDate(edit.startDate), 'MMM D, YYYY')
                                : 'Pick a date'}
                            </span>
                          </button>
                        }
                      >
                        <Calendar
                          mode="single"
                          selected={edit.startDate ? parseLocalDate(edit.startDate) : undefined}
                          onSelect={(d) => d && setField('startDate', format(d, 'YYYY-MM-DD'))}
                          defaultMonth={edit.startDate ? parseLocalDate(edit.startDate) : undefined}
                        />
                      </AnchoredPopover>
                    </EditRow>

                    <EditRow label="End date">
                      <AnchoredPopover
                        modal={false}
                        contentClassName="w-auto p-0"
                        trigger={
                          <button
                            type="button"
                            className={cn(
                              inputCls,
                              'flex cursor-pointer items-center gap-2 text-left',
                              !edit.endDate && 'text-text-tertiary',
                            )}
                          >
                            <CalendarIcon className="text-text-disabled size-3.5 shrink-0" />
                            <span>
                              {edit.endDate
                                ? format(parseLocalDate(edit.endDate), 'MMM D, YYYY')
                                : 'No end date'}
                            </span>
                          </button>
                        }
                      >
                        <Calendar
                          mode="single"
                          selected={edit.endDate ? parseLocalDate(edit.endDate) : undefined}
                          onSelect={(d) => setField('endDate', d ? format(d, 'YYYY-MM-DD') : '')}
                          defaultMonth={
                            edit.endDate
                              ? parseLocalDate(edit.endDate)
                              : edit.startDate
                                ? parseLocalDate(edit.startDate)
                                : undefined
                          }
                          disabled={(d) => (edit.startDate ? d < parseLocalDate(edit.startDate) : false)}
                        />
                      </AnchoredPopover>
                    </EditRow>

                    <EditRow label="Merchant">
                      <MerchantSelector
                        value={edit.merchant}
                        onChange={(v) => setField('merchant', v)}
                      />
                    </EditRow>

                    <EditRow label="Description">
                      <input
                        type="text"
                        className={inputCls}
                        value={edit.description}
                        onChange={(e) => setField('description', e.target.value)}
                        placeholder="Optional"
                      />
                    </EditRow>

                    <EditRow label="Reminder">
                      <div className="flex w-full items-center justify-end">
                        <Switch
                          checked={edit.reminderEnabled}
                          onCheckedChange={(v) => setField('reminderEnabled', v)}
                        />
                      </div>
                    </EditRow>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="flex flex-col gap-6 px-6 py-6">
              {/* Hero */}
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className="flex size-16 items-center justify-center rounded-2xl text-[22px] font-bold text-white select-none"
                  style={{ background: `color-mix(in srgb, ${accentColor} 85%, #000)` }}
                >
                  {(item.merchant ?? item.name ?? '?')[0]?.toUpperCase()}
                </div>

                <div className="text-center">
                  <h2 className="text-text-primary text-[17px] leading-snug font-semibold">
                    {item.merchant ?? item.name}
                  </h2>
                  {item.merchant && item.merchant !== item.name && (
                    <p className="text-text-tertiary mt-0.5 text-[12px]">{item.name}</p>
                  )}
                  <span
                    className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px] font-medium"
                    style={{
                      background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                      color: accentColor,
                      border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
                    }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: accentColor }} />
                    {item.category?.name ?? 'Uncategorised'}
                  </span>
                </div>

                <p
                  className={cn(
                    'truncate text-[28px] font-bold tracking-tight tabular-nums',
                    item.type === 'EXPENSE' ? 'text-text-primary' : 'text-success',
                  )}
                >
                  {item.type === 'INCOME' ? '+' : ''}
                  {formatCurrency(item.amount)}
                  <span className="text-text-disabled ml-1 text-[14px] font-normal">
                    {frequencyShort(item.frequency)}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  {!item.isActive && (
                    <span className="bg-warning/10 text-warning border-warning/25 inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-medium">
                      Paused
                    </span>
                  )}
                  <span className="text-text-tertiary text-[12px]">
                    {frequencyLabel(item.frequency)}
                  </span>
                </div>
              </div>

              <Separator className="bg-border-light" />

              {/* Schedule */}
              <Section label="Schedule">
                <Row label="Next run">
                  {item.nextRunAt ? format(parseLocalDate(item.nextRunAt.slice(0, 10)), 'MMM D, YYYY') : '—'}
                </Row>
                {item.lastRunAt && (
                  <Row label="Last run">{format(parseLocalDate(item.lastRunAt.slice(0, 10)), 'MMM D, YYYY')}</Row>
                )}
                <Row label="Start date">{format(parseLocalDate(item.startDate.slice(0, 10)), 'MMM D, YYYY')}</Row>
                {item.endDate && (
                  <Row label="End date">{format(parseLocalDate(item.endDate.slice(0, 10)), 'MMM D, YYYY')}</Row>
                )}
              </Section>

              {/* Details */}
              <Section label="Details">
                <Row label="Type">
                  <Badge variant={item.type === 'EXPENSE' ? 'error' : 'success'}>
                    {item.type === 'EXPENSE' ? 'Expense' : 'Income'}
                  </Badge>
                </Row>
                <Row label="Status">
                  <Badge variant={item.isActive ? 'success' : 'secondary'} dot>
                    {item.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </Row>
                <Row label="Reminder">
                  <Badge variant={item.reminderEnabled ? 'success' : 'secondary'} dot>
                    {item.reminderEnabled ? 'On' : 'Off'}
                  </Badge>
                </Row>
                {item.merchant && <Row label="Merchant">{item.merchant}</Row>}
                {item.description && <Row label="Description">{item.description}</Row>}
                {item.notes && <Row label="Notes">{item.notes}</Row>}
                <Row label="Created">{format(new Date(item.createdAt), 'MMM D, YYYY · HH:mm')}</Row>
              </Section>

              {/* Recent transactions */}
              {(item.transactions ?? []).length > 0 && (
                <Section label="Recent Transactions">
                  {(item.transactions ?? []).slice(0, 5).map((tx) => (
                    <Row key={tx.id} label={format(parseLocalDate(tx.date.slice(0,10)), 'MMM D, YYYY')}>
                      <span className={tx.type === 'EXPENSE' ? 'text-error' : 'text-success'}>
                        {tx.type === 'INCOME' ? '+' : ''}
                        {formatCurrency(parseFloat(tx.amount))}
                      </span>
                    </Row>
                  ))}
                </Section>
              )}
            </div>
          )}
        </ScrollArea>

        {/* ── Footer ── */}
        {item && (
          <DrawerFooter>
            {editMode ? (
              <Button
                className="flex-1"
                size="sm"
                loading={updateMutation.isPending}
                disabled={!edit.name || !edit.amount || !edit.categorySlug}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  loading={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate({ id: item.id })}
                >
                  {item.isActive ? (
                    <>
                      <PauseCircle className="size-3.5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayCircle className="size-3.5" />
                      Resume
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ id: item.id })}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </>
            )}
          </DrawerFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
