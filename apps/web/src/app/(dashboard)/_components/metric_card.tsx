'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@ui/lib/utils/cn';
import { Skeleton } from '@ui/components';

export interface MetricCardProps {
  label: string;
  /** Raw numeric value — will be animated and formatted */
  value: number;
  /** Receives the animated intermediate value for display */
  format: (n: number) => string;
  icon: LucideIcon;
  accentColor: string;
  isLoading?: boolean;
  /** Mount stagger delay in ms */
  delay?: number;
  className?: string;
}

export function MetricCard({
  label,
  value,
  format,
  icon: Icon,
  accentColor,
  isLoading = false,
  delay = 0,
  className,
}: MetricCardProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const id = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  if (isLoading) {
    return (
      <div className={cn('bg-bg-surface border-border-subtle flex items-center gap-3 rounded-xl border px-4 py-3', className)}>
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-[10px] w-14 rounded" />
          <Skeleton className="h-[17px] w-20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-bg-surface border-border-subtle flex items-center gap-3 rounded-xl border px-4 py-3',
        'transition-all duration-500 ease-out',
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
    >
      {/* Icon badge */}
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
          color: accentColor,
        }}
      >
        <Icon className="size-[15px]" />
      </div>

      {/* Label + value */}
      <div className="min-w-0 overflow-hidden">
        <p className="text-text-disabled truncate text-[10px] leading-none font-semibold tracking-widest uppercase">
          {label}
        </p>
        <p className="text-text-primary mt-1 truncate text-[17px] leading-none font-bold tracking-tight tabular-nums">
          {format(value)}
        </p>
      </div>
    </div>
  );
}
