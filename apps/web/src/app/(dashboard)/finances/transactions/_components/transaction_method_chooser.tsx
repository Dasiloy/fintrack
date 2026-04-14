'use client';

import * as React from 'react';
import { useIsMobile } from '@ui/hooks';
import { cn } from '@ui/lib/utils/cn';
import { useRouter } from 'next/navigation';
import { ChevronRight, Landmark, PenLine, Plus, ScanLine, X } from 'lucide-react';
import { Button, Sheet, SheetContent, AnchoredPopover } from '@ui/components';

// ---------------------------------------------------------------------------
// Method config
// ---------------------------------------------------------------------------

interface Method {
  key: 'manual' | 'scan' | 'import';
  icon: React.ReactNode;
  title: string;
  description: string;
}

const METHODS: Method[] = [
  {
    key: 'manual',
    icon: <PenLine className="size-4" />,
    title: 'Manual entry',
    description: 'Fill in transaction details',
  },
  {
    key: 'scan',
    icon: <ScanLine className="size-4" />,
    title: 'Scan receipt',
    description: 'Upload or photograph a receipt',
  },
  {
    key: 'import',
    icon: <Landmark className="size-4" />,
    title: 'Import from bank',
    description: 'Sync from linked Mono accounts',
  },
];

// ---------------------------------------------------------------------------
// MethodList — shared between desktop popover and mobile sheet
// ---------------------------------------------------------------------------

function MethodList({ onSelect }: { onSelect: (key: Method['key']) => void }) {
  return (
    <div className="flex flex-col gap-0.5 p-2">
      {METHODS.map((method) => (
        <button
          key={method.key}
          type="button"
          onClick={() => onSelect(method.key)}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left',
            'hover:bg-bg-surface-hover transition-colors duration-150',
            'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:outline-none',
          )}
        >
          <span className="bg-bg-surface text-text-secondary border-border-subtle flex size-8 shrink-0 items-center justify-center rounded-lg border">
            {method.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-text-primary text-[13px] font-medium">{method.title}</p>
            <p className="text-text-tertiary mt-0.5 text-[12px]">{method.description}</p>
          </div>
          <ChevronRight className="text-text-disabled size-3.5 shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TransactionMethodChooser
// ---------------------------------------------------------------------------

interface TransactionMethodChooserProps {
  onManual: () => void;
}

export function TransactionMethodChooser({ onManual }: TransactionMethodChooserProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const handleSelect = (key: Method['key']) => {
    setOpen(false);
    if (key === 'manual') {
      onManual();
    } else if (key === 'scan') {
      router.push('/finances/transactions/scan');
    } else {
      router.push('/finances/accounts');
    }
  };

  return (
    <>
      {/* Desktop — anchored popover */}
      {!isMobile && (
        <div className="hidden sm:block">
          <AnchoredPopover
            open={open}
            onOpenChange={setOpen}
            align="end"
            sideOffset={6}
            contentClassName="w-64 p-0"
            trigger={
              <Button size="sm" className="gap-1.5 px-2.5 sm:px-4">
                <Plus className="size-3.5" />
                <span>Add Transaction</span>
              </Button>
            }
          >
            <MethodList onSelect={handleSelect} />
          </AnchoredPopover>
        </div>
      )}

      {/* Mobile — bottom sheet */}
      {isMobile && (
        <div className="sm:hidden">
          <Button size="sm" className="gap-1.5 px-2.5" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" />
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
              side="bottom"
              title="Add Transaction"
              showCloseButton={false}
              className="rounded-t-2xl px-0 pt-0 pb-4"
            >
              <MethodList onSelect={handleSelect} />
            </SheetContent>
          </Sheet>
        </div>
      )}
    </>
  );
}
