'use client';

import * as React from 'react';
import Image from 'next/image';
import { type ExportPreviewData } from './export_preview.types';

const DOC_META: Record<string, { title: string; description: string }> = {
  monthly_summary: {
    title: 'Monthly Financial Summary',
    description: 'Income, expenses, net savings and savings rate per month',
  },
  transaction_history: {
    title: 'Transaction History',
    description: 'Full ledger of income and expense transactions',
  },
  spending_breakdown: {
    title: 'Spending Breakdown',
    description: 'Category-level expense trends over the selected period',
  },
  budget_performance: {
    title: 'Budget Performance Report',
    description: 'Per-budget limit, spend, remaining and status',
  },
  goal_progress: {
    title: 'Goal Progress Report',
    description: 'Savings goal targets, contributions and completion rate',
  },
  net_worth: {
    title: 'Net Worth Statement',
    description: 'Monthly net balance trend and cumulative net worth',
  },
};

function parseDocType(filename: string): string {
  return filename
    .replace('fintrack_', '')
    .replace(/\.pdf$/i, '')
    .replace(/_\d{8}$/, '');
}

interface PdfPreviewCardProps {
  filename: string;
  generatedAt?: string;
  previewData?: ExportPreviewData | null;
}

const COLOR_MAP = {
  green: 'text-[#30d158]',
  red: 'text-[#ff453a]',
  primary: 'text-[#7C7AFF]',
} as const;

export function PdfPreviewCard({ filename, generatedAt, previewData }: PdfPreviewCardProps) {
  const key = parseDocType(filename);
  const meta = DOC_META[key] ?? {
    title: key.replace(/_/g, ' '),
    description: 'FinTrack analytics export',
  };

  const dateLabel = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-bg-deep flex h-full w-full items-start justify-center overflow-auto px-4 py-6">
      {/* Paper */}
      <div className="bg-bg-surface ring-border-subtle w-full max-w-[560px] rounded-xl shadow-2xl ring-1 shadow-black/30">
        {/* Header */}
        <div className="border-border-subtle flex items-start justify-between border-b px-7 py-5">
          <div className="bg-primary flex size-14 shrink-0 items-center justify-center rounded-xl">
            <Image
              src="/logo-icon-white.png"
              alt="FinTrack"
              width={36}
              height={36}
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          <span className="text-text-tertiary mt-1 text-[10px]">{dateLabel}</span>
        </div>

        {/* Title block */}
        <div className="px-7 pt-5 pb-4">
          <p className="text-primary text-[10px] font-semibold tracking-widest uppercase">
            FinTrack Analytics
          </p>
          <h2 className="text-text-primary mt-1 text-[18px] font-bold">{meta.title}</h2>
          <p className="text-text-tertiary mt-0.5 text-[11px]">{meta.description}</p>
        </div>

        {previewData ? (
          <>
            {/* Summary chips */}
            {previewData.summary.length > 0 && (
              <div className="mx-7 mb-4 flex flex-wrap gap-2">
                {previewData.summary.map((item, i) => (
                  <div
                    key={i}
                    className="border-border-subtle bg-bg-elevated rounded-lg border px-3 py-1.5"
                  >
                    <p className="text-text-tertiary text-[9px]">{item.label}</p>
                    <p
                      className={`text-[12px] font-bold ${item.color ? COLOR_MAP[item.color] : 'text-text-primary'}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Data table */}
            {previewData.headers.length > 0 &&
              (previewData.rows.length > 0 ? (
                <div className="border-border-subtle mx-7 mb-5 overflow-hidden rounded-lg border">
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      <tr>
                        {previewData.headers.map((h, i) => (
                          <th
                            key={i}
                            className="bg-primary px-3 py-2 text-left font-semibold whitespace-nowrap text-white"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row, ri) => (
                        <tr key={ri} className="border-border-subtle even:bg-bg-elevated border-t">
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="text-text-secondary px-3 py-1.5 whitespace-nowrap"
                            >
                              {cell ?? '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border-border-subtle bg-bg-elevated mx-7 mb-5 flex items-center justify-center rounded-lg border py-6">
                  <p className="text-text-tertiary text-[10px]">
                    No data to display for this period
                  </p>
                </div>
              ))}
          </>
        ) : (
          /* Skeleton when previewData not yet available */
          <div className="mx-7 mb-5 space-y-2.5">
            <div className="flex gap-2">
              {[40, 25, 20, 15].map((w, i) => (
                <div key={i} className="bg-bg-elevated h-6 rounded-lg" style={{ width: `${w}%` }} />
              ))}
            </div>
            {[70, 55, 85, 60, 75, 50, 65].map((w, i) => (
              <div key={i} className="bg-bg-elevated h-2 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-border-subtle bg-bg-elevated flex items-center justify-between rounded-b-xl border-t px-7 py-3">
          <span className="text-text-disabled text-[9px]">Generated by FinTrack · {dateLabel}</span>
          <span className="text-text-disabled text-[9px]">Page 1</span>
        </div>
      </div>
    </div>
  );
}
