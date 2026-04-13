'use client';

import * as React from 'react';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@ui/components/atoms';
import type { PopoverContentProps } from '@radix-ui/react-popover';

// ---------------------------------------------------------------------------
// AnchoredPopover
//
// Wraps Radix Popover with an explicit anchor ref so PopoverContent always
// opens below (or above) the trigger — never covering it — without callers
// having to wire up refs manually.
//
// Usage:
//   <AnchoredPopover trigger={<button>Pick date</button>}>
//     <Calendar ... />
//   </AnchoredPopover>
// ---------------------------------------------------------------------------

export interface AnchoredPopoverProps {
  /** The element that opens the popover when clicked */
  trigger: React.ReactNode;
  /** Content rendered inside the popover panel */
  children: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Whether to disable the focus-trap (needed when nested inside a Dialog) */
  modal?: boolean;
  /** Alignment relative to the anchor. Defaults to "start" */
  align?: PopoverContentProps['align'];
  /** Side the popover opens on. Defaults to "bottom" */
  side?: PopoverContentProps['side'];
  /** Gap between anchor and popover in px. Defaults to 4 */
  sideOffset?: number;
  /** Extra className forwarded to PopoverContent */
  contentClassName?: string;
}

export function AnchoredPopover({
  trigger,
  children,
  open,
  onOpenChange,
  modal = false,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  contentClassName,
}: AnchoredPopoverProps) {
  const anchorRef = React.useRef<HTMLDivElement>(null);

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={modal}>
      {/* Anchor wraps the trigger so Radix measures from here for positioning */}
      <PopoverAnchor ref={anchorRef}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </PopoverAnchor>

      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={contentClassName}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
