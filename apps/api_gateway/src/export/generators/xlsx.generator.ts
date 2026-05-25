/**
 * ExcelJS (XLSX) export generators with FinTrack branding and summary sheets.
 *
 * @module xlsx.generator
 */

import * as ExcelJS from 'exceljs';
import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import type { Budget } from '@fintrack/types/protos/finance/budget';
import type { Goal } from '@fintrack/types/protos/finance/goal';

const PRIMARY_ARGB = 'FF7C7AFF';
const INCOME_ARGB = '3330D158';
const EXPENSE_ARGB = '33FF453A';
const WHITE_ARGB = 'FFFFFFFF';

function headerStyle(
  ws: ExcelJS.Worksheet,
  rowIndex: number,
  colCount: number,
) {
  const headerRow = ws.getRow(rowIndex);
  headerRow.font = { bold: true, color: { argb: WHITE_ARGB } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: PRIMARY_ARGB },
  };
  headerRow.alignment = { vertical: 'middle' };
  for (let i = 1; i <= colCount; i++) {
    headerRow.getCell(i).border = {
      bottom: { style: 'thin', color: { argb: WHITE_ARGB } },
    };
  }
  headerRow.commit();
}

/**
 * @description Transaction workbook: Transactions sheet + Summary metrics sheet.
 */
export async function generateTransactionXlsx(
  rows: Transaction[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FinTrack';
  wb.created = new Date();

  const ws = wb.addWorksheet('Transactions');
  ws.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Amount (NGN)', key: 'amount', width: 18 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Merchant', key: 'merchant', width: 26 },
    { header: 'Description', key: 'description', width: 34 },
    { header: 'Notes', key: 'notes', width: 28 },
    { header: 'Source', key: 'source', width: 14 },
  ];

  headerStyle(ws, 1, ws.columns.length);

  for (const tx of rows) {
    ws.addRow({
      date: tx.date,
      type: tx.type,
      amount: parseFloat(tx.amount),
      category: tx.category?.name ?? '',
      merchant: tx.merchant ?? '',
      description: tx.description ?? '',
      notes: tx.notes ?? '',
      source: tx.source,
    });
  }

  ws.addConditionalFormatting({
    ref: `B2:B${rows.length + 1}`,
    rules: [
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'EXPENSE',
        style: {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: EXPENSE_ARGB },
          },
        },
        priority: 1,
      },
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'INCOME',
        style: {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: INCOME_ARGB },
          },
        },
        priority: 2,
      },
    ],
  });

  // Summary sheet
  const summary = wb.addWorksheet('Summary');
  const income = rows
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = rows
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  summary.columns = [
    { header: 'Metric', key: 'metric', width: 28 },
    { header: 'Amount (NGN)', key: 'amount', width: 20 },
  ];
  headerStyle(summary, 1, 2);
  summary.addRow({ metric: 'Total Income', amount: income });
  summary.addRow({ metric: 'Total Expense', amount: expense });
  summary.addRow({ metric: 'Net Savings', amount: income - expense });
  summary.addRow({
    metric: 'Savings Rate',
    amount:
      income > 0
        ? `${(((income - expense) / income) * 100).toFixed(1)}%`
        : '0%',
  });
  summary.addRow({ metric: 'Transaction Count', amount: rows.length });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/**
 * @description Budget performance workbook with utilisation and Over/Under status.
 */
export async function generateBudgetXlsx(budgets: Budget[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FinTrack';
  wb.created = new Date();

  const ws = wb.addWorksheet('Budget Performance');
  ws.columns = [
    { header: 'Budget Name', key: 'name', width: 26 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Limit (NGN)', key: 'limit', width: 18 },
    { header: 'Spent (NGN)', key: 'spent', width: 18 },
    { header: 'Remaining (NGN)', key: 'remaining', width: 18 },
    { header: 'Utilisation %', key: 'pct', width: 16 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  headerStyle(ws, 1, ws.columns.length);

  for (const b of budgets) {
    const limit = b.amount;
    const spent = parseFloat(b.spent ?? '0');
    const remaining = limit - spent;
    const pct = limit > 0 ? parseFloat(((spent / limit) * 100).toFixed(1)) : 0;
    ws.addRow({
      name: b.name,
      category: b.category?.name ?? '',
      limit,
      spent,
      remaining,
      pct,
      status: spent > limit ? 'Over' : 'Under',
    });
  }

  ws.addConditionalFormatting({
    ref: `G2:G${budgets.length + 1}`,
    rules: [
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'Over',
        style: {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: EXPENSE_ARGB },
          },
        },
        priority: 1,
      },
    ],
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/**
 * @description Goal progress workbook (available for future dispatch).
 */
export async function generateGoalXlsx(goals: Goal[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FinTrack';
  wb.created = new Date();

  const ws = wb.addWorksheet('Goal Progress');
  ws.columns = [
    { header: 'Goal Name', key: 'name', width: 28 },
    { header: 'Target Amount (NGN)', key: 'target', width: 22 },
    { header: 'Saved (NGN)', key: 'saved', width: 18 },
    { header: 'Remaining (NGN)', key: 'remaining', width: 18 },
    { header: 'Progress %', key: 'pct', width: 14 },
    { header: 'Target Date', key: 'targetDate', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Pace Status', key: 'pace', width: 14 },
  ];
  headerStyle(ws, 1, ws.columns.length);

  for (const g of goals) {
    const saved = g.contributedAmount ?? 0;
    const remaining = Math.max(0, g.targetAmount - saved);
    const pct =
      g.targetAmount > 0
        ? parseFloat(((saved / g.targetAmount) * 100).toFixed(1))
        : 0;
    ws.addRow({
      name: g.name,
      target: g.targetAmount,
      saved,
      remaining,
      pct,
      targetDate: g.targetDate,
      status: g.status,
      pace: g.paceStatus ?? '—',
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
