'use client';

import React from 'react';
import { cn } from '@ui/lib/utils';

// ---------- Types ----------

export type ColumnDef<T> = {
  key: string;
  label?: string;
  headerClassName?: string;
  bodyClassName?: string;
  render?: (row: T, index: number) => React.ReactNode;
  skeletonClassName?: string; // used for loading state alignment
  flex?: number | string; // flex shorthand — defaults to 1 (equal columns). Use e.g. '0 0 80px' for fixed width.
};

// ---------- Table ----------

type StyledTableProps<T> = {
  children: React.ReactNode;
  columns: ColumnDef<T>[];
  className?: string;
  columnHeaderClassName?: string;
  columnBodyClassName?: string;

  isLoading?: boolean;
  isEmpty?: boolean;
  skeletonRowCount?: number;
  emptyContent?: React.ReactNode;
};

function StyledTable<T>({
  children,
  columns,
  className,
  columnBodyClassName,
  columnHeaderClassName,
  isLoading,
  isEmpty,
  skeletonRowCount,
  emptyContent,
}: StyledTableProps<T>) {
  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              columns,
              columnBodyClassName,
              columnHeaderClassName,
              isLoading,
              isEmpty,
              skeletonRowCount,
              emptyContent,
            })
          : child,
      )}
    </div>
  );
}

// ---------- TableColumn ----------

type StyledTableColumnProps<T> = {
  column: ColumnDef<T>;
  columnBodyClassName?: string;
  columnHeaderClassName?: string;
  variant: 'header' | 'body' | 'skeleton';
  row?: any;
  rowIndex?: number;
};

function StyledTableColumn<T>({
  column,
  variant,
  row,
  rowIndex = 0,
  columnBodyClassName,
  columnHeaderClassName,
}: StyledTableColumnProps<T>) {
  const flexStyle = { flex: column.flex ?? 1, minWidth: 0 };

  if (variant === 'header') {
    return (
      <div
        style={flexStyle}
        className={cn(
          'text-text-disabled text-left text-[10px] font-semibold tracking-widest uppercase',
          columnHeaderClassName,
          column.headerClassName,
        )}
      >
        {column.label}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div
        style={flexStyle}
        className={cn(
          'text-text-primary text-left text-sm font-normal',
          columnBodyClassName,
          column.bodyClassName,
          column.skeletonClassName,
        )}
      >
        <div className="bg-border-subtle/40 h-3.5 w-full rounded" />
      </div>
    );
  }

  return (
    <div
      style={flexStyle}
      className={cn(
        'text-text-primary text-left text-sm font-normal',
        columnBodyClassName,
        column.bodyClassName,
      )}
    >
      {column.render?.(row, rowIndex) ?? row?.[column.key]}
    </div>
  );
}

// ---------- TableHeader ----------

type StyledTableHeaderProps<T> = {
  columnHeaderClassName?: string;
  columns?: ColumnDef<T>[]; // injected by Table
  className?: string;
};

function StyledTableHeader<T>({
  columns = [],
  className,
  columnHeaderClassName,
}: StyledTableHeaderProps<T>) {
  if (!Array.isArray(columns)) return null;

  return (
    <div
      className={cn(
        'border-border-subtle/60 bg-bg-surface-hover/50 flex items-center gap-4 border-b border-l-[3px] border-l-transparent px-5 py-2.5',
        className,
      )}
    >
      {columns.map((col) => (
        <StyledTableColumn
          key={col.key}
          column={col}
          variant="header"
          columnHeaderClassName={columnHeaderClassName}
        />
      ))}
    </div>
  );
}

// ---------- TableBody ----------

type StyledTableBodyProps<T> = {
  children: React.ReactNode;
  columnBodyClassName?: string;
  columns?: ColumnDef<T>[]; // injected by Table
  className?: string;

  isLoading?: boolean;
  isEmpty?: boolean;
  skeletonRowCount?: number;
  emptyContent?: React.ReactNode;
};

function StyledTableBody<T>({
  children,
  columns = [],
  className,
  columnBodyClassName,
  isLoading,
  isEmpty,
  skeletonRowCount = 8,
  emptyContent,
}: StyledTableBodyProps<T>) {
  if (!Array.isArray(columns)) return null;

  if (isLoading) {
    return (
      <div className={cn('divide-border-subtle/30 flex flex-col divide-y', className)}>
        {Array.from({ length: skeletonRowCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            {columns.map((col) => (
              <StyledTableColumn
                key={col.key}
                column={col}
                variant="skeleton"
                columnBodyClassName={columnBodyClassName}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn('flex h-full flex-1 flex-col items-center justify-center', className)}>
        {emptyContent}
      </div>
    );
  }

  return (
    <div className={cn('divide-border-subtle/25 flex flex-col divide-y', className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              columns,
              columnBodyClassName,
            })
          : child,
      )}
    </div>
  );
}

type StyledTableGroupProps<T> = {
  label: string;
  items: T[];
  columns?: ColumnDef<T>[]; // injected by StyledTableBody
  columnBodyClassName?: string; // injected by StyledTableBody
  className?: string;
  headerClassName?: string;
  rowClassName?: (row: T, index: number) => string | undefined;
  onRowClick?: (row: T, index: number) => void;
};

function StyledTableGroup<T>({
  label,
  items,
  columns = [],
  columnBodyClassName,
  className,
  headerClassName,
  rowClassName,
  onRowClick,
}: StyledTableGroupProps<T>) {
  if (!Array.isArray(columns)) return null;

  return (
    <div className={className}>
      {/* transparent-ish group header, just for separation */}
      <div
        className={cn(
          'flex items-center gap-3 px-5 pt-3 pb-1.5',
          'bg-bg-surface-hover/50 border-l-[3px] border-l-transparent',
          headerClassName,
        )}
      >
        <span className="text-text-disabled shrink-0 text-[10px] font-semibold tracking-[0.12em] uppercase">
          {label}
        </span>
      </div>

      {items.map((row, index) => (
        <StyledTableRow<T>
          key={(row as any).id ?? index}
          row={row}
          index={index}
          columns={columns}
          columnBodyClassName={columnBodyClassName}
          className={rowClassName?.(row, index)}
          onClick={onRowClick ? () => onRowClick(row, index) : undefined}
        />
      ))}
    </div>
  );
}

// ---------- TableRow ----------

type StyledTableRowProps<T> = {
  row: any;
  index?: number;
  columns?: ColumnDef<T>[]; // injected by TableBody
  columnBodyClassName?: string;
  className?: string;
  onClick?: () => void;
};

function StyledTableRow<T>({
  row,
  index = 0,
  columns = [],
  columnBodyClassName,
  className,
  onClick,
}: StyledTableRowProps<T>) {
  if (!Array.isArray(columns)) return null;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'flex items-center gap-4 border-l-[3px] border-l-transparent px-5 py-2.5',
        onClick && 'cursor-pointer select-none',
        className,
      )}
    >
      {columns.map((col) => (
        <StyledTableColumn
          key={col.key}
          column={col}
          variant="body"
          row={row}
          rowIndex={index}
          columnBodyClassName={columnBodyClassName}
        />
      ))}
    </div>
  );
}

// Re-exports
export {
  StyledTable,
  StyledTableHeader,
  StyledTableBody,
  StyledTableRow,
  StyledTableColumn,
  StyledTableGroup,
};
