'use client';

import * as React from 'react';
import Image from 'next/image';
import { type ExportPreviewData } from './export_preview.types';

const DOC_META: Record<string, { title: string; description: string }> = {
  monthly_summary:     { title: 'Monthly Financial Summary',  description: 'Income, expenses, net savings and savings rate per month' },
  transaction_history: { title: 'Transaction History',         description: 'Full ledger of income and expense transactions' },
  spending_breakdown:  { title: 'Spending Breakdown',          description: 'Category-level expense trends over the selected period' },
  budget_performance:  { title: 'Budget Performance Report',   description: 'Per-budget limit, spend, remaining and status' },
  goal_progress:       { title: 'Goal Progress Report',        description: 'Savings goal targets, contributions and completion rate' },
  net_worth:           { title: 'Net Worth Statement',         description: 'Monthly net balance trend and cumulative net worth' },
};

function parseDocType(filename: string): string {
  return filename.replace('fintrack_', '').replace(/\.pdf$/i, '').replace(/_\d{8}$/, '');
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
    ? new Date(generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex h-full w-full items-start justify-center overflow-auto bg-bg-deep py-6 px-4">
      {/* Paper */}
      <div className="w-full max-w-[560px] rounded-xl bg-white shadow-2xl shadow-black/30">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-7 py-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#7C7AFF]">
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
          <span className="mt-1 text-[10px] text-gray-400">{dateLabel}</span>
        </div>

        {/* Title block */}
        <div className="px-7 pt-5 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7C7AFF]">FinTrack Analytics</p>
          <h2 className="mt-1 text-[18px] font-bold text-gray-900">{meta.title}</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">{meta.description}</p>
        </div>

        {previewData ? (
          <>
            {/* Summary chips */}
            {previewData.summary.length > 0 && (
              <div className="mx-7 mb-4 flex flex-wrap gap-2">
                {previewData.summary.map((item, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5">
                    <p className="text-[9px] text-gray-400">{item.label}</p>
                    <p className={`text-[12px] font-bold ${item.color ? COLOR_MAP[item.color] : 'text-gray-900'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Data table */}
            {previewData.headers.length > 0 && previewData.rows.length > 0 && (
              <div className="mx-7 mb-5 overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr>
                      {previewData.headers.map((h, i) => (
                        <th
                          key={i}
                          className="bg-[#7C7AFF] px-3 py-2 text-left font-semibold text-white whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-gray-100 even:bg-gray-50">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                            {cell ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* Skeleton when previewData not yet available */
          <div className="mx-7 mb-5 space-y-2.5">
            <div className="flex gap-2">
              {[40, 25, 20, 15].map((w, i) => (
                <div key={i} className="h-6 rounded-lg bg-gray-100" style={{ width: `${w}%` }} />
              ))}
            </div>
            {[70, 55, 85, 60, 75, 50, 65].map((w, i) => (
              <div key={i} className="h-2 rounded bg-gray-100" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between rounded-b-xl border-t border-gray-100 bg-gray-50 px-7 py-3">
          <span className="text-[9px] text-gray-300">Generated by FinTrack · {dateLabel}</span>
          <span className="text-[9px] text-gray-300">Page 1</span>
        </div>
      </div>
    </div>
  );
}
