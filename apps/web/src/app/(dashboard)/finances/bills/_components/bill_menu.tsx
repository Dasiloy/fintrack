'use client';

import * as React from 'react';
import {
  Edit2,
  Eye,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import type { BillCardProps } from '../types';

export function BillMenu({ item, onView, onEdit, onToggle, onDelete, isDeleting }: BillCardProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={cn(
              'flex size-7 cursor-pointer items-center justify-center rounded-lg',
              'text-text-disabled hover:text-text-primary hover:bg-bg-surface-hover',
              'transition-colors duration-150 outline-none',
            )}
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="w-40 rounded-xl p-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[12px]"
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
          >
            <Eye className="size-3.5 shrink-0" />
            View details
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[12px]"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Edit2 className="size-3.5 shrink-0" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[12px]"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item);
            }}
          >
            {item.isActive ? (
              <PauseCircle className="size-3.5 shrink-0" />
            ) : (
              <PlayCircle className="size-3.5 shrink-0" />
            )}
            {item.isActive ? 'Pause' : 'Resume'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[12px]"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="size-3.5 shrink-0" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {confirmOpen && (
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(v) => {
            if (!isDeleting) setConfirmOpen(v);
          }}
        >
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-red-500/10">
                <TriangleAlert className="size-6 text-red-400" />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete &quot;{item.merchant ?? item.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This recurring item will be permanently deleted. Past transactions created by the
                scheduler will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => onDelete(item)}
                loading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
