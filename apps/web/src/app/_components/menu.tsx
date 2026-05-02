'use client';

import React from 'react';
import { cn } from '@ui/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components';
import { MoreHorizontal } from 'lucide-react';

interface MenuItem {
  label: string;
  Icon?: React.ReactNode;
  variant?: 'destructive' | 'default';
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

interface MenuProps {
  menus: MenuItem[];
}

function Menu({ menus }: MenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={cn(
            'flex size-6 cursor-pointer items-center justify-center rounded',
            'text-text-disabled hover:text-text-primary hover:bg-bg-surface',
            'transition-all duration-150 outline-none',
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-md p-1.5">
        {menus.map((m) => (
          <DropdownMenuItem
            key={m.label}
            onClick={m.onClick}
            variant={m.variant}
            className="cursor-pointer gap-2.5 rounded-sm px-2.5 py-2 text-[12px]"
          >
            {m.Icon} {m.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { Menu, type MenuItem, type MenuProps };
