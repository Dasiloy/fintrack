'use client';

import * as React from 'react';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
  SidebarTrigger,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { useNetworkStatus } from '@/hooks/use_network_status';
import { useScrolled } from '@/hooks/use_scrolled';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  /** Breadcrumb trail. Last entry is rendered as current page (non-link). */
  breadcrumbs?: BreadcrumbEntry[];
  /** Page title — shown when no breadcrumbs are provided. */
  title?: string;
  /** Short description next to the title (hidden on mobile). */
  description?: string;
  /** Right-side slot for action buttons, filters, etc. */
  children?: React.ReactNode;
  className?: string;
  /** Show the sidebar collapse/expand trigger. Defaults to true. */
  showTrigger?: boolean;
}

// ---------------------------------------------------------------------------
// PageHeader
// ---------------------------------------------------------------------------

export function PageHeader({
  breadcrumbs,
  title,
  description,
  children,
  className,
  showTrigger = true,
}: PageHeaderProps) {
  const { online } = useNetworkStatus();
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4',
        'backdrop-blur-glass transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'bg-bg-surface/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.2)]'
          : 'bg-bg-surface/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        online ? 'border-white/5' : 'border-warning/30',
        className,
      )}
    >
      {showTrigger && (
        <>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4 opacity-30" />
        </>
      )}

      {/* Left: breadcrumbs or title */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.label}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="text-text-primary font-medium">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="text-text-tertiary hover:text-text-primary"
                        >
                          <Link href={crumb.href ?? '#'}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className="text-text-disabled" />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        ) : title ? (
          <h1 className="text-h4 truncate">{title}</h1>
        ) : null}

        {description && (
          <span className="text-caption text-text-tertiary hidden md:block">{description}</span>
        )}
      </div>

      {/* Right: offline indicator + actions slot */}
      <div className="flex shrink-0 items-center gap-2">
        {!online && (
          <div
            role="status"
            aria-label="No internet connection"
            className="border-warning/20 bg-warning/10 text-warning flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
          >
            <WifiOff className="size-3 shrink-0" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}
        {children}
      </div>
    </header>
  );
}
