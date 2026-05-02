'use client';

import * as React from 'react';
import { Skeleton } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { X } from 'lucide-react';

// ---------------------------------------------------------------------------
// SectionLabel
// ---------------------------------------------------------------------------

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-text-disabled mb-2 text-[10px] font-semibold tracking-widest uppercase">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Row — view-mode label/value pair
// ---------------------------------------------------------------------------

export function Row({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-text-tertiary shrink-0 text-[12px]">{label}</span>
      <span
        className={cn(
          'text-text-primary text-right text-[12px] font-medium',
          mono && 'font-mono text-[11px]',
        )}
      >
        {children}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section — labelled card wrapping a set of Rows
// ---------------------------------------------------------------------------

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="border-border-subtle divide-border-subtle divide-y overflow-hidden rounded-lg border">
        <div className="divide-border-subtle divide-y px-3">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditRow — edit-mode label + input pair
// ---------------------------------------------------------------------------

export function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-text-tertiary w-28 shrink-0 text-[12px]">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// inputCls — shared input class string for edit-mode inputs
// ---------------------------------------------------------------------------

export const inputCls = cn(
  'border-border-subtle bg-bg-surface text-text-primary placeholder:text-text-disabled',
  'focus:border-primary/40 h-8 w-full rounded-md border px-2.5 text-[12px] transition-colors focus:outline-none',
);

// ---------------------------------------------------------------------------
// DrawerHeader — consistent header with title, optional edit/cancel, close
// ---------------------------------------------------------------------------

interface DrawerHeaderProps {
  title: string;
  /** When true, renders "Cancel" instead of "Edit" */
  editMode?: boolean;
  /** Called when the Edit button is clicked — omit to hide the button */
  onEdit?: () => void;
  /** Called when the Cancel button is clicked */
  onCancel?: () => void;
  onClose: () => void;
}

export function DrawerHeader({ title, editMode, onEdit, onCancel, onClose }: DrawerHeaderProps) {
  return (
    <div className="border-border-subtle flex shrink-0 items-center justify-between border-b px-6 py-4">
      <span className="text-text-primary text-[13px] font-semibold">{title}</span>
      <div className="flex items-center gap-3">
        {!editMode && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-primary cursor-pointer text-[12px] font-medium transition-opacity hover:opacity-70"
          >
            Edit
          </button>
        )}
        {editMode && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-text-tertiary hover:text-text-primary cursor-pointer text-[12px] transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover flex size-6 cursor-pointer items-center justify-center rounded transition-colors"
        >
          <X />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DrawerFooter — consistent footer wrapper
// ---------------------------------------------------------------------------

export function DrawerFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border-subtle flex shrink-0 gap-2.5 border-t px-6 py-4">{children}</div>
  );
}

// ---------------------------------------------------------------------------
// DrawerSkeleton
// ---------------------------------------------------------------------------

export function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div className="flex flex-col items-center gap-3 pb-2">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-1 h-8 w-32" />
      </div>
      <Skeleton className="h-px w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between py-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}
