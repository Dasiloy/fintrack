/**
 * CSV export generators (UTF-8, RFC-style escaping).
 *
 * @module csv.generator
 */

import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import type { Budget } from '@fintrack/types/protos/finance/budget';

function csvEscape(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...cells: (string | number | undefined | null)[]): string {
  return cells.map(csvEscape).join(',');
}

/**
 * @description Build a transaction history CSV for download.
 *
 * @param rows Finance proto transactions (already filtered by ExportService)
 */
export function generateTransactionCsv(rows: Transaction[]): Buffer {
  const header = row(
    'Date',
    'Type',
    'Amount',
    'Currency',
    'Category',
    'Merchant',
    'Description',
    'Notes',
    'Source',
  );
  const lines = rows.map((tx) =>
    row(
      tx.date,
      tx.type,
      tx.amount,
      'NGN',
      tx.category?.name ?? '',
      tx.merchant ?? '',
      tx.description ?? '',
      tx.notes ?? '',
      tx.source,
    ),
  );
  return Buffer.from([header, ...lines].join('\r\n'), 'utf-8');
}

/**
 * @description Build a budget performance CSV (available for future dispatch).
 *
 * @param budgets Current-month budgets from Finance gRPC
 */
export function generateBudgetCsv(budgets: Budget[]): Buffer {
  const header = row(
    'Budget Name',
    'Category',
    'Limit (NGN)',
    'Spent (NGN)',
    'Remaining (NGN)',
    'Utilisation %',
    'Status',
  );
  const lines = budgets.map((b) => {
    const limit = b.amount;
    const spent = parseFloat(b.spent ?? '0');
    const remaining = limit - spent;
    const pct = limit > 0 ? ((spent / limit) * 100).toFixed(1) : '0';
    const status = spent > limit ? 'Over' : 'Under';
    return row(
      b.name,
      b.category?.name ?? '',
      limit,
      spent.toFixed(2),
      remaining.toFixed(2),
      pct,
      status,
    );
  });
  return Buffer.from([header, ...lines].join('\r\n'), 'utf-8');
}
