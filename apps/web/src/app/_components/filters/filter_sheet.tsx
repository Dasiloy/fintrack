'use client';

import * as React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { ScrollArea, Sheet, SheetContent } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';

function DefaultFilterTrigger({
  activeCount,
  triggerLabel,
  onClick,
}: {
  activeCount: number;
  triggerLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer border-border-subtle hover:border-border-light flex h-9 items-center gap-2 rounded-lg border px-3 text-[12px] font-medium transition-colors',
        activeCount > 0 ? 'text-primary' : 'text-text-secondary hover:text-text-primary',
      )}
    >
      <SlidersHorizontal className="size-3.5" />
      <span>{triggerLabel}</span>
      {activeCount > 0 && (
        <span className="bg-primary flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

interface FilterSheetProps<T> {
  /** Currently committed (applied) filters */
  value: T;
  /** Called when the user clicks Apply */
  onApply: (value: T) => void;
  /** The empty/reset state */
  empty: T;
  /** Returns how many filters are active — drives the badge and Clear button */
  countActive: (value: T) => number;
  /** Render the filter sections — receives live draft and a setter */
  children: (draft: T, setDraft: React.Dispatch<React.SetStateAction<T>>) => React.ReactNode;
  title?: string;
  /** Label shown on the trigger button */
  triggerLabel?: string;
  /** Override the trigger button entirely */
  trigger?: (activeCount: number, onClick: () => void) => React.ReactNode;
}

export function FilterSheet<T>({
  value,
  onApply,
  empty,
  countActive,
  children,
  title = 'Filters',
  triggerLabel = 'Filters',
  trigger,
}: FilterSheetProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<T>(value);

  // Re-sync draft when sheet opens so stale local state is discarded
  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = countActive(value);
  const draftCount = countActive(draft);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(value);

  const handleApply = () => {
    onApply(draft);
    setOpen(false);
  };

  const handleClear = () => setDraft(empty);
  const handleClose = () => setOpen(false);

  const openSheet = () => setOpen(true);

  return (
    <>
      {trigger ? (
        trigger(activeCount, openSheet)
      ) : (
        <DefaultFilterTrigger activeCount={activeCount} triggerLabel={triggerLabel} onClick={openSheet} />
      )}
      <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        showCloseButton={false}
        title={title}
        className="flex w-72 flex-col gap-0 overflow-hidden p-0"
      >
        {/* Header */}
        <div className="border-border-subtle flex shrink-0 items-center justify-between border-b px-5 py-4">
          <span className="text-text-primary text-[13px] font-semibold">{title}</span>
          <div className="flex items-center gap-3">
            {draftCount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="cursor-pointer text-text-tertiary hover:text-text-primary text-[12px] transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover flex size-6 items-center justify-center rounded transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-6 px-5 py-5">{children(draft, setDraft)}</div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-border-subtle flex shrink-0 gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'cursor-pointer rounded-button border-border-subtle h-9 flex-1 border text-[12px] font-medium',
              'text-text-secondary hover:text-text-primary hover:border-border-light transition-colors',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className={cn(
              'rounded-button h-9 flex-1 text-[12px] font-medium text-white transition-colors',
              isDirty ? 'cursor-pointer bg-primary hover:opacity-90' : 'cursor-default bg-primary/50',
            )}
          >
            {draftCount > 0 ? `Apply (${draftCount})` : 'Apply'}
          </button>
        </div>
      </SheetContent>
      </Sheet>
    </>
  );
}
