'use client';

import * as React from 'react';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@ui/components/atoms';
// ---------------------------------------------------------------------------
// AnchoredPopover
// ---------------------------------------------------------------------------

export interface AnchoredPopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
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
