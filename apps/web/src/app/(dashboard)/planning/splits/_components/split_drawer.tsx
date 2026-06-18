'use client';

import * as React from 'react';
import { CalendarIcon, ChevronDown, ChevronUp, Plus, Trash2, TriangleAlert } from 'lucide-react';
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
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  Calendar,
  toast,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { onlyNumbers } from '@fintrack/utils/format';
import { format } from '@fintrack/utils/date';
import type { Split, SplitParticipant } from '@fintrack/types/protos/finance/split';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { useProGate } from '@/hooks/use_pro_gate';
import { ProGateModal } from '@/app/_components/pro_gate_modal';
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
import { progressBarColor, statusLabel, statusVariant, today } from '../helpers';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import { TransactionPicker, type LinkedTransaction } from './transaction_picker';

// ---------------------------------------------------------------------------
// Settlement form — expands inline below each participant
// ---------------------------------------------------------------------------

interface SettlementFormProps {
  splitId: string;
  participantId: string;
  maxAmount: number;
  onDone: () => void;
}

function SettlementForm({ splitId, participantId, maxAmount, onDone }: SettlementFormProps) {
  const formatCurrency = useFormatCurrency();
  const [amount, setAmount] = React.useState('');
  const [linkedTx, setLinkedTx] = React.useState<LinkedTransaction | null>(null);
  const [paidAt, setPaidAt] = React.useState<Date>(today());
  const [calOpen, setCalOpen] = React.useState(false);

  const utils = api_client.useUtils();

  const mutation = api_client.split.paySettlement.useMutation({
    onSuccess: () => {
      toast.success('Payment recorded');
      void utils.split.getAll.invalidate();
      void utils.split.getById.invalidate({ id: splitId });
      void utils.split.getAggregate.invalidate();
      onDone();
    },
    onError: (err) => toast.error('Failed to record payment', { description: err.message }),
  });

  const parsedAmount = linkedTx ? parseFloat(linkedTx.amount) || 0 : parseFloat(amount) || 0;
  const canSubmit = parsedAmount > 0 && parsedAmount <= maxAmount && !mutation.isPending;

  return (
    <div className="border-border-light mt-2 rounded-lg border p-3">
      <p className="text-text-disabled mb-2 text-[10px] font-semibold tracking-wider uppercase">
        Record Payment
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {linkedTx ? (
            <input
              readOnly
              className={cn(inputCls, 'flex-1 cursor-not-allowed opacity-70')}
              value={formatCurrency(parseFloat(linkedTx.amount))}
            />
          ) : (
            <input
              type="text"
              inputMode="decimal"
              placeholder={`Amount (max ${formatCurrency(maxAmount)})`}
              value={amount}
              onChange={(e) => setAmount(onlyNumbers(e.target.value))}
              className={cn(inputCls, 'flex-1')}
            />
          )}
          <AnchoredPopover
            open={calOpen}
            onOpenChange={setCalOpen}
            modal={false}
            contentClassName="w-auto p-0"
            trigger={
              <button
                type="button"
                className={cn(
                  inputCls,
                  'flex w-32 shrink-0 cursor-pointer items-center gap-1.5 text-left',
                )}
              >
                <CalendarIcon className="text-text-disabled size-3 shrink-0" />
                <span className="truncate">{format(paidAt, 'MMM D, YYYY')}</span>
              </button>
            }
          >
            <Calendar
              mode="single"
              selected={paidAt}
              onSelect={(d) => {
                if (d) setPaidAt(d);
                setCalOpen(false);
              }}
              defaultMonth={paidAt}
              disabled={(d) => d > today()}
            />
          </AnchoredPopover>
        </div>
        <TransactionPicker type="INCOME" value={linkedTx} onChange={setLinkedTx} />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDone}
            className="text-text-tertiary hover:text-text-primary text-[11px] transition-colors"
          >
            Cancel
          </button>
          <Button
            size="xs"
            loading={mutation.isPending}
            disabled={!canSubmit}
            onClick={() =>
              mutation.mutate({
                splitId,
                participantId,
                paidAmount: parsedAmount,
                paidAt: format(paidAt, 'YYYY-MM-DD'),
                transactionId: linkedTx?.id,
              })
            }
          >
            Record
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Participant row — view mode
// ---------------------------------------------------------------------------

interface ParticipantRowProps {
  participant: SplitParticipant;
  split: Split;
  isSettled: boolean;
}

function ParticipantRow({ participant, split, isSettled }: ParticipantRowProps) {
  const formatCurrency = useFormatCurrency();
  const [payOpen, setPayOpen] = React.useState(false);
  const [deleteSettlementId, setDeleteSettlementId] = React.useState<string | null>(null);

  const utils = api_client.useUtils();

  const deleteSettlementMutation = api_client.split.deleteSettlement.useMutation({
    onSuccess: () => {
      toast.success('Payment removed');
      void utils.split.getAll.invalidate();
      void utils.split.getById.invalidate({ id: split.id });
      void utils.split.getAggregate.invalidate();
    },
    onError: (err) => toast.error('Failed to remove payment', { description: err.message }),
  });

  const paid = participant.paid ?? 0;
  const balance = participant.balance ?? participant.amount - paid;
  const participantSettled = balance <= 0;

  return (
    <div className="py-2.5">
      {/* Participant header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-text-primary truncate text-[13px] font-semibold">{participant.name}</p>
          {participant.email && (
            <p className="text-text-tertiary text-[11px]">{participant.email}</p>
          )}
        </div>
        <div className="max-w-[45%] min-w-0 text-right">
          <p className="text-text-primary truncate text-[12px] font-semibold tabular-nums">
            {formatCurrency(participant.amount)}
          </p>
          <p className="text-text-tertiary truncate text-[11px] tabular-nums">
            paid {formatCurrency(paid)}
          </p>
        </div>
      </div>

      {/* Balance chip */}
      <div className="mt-1.5 flex items-center justify-between">
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
            participantSettled
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-amber-400/10 text-amber-600',
          )}
        >
          {participantSettled ? 'Settled' : `Owes ${formatCurrency(balance)}`}
        </span>

        {!participantSettled && !isSettled && (
          <button
            type="button"
            onClick={() => setPayOpen((v) => !v)}
            className="text-primary flex cursor-pointer items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-70"
          >
            {payOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            Record Payment
          </button>
        )}
      </div>

      {/* Inline settlement form */}
      {payOpen && (
        <SettlementForm
          splitId={split.id}
          participantId={participant.id}
          maxAmount={balance}
          onDone={() => setPayOpen(false)}
        />
      )}

      {/* Past settlements */}
      {(participant.settlements ?? []).length > 0 && (
        <div className="mt-2 space-y-1.5">
          {(participant.settlements ?? []).map((s) => (
            <div
              key={s.id}
              className="bg-bg-surface flex items-center justify-between rounded-lg px-2.5 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-text-primary text-[11px] font-semibold tabular-nums">
                  {formatCurrency(s.paidAmount)}
                </p>
                <p className="text-text-tertiary text-[10px]">
                  {format(new Date(s.paidAt), 'MMM D, YYYY')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteSettlementId(s.id)}
                className="text-text-disabled hover:text-error ml-2 shrink-0 cursor-pointer transition-colors"
                aria-label="Delete payment"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete settlement confirm */}
      <AlertDialog
        open={!!deleteSettlementId}
        onOpenChange={(o) => !o && setDeleteSettlementId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10">
              <TriangleAlert className="size-6 text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the participant&apos;s balance and recalculate the split status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSettlementMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteSettlementMutation.isPending}
              onClick={() =>
                deleteSettlementMutation.mutate({
                  splitId: split.id,
                  settlementId: deleteSettlementId!,
                })
              }
            >
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Participant edit row — edit mode
// ---------------------------------------------------------------------------

interface ParticipantEditRowProps {
  participant: SplitParticipant;
  splitId: string;
  isSettled: boolean;
}

function ParticipantEditRow({ participant, splitId, isSettled }: ParticipantEditRowProps) {
  const [name, setName] = React.useState(participant.name);
  const [email, setEmail] = React.useState(participant.email ?? '');
  const [amount, setAmount] = React.useState(String(participant.amount));
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const utils = api_client.useUtils();

  const updateMutation = api_client.split.updateParticipant.useMutation({
    onSuccess: () => {
      toast.success('Participant updated');
      void utils.split.getById.invalidate({ id: splitId });
      void utils.split.getAggregate.invalidate();
    },
    onError: (err) => toast.error('Failed to update participant', { description: err.message }),
  });

  const deleteMutation = api_client.split.deleteParticipant.useMutation({
    onSuccess: () => {
      toast.success('Participant removed');
      void utils.split.getAll.invalidate();
      void utils.split.getById.invalidate({ id: splitId });
      void utils.split.getAggregate.invalidate();
    },
    onError: (err) => toast.error('Failed to remove participant', { description: err.message }),
  });

  const isDirty =
    name !== participant.name ||
    email !== (participant.email ?? '') ||
    parseFloat(amount) !== participant.amount;

  const handleSave = () => {
    updateMutation.mutate({
      splitId,
      participantId: participant.id,
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      amount: parseFloat(amount) || undefined,
    });
  };

  return (
    <div
      className={cn('border-border-light rounded-lg border px-3 py-2.5', isSettled && 'opacity-60')}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-text-primary truncate text-[12px] font-semibold">{participant.name}</p>
        {!isSettled && (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="text-text-disabled hover:text-error ml-2 shrink-0 cursor-pointer transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <input
          className={cn(inputCls, isSettled && 'cursor-not-allowed')}
          placeholder="Name"
          value={name}
          disabled={isSettled}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={cn(inputCls, isSettled && 'cursor-not-allowed')}
          placeholder="Email"
          type="email"
          value={email}
          disabled={isSettled}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={cn(inputCls, isSettled && 'cursor-not-allowed')}
          placeholder="Amount (₦)"
          inputMode="decimal"
          value={amount}
          disabled={isSettled}
          onChange={(e) => setAmount(onlyNumbers(e.target.value))}
        />
        {!isSettled && (
          <div className="flex justify-end">
            <Button
              size="xs"
              loading={updateMutation.isPending}
              disabled={!isDirty}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        )}
      </div>
      {isSettled && (
        <p className="text-text-disabled mt-1.5 text-[10px]">
          Settled — participant cannot be edited
        </p>
      )}

      {!isSettled && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-red-500/10">
                <TriangleAlert className="size-6 text-red-400" />
              </AlertDialogMedia>
              <AlertDialogTitle>Remove &quot;{participant.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                All settlements for this participant will also be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate({ splitId, participantId: participant.id })}
              >
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add participant form
// ---------------------------------------------------------------------------

interface AddParticipantFormProps {
  splitId: string;
  onDone: () => void;
  onPlanLimitHit: () => void;
}

function AddParticipantForm({ splitId, onDone, onPlanLimitHit }: AddParticipantFormProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [amount, setAmount] = React.useState('');

  const utils = api_client.useUtils();

  const mutation = api_client.split.addParticipant.useMutation({
    onSuccess: () => {
      toast.success('Participant added');
      void utils.split.getAll.invalidate();
      void utils.split.getById.invalidate({ id: splitId });
      void utils.split.getAggregate.invalidate();
      setName('');
      setEmail('');
      setAmount('');
      onDone();
    },
    onError: (err) => {
      if (err.data?.code === 'FORBIDDEN') {
        onDone();
        onPlanLimitHit();
      } else {
        toast.error('Failed to add participant', { description: err.message });
      }
    },
  });

  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit = name.trim().length > 0 && parsedAmount > 0 && !mutation.isPending;

  return (
    <div className="border-border-light rounded-lg border p-3">
      <p className="text-text-disabled mb-2 text-[10px] font-semibold tracking-wider uppercase">
        New Participant
      </p>
      <div className="flex flex-col gap-1.5">
        <input
          className={inputCls}
          placeholder="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputCls}
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={inputCls}
          placeholder="Amount owed (₦) *"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(onlyNumbers(e.target.value))}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDone}
            className="text-text-tertiary hover:text-text-primary text-[11px] transition-colors"
          >
            Cancel
          </button>
          <Button
            size="xs"
            loading={mutation.isPending}
            disabled={!canSubmit}
            onClick={() => {
              mutation.mutate({
                feature: Usage.MAX_PEOPLE_PER_SPLIT,
                splitId,
                name: name.trim(),
                email: email.trim() || undefined,
                amount: parsedAmount,
              });
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main drawer
// ---------------------------------------------------------------------------

interface SplitDrawerProps {
  splitId: string | null;
  onOpenChange: (open: boolean) => void;
  initialEditMode?: boolean;
}

export function SplitDrawer({ splitId, onOpenChange, initialEditMode = false }: SplitDrawerProps) {
  const formatCurrency = useFormatCurrency();
  const open = !!splitId;
  const [editMode, setEditMode] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editAmount, setEditAmount] = React.useState('');
  // null = no change | 'UNLINK' = remove link | LinkedTransaction = link/relink
  const [editLinkedTx, setEditLinkedTx] = React.useState<LinkedTransaction | 'UNLINK' | null>(null);
  const [addParticipantOpen, setAddParticipantOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Track which split ID we've initialized form values for — prevents a
  // background refetch from overwriting the user's in-progress edits.
  const initializedForRef = React.useRef<string | null>(null);

  const participantGate = useProGate(Usage.MAX_PEOPLE_PER_SPLIT);

  const { data, isLoading } = api_client.split.getById.useQuery(
    { id: splitId! },
    { enabled: !!splitId && open, staleTime: 30 * 1000 },
  );

  const split = data?.data;

  // Initialize form values once per split ID — never overwrite after initial load.
  React.useEffect(() => {
    if (split && initializedForRef.current !== split.id) {
      setEditName(split.name);
      setEditAmount(String(split.amount));
      setEditLinkedTx(
        split.transaction
          ? {
              id: split.transaction.id,
              description: split.transaction.description ?? null,
              merchant: null,
              amount: split.transaction.amount,
              date: split.createdAt,
            }
          : null,
      );
      initializedForRef.current = split.id;
    }
  }, [split]);

  React.useEffect(() => {
    if (!open) {
      setEditMode(false);
      setAddParticipantOpen(false);
      initializedForRef.current = null;
    } else if (initialEditMode) {
      setEditMode(true);
    }
  }, [open, initialEditMode]);

  const utils = api_client.useUtils();

  const updateMutation = api_client.split.update.useMutation({
    onSuccess: () => {
      toast.success('Split updated');
      void utils.split.getAll.invalidate();
      void utils.split.getById.invalidate({ id: split!.id });
      void utils.split.getAggregate.invalidate();
      setEditMode(false);
    },
    onError: (err) => toast.error('Failed to save', { description: err.message }),
  });

  const deleteMutation = api_client.split.delete.useMutation({
    onSuccess: () => {
      toast.success('Split deleted');
      void utils.split.getAll.invalidate();
      void utils.split.getAggregate.invalidate();
      void utils.subscription.getGatedUsage.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to delete split', { description: err.message }),
  });

  const totalPaid = split?.totalPaid ?? 0;
  const amount = split?.amount ?? 0;
  const totalOwed = split?.totalOwed ?? amount - totalPaid;
  const pct = amount > 0 ? Math.min(Math.round((totalPaid / amount) * 100), 100) : 0;
  const isSettled = split?.status === 'SETTLED';

  // Amount edit constraints: new amount must cover both settled payments and
  // participant allocations — whichever is larger.
  const totalAllocated = (split?.participants ?? []).reduce((s, p) => s + p.amount, 0);
  const isFullyAllocated = totalAllocated >= amount - 0.000001;
  const minEditAmount = Math.max(totalPaid, totalAllocated);
  const parsedEditAmount = parseFloat(editAmount) || 0;
  const editAmountInvalid = parsedEditAmount > 0 && parsedEditAmount < minEditAmount - 0.000001;
  const splitNameDirty = !!split && editName.trim() !== split.name;
  const splitAmountDirty = !!split && parsedEditAmount !== split.amount;
  const splitTxDirty =
    editLinkedTx === 'UNLINK' ||
    (typeof editLinkedTx === 'object' &&
      editLinkedTx !== null &&
      editLinkedTx.id !== (split?.transaction?.id ?? null));
  const splitNothingDirty = !splitNameDirty && !splitAmountDirty && !splitTxDirty;

  // When a transaction is linked in edit mode, amount should be readonly
  const editAmountFromTx = editLinkedTx !== null && editLinkedTx !== 'UNLINK' ? editLinkedTx : null;

  const handleSave = () => {
    if (!split || editAmountInvalid || splitNothingDirty) return;
    updateMutation.mutate({
      id: split.id,
      name: splitNameDirty ? editName.trim() : undefined,
      amount: splitAmountDirty ? parsedEditAmount : undefined,
      transactionId:
        editLinkedTx !== null && editLinkedTx !== 'UNLINK' ? editLinkedTx.id : undefined,
      unlinkTransaction: editLinkedTx === 'UNLINK' ? true : undefined,
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          title={split?.name ?? 'Split'}
          className="flex w-full max-w-[420px] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DrawerHeader
            title={split?.name ?? ''}
            editMode={editMode}
            onEdit={() => setEditMode(true)}
            onCancel={() => {
              setEditMode(false);
              if (split) {
                setEditName(split.name);
                setEditAmount(String(split.amount));
                setEditLinkedTx(
                  split.transaction
                    ? {
                        id: split.transaction.id,
                        description: split.transaction.description ?? null,
                        merchant: null,
                        amount: split.transaction.amount,
                        date: split.createdAt,
                      }
                    : null,
                );
              }
            }}
            onClose={() => onOpenChange(false)}
          />

          <ScrollArea className="min-h-0 flex-1">
            {isLoading || !split ? (
              <DrawerSkeleton />
            ) : editMode ? (
              /* ── Edit mode ─────────────────────────────────────── */
              <div className="flex flex-col gap-5 px-6 py-5">
                <div>
                  <SectionLabel>Split Details</SectionLabel>
                  <div className="border-border-light divide-border-light divide-y overflow-hidden rounded-lg border">
                    <div className="divide-border-light divide-y px-3">
                      <EditRow label="Name">
                        <input
                          className={inputCls}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </EditRow>
                      <EditRow label="Amount (₦)">
                        {editAmountFromTx ? (
                          <div>
                            <input
                              readOnly
                              className={cn(inputCls, 'cursor-not-allowed opacity-70')}
                              value={formatCurrency(parseFloat(editAmountFromTx.amount))}
                            />
                            <p className="text-text-disabled mt-0.5 text-[10px]">
                              Amount from linked transaction
                            </p>
                          </div>
                        ) : (
                          <>
                            <input
                              className={cn(inputCls, editAmountInvalid && 'ring-error ring-1')}
                              inputMode="decimal"
                              value={editAmount}
                              onChange={(e) => setEditAmount(onlyNumbers(e.target.value))}
                            />
                            {editAmountInvalid && (
                              <p className="text-error mt-0.5 text-[10px]">
                                Min {formatCurrency(minEditAmount)} (covers settlements &amp;
                                shares)
                              </p>
                            )}
                          </>
                        )}
                      </EditRow>
                      <EditRow label="Linked Expense">
                        <TransactionPicker
                          type="EXPENSE"
                          value={editLinkedTx === 'UNLINK' ? null : editLinkedTx}
                          onChange={(tx) =>
                            setEditLinkedTx(tx === null && split.transaction ? 'UNLINK' : tx)
                          }
                        />
                      </EditRow>
                    </div>
                    <div className="flex justify-end px-3 py-2.5">
                      <Button
                        size="sm"
                        loading={updateMutation.isPending}
                        disabled={editAmountInvalid || splitNothingDirty}
                        onClick={handleSave}
                      >
                        Save Split
                      </Button>
                    </div>
                  </div>
                </div>

                {(split.participants ?? []).length > 0 && (
                  <div>
                    <SectionLabel>Participants</SectionLabel>
                    <p className="text-text-disabled mb-2 text-[11px]">
                      Each participant saves individually — use the row&apos;s Save button.
                    </p>
                    <div className="flex flex-col gap-2">
                      {(split.participants ?? []).map((participant) => (
                        <ParticipantEditRow
                          key={participant.id}
                          participant={participant}
                          splitId={split.id}
                          isSettled={isSettled}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── View mode ─────────────────────────────────────── */
              <div className="flex flex-col gap-5 px-6 py-5">
                {/* Status + date */}
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={statusVariant(split.status)}>{statusLabel(split.status)}</Badge>
                  <span className="text-text-tertiary text-[11px]">
                    Created {format(new Date(split.createdAt), 'MMM D, YYYY')}
                  </span>
                </div>

                {/* Progress */}
                <div>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-text-primary min-w-0 truncate text-[22px] font-bold tabular-nums">
                      {formatCurrency(totalPaid)}
                    </span>
                    <span className="text-text-tertiary shrink-0 text-[12px] tabular-nums">
                      of {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="bg-border-light h-2 w-full overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        progressBarColor(split.status),
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-text-tertiary mt-1 text-[11px]">
                    {pct}% collected · {formatCurrency(totalOwed)} outstanding
                  </p>
                </div>

                {/* Linked transaction */}
                {split.transaction && (
                  <Section label="Linked Expense">
                    <Row label="Transaction">{split.transaction.description ?? '—'}</Row>
                    <Row label="Amount">{formatCurrency(parseFloat(split.transaction.amount))}</Row>
                  </Section>
                )}

                <Separator className="bg-border-light" />

                {/* Participants */}
                <div>
                  <SectionLabel>Participants ({(split.participants ?? []).length})</SectionLabel>
                  {(split.participants ?? []).length === 0 ? (
                    <p className="text-text-disabled text-[12px]">No participants yet.</p>
                  ) : (
                    <div className="border-border-light divide-border-light divide-y rounded-lg border px-3">
                      {(split.participants ?? []).map((participant) => (
                        <ParticipantRow
                          key={participant.id}
                          participant={participant}
                          split={split}
                          isSettled={isSettled}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Add participant */}
                {!isSettled && (
                  <div>
                    {addParticipantOpen ? (
                      <AddParticipantForm
                        splitId={split.id}
                        onDone={() => setAddParticipantOpen(false)}
                        onPlanLimitHit={participantGate.openModal}
                      />
                    ) : isFullyAllocated ? (
                      <p className="text-text-disabled text-[11px]">Split is fully allocated</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          participantGate.triggerGate(() => setAddParticipantOpen(true))
                        }
                        className="text-primary flex items-center gap-1.5 text-[12px] font-medium transition-opacity hover:opacity-70"
                      >
                        <Plus className="size-3.5" />
                        Add Participant
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <DrawerFooter>
            {!editMode && (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Split
              </Button>
            )}
          </DrawerFooter>
        </SheetContent>
      </Sheet>

      {/* Delete split confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10">
              <TriangleAlert className="size-6 text-red-400" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete &quot;{split?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This split and all its participants and settlement records will be permanently
              deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => split && deleteMutation.mutate({ id: split.id })}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProGateModal
        feature={Usage.MAX_PEOPLE_PER_SPLIT}
        open={participantGate.open}
        onClose={participantGate.onClose}
      />
    </>
  );
}
