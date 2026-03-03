import { Check, X } from 'lucide-react';

import { cn } from '@ui/lib/utils';
import { COMPARISON_ROWS } from '../_data';

/**
 * Feature comparison table.
 *
 * Mobile  — each row is a mini card: feature label full-width on top,
 *           then Free / Pro values side-by-side beneath with their plan labels.
 * Desktop — classic 3-column grid (feature | Free | Pro).
 */
export function ComparisonTable() {
  return (
    <section className="mx-auto max-w-[900px] px-4 pb-20 md:px-6">
      <style>{`
        @keyframes _ft-row-fade {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ft-compare-row {
          opacity: 0;
          animation: _ft-row-fade 0.4s ease-out forwards;
        }
      `}</style>

      <h2 className="font-manrope text-text-primary mb-8 text-center text-2xl font-bold">
        Compare plans
      </h2>

      <div className="rounded-card bg-bg-elevated border-border-subtle overflow-hidden border">

        {/* ── Desktop header (hidden on mobile) ── */}
        <div className="border-border-subtle bg-bg-deep/40 hidden border-b sm:grid sm:grid-cols-[1fr_160px_160px] sm:px-6 sm:py-4">
          <span className="text-body-sm text-text-tertiary font-semibold">Feature</span>
          <span className="text-body-sm text-text-secondary text-center font-semibold">Free</span>
          <span className="text-body-sm text-primary text-center font-semibold">Pro</span>
        </div>

        {/* ── Rows ── */}
        {COMPARISON_ROWS.map((row, idx) => {
          const Icon = row.icon;
          const isLast = idx === COMPARISON_ROWS.length - 1;
          return (
            <div
              key={row.label}
              className={cn(
                'ft-compare-row',
                !isLast && 'border-border-subtle border-b',
                idx % 2 === 1 ? 'bg-bg-deep/20' : '',
              )}
              style={{ animationDelay: `${idx * 40 + 100}ms` }}
            >
              {/* ── Mobile layout ── */}
              <div className="flex flex-col gap-3 px-4 py-4 sm:hidden">
                {/* Feature label */}
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-text-tertiary shrink-0" aria-hidden="true" />
                  <span className="text-body-sm text-text-primary font-semibold">{row.label}</span>
                </div>

                {/* Free | Pro side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-bg-deep/30 px-3 py-2">
                    <p className="text-caption text-text-disabled mb-1 font-semibold uppercase tracking-wide">
                      Free
                    </p>
                    <MobileCellValue value={row.free} />
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                    <p className="text-caption text-primary mb-1 font-semibold uppercase tracking-wide">
                      Pro
                    </p>
                    <MobileCellValue value={row.pro} isPro />
                  </div>
                </div>
              </div>

              {/* ── Desktop layout ── */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_160px_160px] sm:items-center sm:px-6 sm:py-3.5">
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className="text-text-tertiary shrink-0" aria-hidden="true" />
                  <span className="text-body-sm text-text-secondary">{row.label}</span>
                </div>
                <DesktopCellValue value={row.free} />
                <DesktopCellValue value={row.pro} isPro />
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-caption text-text-disabled mt-6 text-center">
        All plans include end-to-end encryption, automatic backups, and access to all core
        FinTrack features. Prices shown in USD.
      </p>
    </section>
  );
}

/* ── Cell helpers ── */

function MobileCellValue({ value, isPro = false }: { value: string | boolean; isPro?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check size={15} className={isPro ? 'text-primary' : 'text-text-secondary'} aria-label="Included" />
    ) : (
      <X size={15} className="text-text-disabled" aria-label="Not included" />
    );
  }
  return (
    <span className={cn('text-body-sm font-medium', isPro ? 'text-primary' : 'text-text-secondary')}>
      {value}
    </span>
  );
}

function DesktopCellValue({ value, isPro = false }: { value: string | boolean; isPro?: boolean }) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex justify-center">
        {value ? (
          <Check size={16} className={isPro ? 'text-primary' : 'text-text-secondary'} aria-label="Included" />
        ) : (
          <X size={16} className="text-text-disabled" aria-label="Not included" />
        )}
      </div>
    );
  }
  return (
    <div className="text-center">
      <span className={cn('text-body-sm font-medium', isPro ? 'text-primary' : 'text-text-secondary')}>
        {value}
      </span>
    </div>
  );
}
