'use client';

import * as React from 'react';
import Link from 'next/link';
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
  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-2 border-b border-white/5 px-4',
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
                        <BreadcrumbLink asChild className="text-text-tertiary hover:text-text-primary">
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
          <span className="text-caption hidden text-text-tertiary md:block">{description}</span>
        )}
      </div>

      {/* Right: actions slot */}
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </header>
  );
}
