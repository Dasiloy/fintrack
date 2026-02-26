'use client';

import * as React from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';

import { cn } from '@ui/lib/utils/cn';
import { Button } from '@ui/components/atoms/button';

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

const Combobox = ComboboxPrimitive.Root;

// ---------------------------------------------------------------------------
// Value
// ---------------------------------------------------------------------------

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

ComboboxValue.displayName = 'ComboboxValue';

// ---------------------------------------------------------------------------
// Trigger (chevron button inside input)
// ---------------------------------------------------------------------------

function ComboboxTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("cursor-pointer [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon
        data-slot="combobox-trigger-icon"
        className="text-text-tertiary pointer-events-none size-4"
      />
    </ComboboxPrimitive.Trigger>
  );
}

ComboboxTrigger.displayName = 'ComboboxTrigger';

// ---------------------------------------------------------------------------
// Clear button
// ---------------------------------------------------------------------------

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<Button variant="ghost" size="icon-sm" />}
      className={cn('text-text-tertiary hover:text-text-primary', className)}
      {...props}
    >
      <XIcon className="pointer-events-none size-3.5" />
    </ComboboxPrimitive.Clear>
  );
}

ComboboxClear.displayName = 'ComboboxClear';

// ---------------------------------------------------------------------------
// Input — inline searchable trigger (replaces InputGroup dependency)
// ---------------------------------------------------------------------------

const ComboboxInput = React.forwardRef<
  HTMLDivElement,
  ComboboxPrimitive.Input.Props & {
    showTrigger?: boolean;
    showClear?: boolean;
  }
>(function ComboboxInput(
  { className, children, disabled = false, showTrigger = true, showClear = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'gap-space-2 rounded-button border-border-subtle bg-bg-surface flex h-11 items-center border',
        'px-space-3 duration-smooth transition-all',
        'focus-within:ring-primary/50 focus-within:border-primary/30 focus-within:ring-2',
        'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
        'has-aria-invalid:border-error has-aria-invalid:ring-error/20 has-aria-invalid:ring-2',
        className,
      )}
    >
      <ComboboxPrimitive.Input
        disabled={disabled}
        className={cn(
          'text-body text-text-primary flex-1 bg-transparent outline-none',
          'placeholder:text-text-tertiary disabled:cursor-not-allowed',
        )}
        {...props}
      />
      <div className="gap-space-1 flex shrink-0 items-center">
        {showClear && <ComboboxClear disabled={disabled} />}
        {showTrigger && <ComboboxTrigger disabled={disabled} />}
      </div>
      {children}
    </div>
  );
});

ComboboxInput.displayName = 'ComboboxInput';

// ---------------------------------------------------------------------------
// Content (dropdown popup)
// ---------------------------------------------------------------------------

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            // Surface
            'bg-bg-elevated text-text-primary',
            'rounded-card border-border-subtle shadow-card border',
            // Sizing
            'group/combobox-content relative max-h-96 overflow-hidden',
            'w-(--anchor-width) max-w-(--available-width)',
            'min-w-[calc(var(--anchor-width)+--spacing(7))]',
            'data-[chips=true]:min-w-(--anchor-width)',
            'origin-(--transform-origin)',
            // Animations
            'data-open:animate-in data-closed:animate-out',
            'data-closed:fade-out-0 data-open:fade-in-0',
            'data-closed:zoom-out-95 data-open:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=top]:slide-in-from-bottom-2',
            'duration-smooth',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

ComboboxContent.displayName = 'ComboboxContent';

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        'p-space-1 scroll-py-1 overflow-y-auto data-empty:p-0',
        'max-h-[min(calc(--spacing(96)---spacing(9)),calc(var(--available-height)---spacing(9)))]',
        // Firefox
        '[scrollbar-color:var(--color-border-subtle)_transparent] [scrollbar-width:thin]',
        // Chrome / Safari — 4px thumb, transparent track
        '[&::-webkit-scrollbar]:w-1',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
        '[&::-webkit-scrollbar-thumb]:bg-border-subtle',
        '[&::-webkit-scrollbar-thumb:hover]:bg-border-light',
        className,
      )}
      {...props}
    />
  );
}

ComboboxList.displayName = 'ComboboxList';

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        // Layout
        'gap-space-2 relative flex w-full cursor-default items-center select-none',
        'py-space-2 pl-space-2 rounded-sm pr-8',
        // Typography
        'text-body-sm text-text-secondary',
        // Highlighted (keyboard/mouse hover)
        'data-highlighted:bg-bg-surface-hover data-highlighted:text-text-primary',
        // Disabled
        'data-disabled:pointer-events-none data-disabled:opacity-40',
        // Icon sizing
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'outline-hidden',
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        data-slot="combobox-item-indicator"
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="text-primary pointer-events-none size-4" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

ComboboxItem.displayName = 'ComboboxItem';

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group data-slot="combobox-group" className={cn(className)} {...props} />
  );
}

ComboboxGroup.displayName = 'ComboboxGroup';

// ---------------------------------------------------------------------------
// Group Label
// ---------------------------------------------------------------------------

function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        'text-text-tertiary text-caption font-medium tracking-wide uppercase',
        'px-space-2 py-space-1',
        className,
      )}
      {...props}
    />
  );
}

ComboboxLabel.displayName = 'ComboboxLabel';

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />;
}

ComboboxCollection.displayName = 'ComboboxCollection';

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'text-text-tertiary text-body-sm',
        'py-space-3 hidden w-full justify-center text-center',
        'group-data-empty/combobox-content:flex',
        className,
      )}
      {...props}
    />
  );
}

ComboboxEmpty.displayName = 'ComboboxEmpty';

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn('bg-border-subtle -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

ComboboxSeparator.displayName = 'ComboboxSeparator';

// ---------------------------------------------------------------------------
// Chips container (multi-select)
// ---------------------------------------------------------------------------

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> & ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        'gap-space-2 rounded-button flex min-h-11 flex-wrap items-center',
        'border-border-subtle bg-bg-surface border bg-clip-padding',
        'px-space-3 py-space-2 text-body duration-smooth shadow-none transition-all',
        'focus-within:border-primary/30 focus-within:ring-primary/50 focus-within:ring-2',
        'has-aria-invalid:border-error has-aria-invalid:ring-error/20 has-aria-invalid:ring-2',
        'has-data-[slot=combobox-chip]:px-space-2',
        className,
      )}
      {...props}
    />
  );
}

ComboboxChips.displayName = 'ComboboxChips';

// ---------------------------------------------------------------------------
// Chip (individual tag in multi-select)
// ---------------------------------------------------------------------------

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & { showRemove?: boolean }) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        'bg-bg-surface-hover text-text-primary',
        'gap-space-1 flex h-[22px] w-fit items-center justify-center',
        'px-space-2 text-caption rounded-sm font-medium whitespace-nowrap',
        'has-disabled:pointer-events-none has-disabled:opacity-50',
        'has-data-[slot=combobox-chip-remove]:pr-0',
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-sm" />}
          className="-ml-1 cursor-pointer opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none size-3" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

ComboboxChip.displayName = 'ComboboxChip';

// ---------------------------------------------------------------------------
// Chips text input
// ---------------------------------------------------------------------------

function ComboboxChipsInput({ className, children, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn(
        'text-body placeholder:text-text-tertiary min-w-16 flex-1 bg-transparent outline-none',
        className,
      )}
      {...props}
    />
  );
}

ComboboxChipsInput.displayName = 'ComboboxChipsInput';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
