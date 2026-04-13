'use client';

import * as React from 'react';
import { format } from '@fintrack/utils/date';
import { capitalize, formatCurrency, onlyNumbers } from '@fintrack/utils/format';
import { Trash2 } from 'lucide-react';
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
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import type { Category } from '@fintrack/database/types';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';
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

// ---------------------------------------------------------------------------
// Edit state shape
// ---------------------------------------------------------------------------

interface EditState {
  amount: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  categorySlug: string;
  merchant: string;
  description: string;
  notes: string;
}

function toEditState(tx: Transaction): EditState {
  return {
    amount: String(parseFloat(tx.amount)),
    date: format(new Date(tx.date), 'YYYY-MM-DD'),
    type: tx.type as EditState['type'],
    categorySlug: tx.category?.slug ?? '',
    merchant: tx.merchant ?? '',
    description: tx.description ?? '',
    notes: tx.notes ?? '',
  };
}

// ---------------------------------------------------------------------------
// TransactionDrawer
// ---------------------------------------------------------------------------

interface TransactionDrawerProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onDeleted?: () => void;
}

export function TransactionDrawer({
  transactionId,
  open,
  onOpenChange,
  categories,
  onDeleted,
}: TransactionDrawerProps) {
  const [editMode, setEditMode] = React.useState(false);
  const [edit, setEdit] = React.useState<EditState>({
    amount: '',
    date: '',
    type: '' as EditState['type'],
    categorySlug: '',
    merchant: '',
    description: '',
    notes: '',
  });

  const { data, isLoading } = api_client.transaction.getById.useQuery(
    { id: transactionId! },
    { enabled: !!transactionId && open },
  );

  const transaction = data?.data;

  React.useEffect(() => {
    if (transaction) setEdit(toEditState(transaction));
  }, [transaction]);

  React.useEffect(() => {
    if (!open) setEditMode(false);
  }, [open]);

  const utils = api_client.useUtils();

  const updateMutation = api_client.transaction.update.useMutation({
    onSuccess: () => {
      toast.success('Transaction updated');
      utils.transaction.getAll.invalidate();
      utils.transaction.getById.invalidate({ id: transaction!.id });
      setEditMode(false);
    },
    onError: (err) => toast.error('Failed to save', { description: err.message }),
  });

  const deleteMutation = api_client.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success('Transaction deleted');
      utils.transaction.getAll.invalidate();
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (err) => toast.error('Error', { description: err.message }),
  });

  const handleSave = () => {
    if (!transaction) return;
    updateMutation.mutate({
      id: transaction.id,
      amount: parseFloat(edit.amount),
      date: edit.date,
      type: edit.type,
      categorySlug: edit.categorySlug,
      merchant: edit.merchant || undefined,
      description: edit.description || undefined,
      notes: edit.notes || undefined,
    });
  };

  const setField = <K extends keyof EditState>(key: K, val: EditState[K]) =>
    setEdit((s) => ({ ...s, [key]: val }));

  const isExpense = (tx: Transaction) => tx.type === 'EXPENSE';
  const categoryColor = transaction?.category?.color ?? '#6366f1';
  const selectedCategoryColor =
    categories.find((c) => c.slug === edit.categorySlug)?.color ?? categoryColor;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        title="Transaction Details"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DrawerHeader
          title={editMode ? 'Edit Transaction' : 'Transaction Details'}
          editMode={editMode}
          onEdit={transaction ? () => setEditMode(true) : undefined}
          onCancel={() => setEditMode(false)}
          onClose={() => onOpenChange(false)}
        />

        {/* ── Body ── */}
        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <DrawerSkeleton />
          ) : !transaction ? (
            <div className="text-text-tertiary flex h-40 items-center justify-center text-[13px]">
              Transaction not found
            </div>
          ) : editMode ? (
            /* ── Edit mode ── */
            <div className="flex flex-col gap-5 px-6 py-6">
              {/* Type toggle */}
              <div className="flex gap-2">
                {(['INCOME', 'EXPENSE'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setField('type', t)}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg border py-2 text-[12px] font-medium transition-all',
                      edit.type === t
                        ? t === 'INCOME'
                          ? 'bg-success/10 border-success/25 text-success'
                          : 'bg-error/10 border-error/25 text-error'
                        : 'border-border-subtle text-text-secondary hover:border-border-light',
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

              <Separator className="bg-border-subtle" />

              {/* Core fields */}
              <div>
                <SectionLabel>Details</SectionLabel>
                <div className="border-border-subtle divide-border-subtle divide-y overflow-hidden rounded-lg border">
                  <div className="divide-border-subtle divide-y px-3">
                    <EditRow label="Category">
                      <Select
                        value={edit.categorySlug}
                        onValueChange={(v) => setField('categorySlug', v)}
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

                    <EditRow label="Date">
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
                              className={edit.date ? 'text-text-primary' : 'text-text-disabled'}
                            >
                              {edit.date
                                ? format(new Date(edit.date), 'MMM D, YYYY')
                                : 'Pick a date'}
                            </span>
                          </button>
                        }
                      >
                        <Calendar
                          mode="single"
                          selected={edit.date ? new Date(edit.date) : undefined}
                          onSelect={(d) => d && setField('date', format(d, 'YYYY-MM-DD'))}
                          defaultMonth={edit.date ? new Date(edit.date) : undefined}
                        />
                      </AnchoredPopover>
                    </EditRow>

                    <EditRow label="Merchant">
                      <input
                        type="text"
                        className={inputCls}
                        value={edit.merchant}
                        onChange={(e) => setField('merchant', e.target.value)}
                        placeholder="e.g. Shoprite, Netflix"
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
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <SectionLabel>Notes</SectionLabel>
                <textarea
                  className={cn(
                    'border-border-subtle bg-bg-surface text-text-primary placeholder:text-text-disabled',
                    'focus:border-primary/40 w-full resize-none rounded-md border px-2.5 py-2 text-[12px] transition-colors focus:outline-none',
                  )}
                  rows={4}
                  value={edit.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Add notes about this transaction…"
                />
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="flex flex-col gap-6 px-6 py-6">
              {/* Hero */}
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className="flex size-16 items-center justify-center rounded-2xl text-[22px] font-bold text-white"
                  style={{ background: `color-mix(in srgb, ${selectedCategoryColor} 85%, #000)` }}
                >
                  {(transaction.merchant ??
                    transaction.description ??
                    transaction.category?.name ??
                    'T')[0]?.toUpperCase()}
                </div>

                <div className="text-center">
                  <h2 className="text-text-primary text-[17px] leading-snug font-semibold">
                    {transaction.merchant ?? transaction.description ?? 'Transaction'}
                  </h2>
                  <span
                    className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px] font-medium"
                    style={{
                      background: `color-mix(in srgb, ${selectedCategoryColor} 12%, transparent)`,
                      color: selectedCategoryColor,
                      border: `1px solid color-mix(in srgb, ${selectedCategoryColor} 25%, transparent)`,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: selectedCategoryColor }}
                    />
                    {transaction.category?.name ?? 'Uncategorised'}
                  </span>
                </div>

                <p
                  className={cn(
                    'text-[28px] font-bold tracking-tight',
                    isExpense(transaction) ? 'text-error' : 'text-success',
                  )}
                >
                  {formatCurrency(parseFloat(transaction.amount))}
                </p>
                <p className="text-text-tertiary text-[12px]">
                  {format(new Date(transaction.date), 'MMM D, YYYY')}
                </p>
              </div>

              <Separator className="bg-border-subtle" />

              {/* Core details */}
              <Section label="Details">
                <Row label="Status">
                  <Badge
                    variant={transaction.bankTransactionStatus === 'FAILED' ? 'error' : 'success'}
                    dot
                  >
                    {capitalize(transaction.bankTransactionStatus ?? 'COMPLETED')}
                  </Badge>
                </Row>
                <Row label="Type">
                  <Badge variant={isExpense(transaction) ? 'error' : 'success'}>
                    {isExpense(transaction) ? 'Expense' : 'Income'}
                  </Badge>
                </Row>
                <Row label="Source">{capitalize(transaction.source)}</Row>
                <Row label="Date">
                  {(() => {
                    try {
                      return format(new Date(transaction.date), 'MMM D, YYYY');
                    } catch {
                      return transaction.date;
                    }
                  })()}
                </Row>
                <Row label="Created">
                  {format(new Date(transaction.createdAt), 'MMM D, YYYY · HH:mm')}
                </Row>
                <Row label="Updated">
                  {format(new Date(transaction.updatedAt), 'MMM D, YYYY · HH:mm')}
                </Row>
                {transaction.description && (
                  <Row label="Description">{transaction.description}</Row>
                )}
                {transaction.notes && <Row label="Notes">{transaction.notes}</Row>}
              </Section>

              {/* Bank account */}
              {(transaction.bank?.bankName || transaction.bank?.accountName) && (
                <Section label="Bank Account">
                  {transaction.bank.bankName && <Row label="Bank">{transaction.bank.bankName}</Row>}
                  {transaction.bank.accountName && (
                    <Row label="Account Name">{transaction.bank.accountName}</Row>
                  )}
                  {transaction.bank.accountNumber && (
                    <Row label="Account No." mono>
                      {transaction.bank.accountNumber}
                    </Row>
                  )}
                </Section>
              )}

              {/* Split */}
              {transaction.split && (
                <Section label="Split">
                  <Row label="Name">{transaction.split.name}</Row>
                  <Row label="Amount">
                    <span className="text-error">
                      −{formatCurrency(parseFloat(transaction.split.amount))}
                    </span>
                  </Row>
                  <Row label="Status">
                    <Badge variant="secondary">{capitalize(transaction.split.status)}</Badge>
                  </Row>
                </Section>
              )}

              {/* Goal contribution */}
              {transaction.goalContribution && (
                <Section label="Goal Contribution">
                  <Row label="Amount">
                    {formatCurrency(parseFloat(transaction.goalContribution.amount))}
                  </Row>
                  <Row label="Date">
                    {format(new Date(transaction.goalContribution.date), 'MMM D, YYYY · HH:mm')}
                  </Row>
                  {transaction.goalContribution.description && (
                    <Row label="Description">{transaction.goalContribution.description}</Row>
                  )}
                  {transaction.goalContribution.notes && (
                    <Row label="Notes">{transaction.goalContribution.notes}</Row>
                  )}
                </Section>
              )}

              {/* Source metadata */}
              {(transaction.bankTransactionId || transaction.sourceData) && (
                <Section label="Source Metadata">
                  {transaction.bankTransactionId && (
                    <Row label="Bank Tx ID" mono>
                      {transaction.bankTransactionId}
                    </Row>
                  )}
                  {transaction.sourceData && (
                    <Row label="Source Data" mono>
                      {transaction.sourceData}
                    </Row>
                  )}
                </Section>
              )}

              {/* Reference */}
              <Section label="Reference">
                <Row label="Source ID" mono>
                  {transaction.sourceId}
                </Row>
              </Section>
            </div>
          )}
        </ScrollArea>

        {transaction && (
          <DrawerFooter>
            {editMode ? (
              <Button
                className="flex-1"
                size="sm"
                loading={updateMutation.isPending}
                disabled={!edit.amount || !edit.categorySlug || !edit.date}
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
                onClick={() => deleteMutation.mutate({ id: transaction.id })}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
          </DrawerFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
