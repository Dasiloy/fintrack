'use client';

import * as React from 'react';
import { CalendarIcon, ScanLine } from 'lucide-react';
import {
  Button,
  Calendar,
  Field,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@ui/components';
import { AnchoredPopover } from '@ui/components/shared';
import { cn } from '@ui/lib/utils/cn';
import { onlyNumbers } from '@fintrack/utils/format';
import { format } from '@fintrack/utils/date';

import { ReceiptScanPreview } from './receipt_scan_preview';
import type { Phase } from './scan.types';

export interface RightPanelProps {
  phase: Phase;
  file: File | null;
  fileUrl: string | null;
  dotCount: number;
  amount: string;
  setAmount: (v: string) => void;
  type: 'INCOME' | 'EXPENSE';
  setType: (v: 'INCOME' | 'EXPENSE') => void;
  categorySlug: string;
  setCategorySlug: (v: string) => void;
  merchant: string;
  setMerchant: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  dateOpen: boolean;
  setDateOpen: (v: boolean) => void;
  categories: Array<{ slug: string; name: string }>;
  catsLoading: boolean;
}

export function RightPanel({
  phase,
  file,
  fileUrl,
  dotCount,
  amount,
  setAmount,
  type,
  setType,
  categorySlug,
  setCategorySlug,
  merchant,
  setMerchant,
  description,
  setDescription,
  date,
  setDate,
  dateOpen,
  setDateOpen,
  categories,
  catsLoading,
}: RightPanelProps) {
  const isPdf = file?.type === 'application/pdf';

  if (phase === 'idle') {
    return (
      <div className="border-border-subtle flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed md:min-h-0 md:flex-1">
        <div className="bg-bg-surface flex size-14 items-center justify-center rounded-2xl">
          <ScanLine className="text-text-disabled size-7" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-[13px] font-medium">Ready to scan</p>
          <p className="text-text-disabled mt-0.5 text-[12px]">
            Upload a receipt on the left to get started
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'uploading') {
    return (
      <div key="uploading" className="animate-in fade-in-0 duration-300 flex flex-col gap-4 md:min-h-0 md:flex-1">
        <ReceiptScanPreview fileUrl={fileUrl} isPdf={isPdf} phase={phase} dotCount={dotCount} />
        <div className="no-scrollbar flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 rounded-lg opacity-60" />
            <Skeleton className="h-10 rounded-lg opacity-60" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg opacity-40" />
        </div>
      </div>
    );
  }

  if (phase === 'scanning') {
    return (
      <div key="scanning" className="animate-in fade-in-0 duration-300 flex flex-col gap-4 md:min-h-0 md:flex-1">
        <ReceiptScanPreview fileUrl={fileUrl} isPdf={isPdf} phase={phase} dotCount={dotCount} />
        <div className="no-scrollbar flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div key="done" className="animate-in fade-in-0 duration-300 flex flex-col gap-4 md:min-h-0 md:flex-1">
      <ReceiptScanPreview fileUrl={fileUrl} isPdf={isPdf} phase={phase} dotCount={dotCount} />

      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label>Amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(onlyNumbers(e.target.value))}
              required
            />
          </Field>
          <Field>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'INCOME' | 'EXPENSE')}>
              <SelectTrigger size="default" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <Label>Category</Label>
          {catsLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <Select value={categorySlug} onValueChange={setCategorySlug}>
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
          )}
        </Field>

        <Field>
          <Label>Date</Label>
          <AnchoredPopover
            open={dateOpen}
            onOpenChange={setDateOpen}
            modal={false}
            contentClassName="w-auto p-0"
            trigger={
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-text-tertiary',
                )}
              >
                <CalendarIcon className="size-4" />
                {date ? format(date, 'MMMM D, YYYY') : 'Pick a date'}
              </Button>
            }
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setDateOpen(false);
              }}
              defaultMonth={date}
            />
          </AnchoredPopover>
        </Field>

        <Field>
          <Label>Merchant</Label>
          <Input
            placeholder="e.g. Shoprite, Netflix"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </Field>

        <Field>
          <Label>Description</Label>
          <Input
            placeholder="Optional note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
