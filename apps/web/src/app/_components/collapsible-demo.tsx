'use client';

import { useState } from 'react';
import { ChevronDownIcon, SlidersHorizontalIcon, ReceiptIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@fintrack/ui/components/atoms/collapsible';
import { Button } from '@fintrack/ui/components/atoms/button';
import { Badge } from '@fintrack/ui/components/atoms/badge';
import { Checkbox } from '@fintrack/ui/components/atoms/checkbox';
import { Text } from '@fintrack/ui/components/atoms/text';
import { cn } from '@ui/lib/utils/cn';

// ---------------------------------------------------------------------------
// Demo 1 — Advanced Filters panel
// ---------------------------------------------------------------------------

function FiltersCollapsible() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-space-2">
          <SlidersHorizontalIcon className="size-4" />
          Advanced Filters
          <ChevronDownIcon
            className={cn(
              'text-text-tertiary duration-smooth size-4 transition-transform',
              open && 'rotate-180',
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="glass-card mt-space-3 rounded-card gap-space-3 p-space-4 flex flex-col">
          <Text variant="caption" color="secondary" className="tracking-wide uppercase">
            Filter by type
          </Text>
          {['Income', 'Expense', 'Transfer', 'Investment'].map((type) => (
            <label key={type} className="gap-space-3 flex cursor-pointer items-center">
              <Checkbox defaultChecked={type !== 'Investment'} />
              <Text variant="body-sm">{type}</Text>
            </label>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Demo 2 — Transaction detail row (table expandable)
// ---------------------------------------------------------------------------

const txDetails = [
  { label: 'Transaction ID', value: 'TXN-20260223-4821' },
  { label: 'Merchant', value: 'Netflix International B.V.' },
  { label: 'Category', value: 'Subscriptions' },
  { label: 'Payment method', value: 'Visa ··· 4821' },
  { label: 'Processing fee', value: '$0.00' },
];

function TransactionCollapsible() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="glass-card rounded-card overflow-hidden"
    >
      <CollapsibleTrigger className="w-full">
        <div className="px-space-5 py-space-4 hover:bg-bg-surface-hover/50 duration-smooth flex items-center justify-between transition-colors">
          <div className="gap-space-3 flex items-center">
            <div className="bg-error/10 rounded-button flex size-9 items-center justify-center">
              <ReceiptIcon className="text-error size-4" />
            </div>
            <div className="text-left">
              <Text variant="body" className="font-medium">
                Netflix Subscription
              </Text>
              <Text variant="body-sm" color="tertiary">
                Feb 23, 2026
              </Text>
            </div>
          </div>
          <div className="gap-space-4 flex items-center">
            <Text variant="body" className="font-medium tabular-nums">
              -$15.99
            </Text>
            <Badge variant="success" dot>
              Paid
            </Badge>
            <ChevronDownIcon
              className={cn(
                'text-text-tertiary duration-smooth size-4 transition-transform',
                open && 'rotate-180',
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-border-subtle/50 px-space-5 py-space-4 gap-x-space-6 gap-y-space-3 grid grid-cols-2 border-t">
          {txDetails.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-[2px]">
              <Text variant="caption" color="tertiary">
                {label}
              </Text>
              <Text variant="body-sm">{value}</Text>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export function CollapsibleDemo() {
  return (
    <div className="flex max-w-lg flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Text variant="overline" color="secondary">
          Collapsible — Filters
        </Text>
        <FiltersCollapsible />
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="overline" color="secondary">
          Collapsible — Transaction Row
        </Text>
        <TransactionCollapsible />
      </div>
    </div>
  );
}
