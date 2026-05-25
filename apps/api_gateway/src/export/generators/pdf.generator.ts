/**
 * PDF export generators (PDFKit, A4) for analytics reports.
 *
 * @module pdf.generator
 */

import { join } from 'path';
import { existsSync } from 'fs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import type { Budget } from '@fintrack/types/protos/finance/budget';
import type { Goal } from '@fintrack/types/protos/finance/goal';
import type { SpendingTrendMonth } from '@fintrack/types/protos/finance/budget';
import type { MonthlyFinancials } from '@fintrack/types/protos/finance/transaction';
import { formatNGN } from '../export.format';

const PRIMARY_HEX = '#7C7AFF';
const DARK_HEX = '#1a1a2e';
const MUTED_HEX = '#888888';

// Resolve white logo once at module load — works from both `src/` (ts-node) and `dist/` (compiled)
const LOGO_WHITE_PATH = (() => {
  const candidates = [
    join(__dirname, '..', '..', '..', 'assets', 'logo-white.png'),
    join(__dirname, '..', '..', 'assets', 'logo-white.png'),
    join(process.cwd(), 'assets', 'logo-white.png'),
  ];
  return candidates.find(existsSync) ?? null;
})();

function bufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function coverBlock(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  // Purple rounded-square logo badge (56 × 56 px)
  doc.roundedRect(50, 40, 56, 56, 10).fill(PRIMARY_HEX);
  if (LOGO_WHITE_PATH) {
    doc.image(LOGO_WHITE_PATH, 50, 40, { width: 56, height: 56 });
  } else {
    doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('FT', 66, 54);
  }

  doc
    .fillColor(DARK_HEX)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(title, 50, 118);
  doc
    .fillColor(MUTED_HEX)
    .fontSize(11)
    .font('Helvetica')
    .text(subtitle, 50, 146);
  doc
    .moveTo(50, 168)
    .lineTo(545, 168)
    .strokeColor('#e5e7eb')
    .lineWidth(1)
    .stroke();
}

function metricRow(
  doc: PDFKit.PDFDocument,
  y: number,
  label: string,
  value: string,
  valueColor = DARK_HEX,
) {
  doc.fillColor(MUTED_HEX).fontSize(10).font('Helvetica').text(label, 50, y);
  doc
    .fillColor(valueColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(value, 300, y, { align: 'left' });
}

// ─── Monthly Summary PDF ───────────────────────────────────────────────────

/** @description Monthly income/expense summary with key metrics and breakdown table. */
export async function generateMonthlySummaryPdf(
  monthlySeries: MonthlyFinancials[],
  periodLabel: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const promise = bufferFromDoc(doc);

  const totalIncome = monthlySeries.reduce(
    (s, m) => s + parseFloat(m.income),
    0,
  );
  const totalExpense = monthlySeries.reduce(
    (s, m) => s + parseFloat(m.expense),
    0,
  );
  const netSaved = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? ((netSaved / totalIncome) * 100).toFixed(1) : '0';

  coverBlock(doc, 'Monthly Financial Summary', periodLabel);

  let y = 190;
  doc
    .fillColor(DARK_HEX)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Key Metrics', 50, y);
  y += 22;
  metricRow(doc, y, 'Total Income', formatNGN(totalIncome), '#30d158');
  y += 18;
  metricRow(doc, y, 'Total Spent', formatNGN(totalExpense), '#ff453a');
  y += 18;
  metricRow(
    doc,
    y,
    'Net Saved',
    formatNGN(netSaved),
    netSaved >= 0 ? '#30d158' : '#ff453a',
  );
  y += 18;
  metricRow(doc, y, 'Savings Rate', `${savingsRate}%`, PRIMARY_HEX);

  y += 36;
  doc
    .fillColor(DARK_HEX)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Month-by-Month Breakdown', 50, y);
  y += 18;

  const colWidths = [90, 120, 120, 110, 90];
  const headers = ['Month', 'Income', 'Expense', 'Net', 'Rate %'];
  headers.forEach((h, i) => {
    const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.fillColor('#ffffff').rect(x, y, colWidths[i], 18).fill(PRIMARY_HEX);
    doc
      .fillColor('#ffffff')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(h, x + 4, y + 5, { width: colWidths[i] - 8 });
  });
  y += 18;

  for (const m of [...monthlySeries].sort((a, b) =>
    a.month.localeCompare(b.month),
  )) {
    const inc = parseFloat(m.income);
    const exp = parseFloat(m.expense);
    const net = inc - exp;
    const rate = inc > 0 ? ((net / inc) * 100).toFixed(1) : '0';
    const cells = [
      m.month,
      formatNGN(inc),
      formatNGN(exp),
      formatNGN(net),
      `${rate}%`,
    ];
    cells.forEach((c, i) => {
      const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc
        .fillColor(DARK_HEX)
        .fontSize(9)
        .font('Helvetica')
        .text(c, x + 4, y + 4, { width: colWidths[i] - 8 });
    });
    y += 16;
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
  }

  y += 20;
  doc
    .fillColor(MUTED_HEX)
    .fontSize(9)
    .text(
      `Generated by FinTrack · ${new Date().toLocaleDateString('en-GB')}`,
      50,
      y,
    );

  doc.end();
  return promise;
}

// ─── Budget Performance PDF ────────────────────────────────────────────────

/** @description Per-budget limit, spend, remaining, and over/under status. */
export async function generateBudgetPerformancePdf(
  budgets: Budget[],
  periodLabel: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const promise = bufferFromDoc(doc);

  coverBlock(doc, 'Budget Performance Report', periodLabel);

  const totalLimit = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce(
    (s, b) => s + parseFloat(b.spent ?? '0'),
    0,
  );
  const overBudget = budgets.filter(
    (b) => parseFloat(b.spent ?? '0') > b.amount,
  ).length;

  let y = 190;
  metricRow(doc, y, 'Total Budget Limit', formatNGN(totalLimit));
  y += 18;
  metricRow(
    doc,
    y,
    'Total Spent',
    formatNGN(totalSpent),
    totalSpent > totalLimit ? '#ff453a' : '#30d158',
  );
  y += 18;
  metricRow(
    doc,
    y,
    'Budgets Over Limit',
    String(overBudget),
    overBudget > 0 ? '#ff453a' : '#30d158',
  );

  y += 36;
  doc
    .fillColor(DARK_HEX)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Budget Details', 50, y);
  y += 18;

  const cols = [160, 100, 100, 100, 70];
  const headers = ['Budget', 'Limit', 'Spent', 'Remaining', 'Status'];
  headers.forEach((h, i) => {
    const x = 50 + cols.slice(0, i).reduce((a, b) => a + b, 0);
    doc.fillColor('#ffffff').rect(x, y, cols[i], 18).fill(PRIMARY_HEX);
    doc
      .fillColor('#ffffff')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(h, x + 4, y + 5, { width: cols[i] - 8 });
  });
  y += 18;

  for (const b of budgets) {
    const spent = parseFloat(b.spent ?? '0');
    const remaining = b.amount - spent;
    const isOver = spent > b.amount;
    const cells = [
      b.name,
      formatNGN(b.amount),
      formatNGN(spent),
      formatNGN(remaining),
      isOver ? 'Over' : 'Under',
    ];
    cells.forEach((c, i) => {
      const x = 50 + cols.slice(0, i).reduce((a, b) => a + b, 0);
      const color = i === 4 ? (isOver ? '#ff453a' : '#30d158') : DARK_HEX;
      doc
        .fillColor(color)
        .fontSize(9)
        .font('Helvetica')
        .text(c, x + 4, y + 4, { width: cols[i] - 8 });
    });
    y += 16;
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
  }

  y += 20;
  doc
    .fillColor(MUTED_HEX)
    .fontSize(9)
    .text(
      `Generated by FinTrack · ${new Date().toLocaleDateString('en-GB')}`,
      50,
      y,
    );
  doc.end();
  return promise;
}

// ─── Goal Progress PDF ─────────────────────────────────────────────────────

/** @description Per-goal target, saved amount, progress %, and pace status. */
export async function generateGoalProgressPdf(
  goals: Goal[],
  periodLabel: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const promise = bufferFromDoc(doc);

  coverBlock(doc, 'Goal Progress Report', periodLabel);

  let y = 190;

  for (const g of goals) {
    if (y > 660) {
      doc.addPage();
      y = 50;
    }

    const saved = g.contributedAmount ?? 0;
    const pct =
      g.targetAmount > 0 ? ((saved / g.targetAmount) * 100).toFixed(1) : '0';
    const paceColor =
      g.paceStatus === 'ON_TRACK'
        ? '#30d158'
        : g.paceStatus === 'BEHIND'
          ? '#ff9f0a'
          : '#ff453a';

    doc
      .fillColor(DARK_HEX)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(g.name, 50, y);
    if (g.paceStatus) {
      doc
        .fillColor(paceColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(g.paceStatus.replace('_', ' '), 400, y + 2);
    }
    y += 16;

    metricRow(doc, y, 'Target', formatNGN(g.targetAmount));
    y += 14;
    metricRow(doc, y, 'Saved', formatNGN(saved), '#30d158');
    y += 14;
    metricRow(
      doc,
      y,
      'Remaining',
      formatNGN(Math.max(0, g.targetAmount - saved)),
    );
    y += 14;
    metricRow(doc, y, 'Progress', `${pct}%`, PRIMARY_HEX);
    y += 14;
    metricRow(doc, y, 'Target Date', g.targetDate);
    if (g.monthsLeft !== undefined && g.monthsLeft !== null) {
      y += 14;
      metricRow(doc, y, 'Months Left', String(g.monthsLeft));
    }
    if (g.paceRequired) {
      y += 14;
      metricRow(doc, y, 'Monthly Needed', formatNGN(g.paceRequired));
    }
    if (g.paceActual) {
      y += 14;
      metricRow(doc, y, 'Avg Monthly Contribution', formatNGN(g.paceActual));
    }

    y += 10;
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .stroke();
    y += 16;
  }

  doc
    .fillColor(MUTED_HEX)
    .fontSize(9)
    .text(
      `Generated by FinTrack · ${new Date().toLocaleDateString('en-GB')}`,
      50,
      y + 10,
    );
  doc.end();
  return promise;
}

// ─── Net Worth Statement PDF ───────────────────────────────────────────────

/** @description Cumulative net-worth series and headline net balance. */
export async function generateNetWorthPdf(
  monthlySeries: MonthlyFinancials[],
  netBalance: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const promise = bufferFromDoc(doc);

  const sorted = [...monthlySeries].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
  let running = 0;
  const rows = sorted.map((m) => {
    const net = parseFloat(m.income) - parseFloat(m.expense);
    running += net;
    return {
      month: m.month,
      income: parseFloat(m.income),
      expense: parseFloat(m.expense),
      net,
      cumulative: running,
    };
  });

  const isGrowing =
    rows.length >= 2
      ? rows[rows.length - 1].cumulative >= rows[0].cumulative
      : true;

  coverBlock(
    doc,
    'Net Worth Statement',
    `All-time balance sheet · Generated ${new Date().toLocaleDateString('en-GB')}`,
  );

  let y = 190;
  metricRow(
    doc,
    y,
    'All-Time Net Balance',
    formatNGN(parseFloat(netBalance)),
    parseFloat(netBalance) >= 0 ? '#30d158' : '#ff453a',
  );
  y += 18;
  metricRow(
    doc,
    y,
    'Trend Direction',
    isGrowing ? '↑ Growing' : '↓ Declining',
    isGrowing ? '#30d158' : '#ff453a',
  );

  y += 36;
  doc
    .fillColor(DARK_HEX)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Monthly Breakdown', 50, y);
  y += 18;

  const cols = [80, 110, 110, 110, 120];
  const headers = ['Month', 'Income', 'Expense', 'Monthly Net', 'Cumulative'];
  headers.forEach((h, i) => {
    const x = 50 + cols.slice(0, i).reduce((a, b) => a + b, 0);
    doc.fillColor('#ffffff').rect(x, y, cols[i], 18).fill(PRIMARY_HEX);
    doc
      .fillColor('#ffffff')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(h, x + 4, y + 5, { width: cols[i] - 8 });
  });
  y += 18;

  for (const r of rows) {
    const cells = [
      r.month,
      formatNGN(r.income),
      formatNGN(r.expense),
      formatNGN(r.net),
      formatNGN(r.cumulative),
    ];
    cells.forEach((c, i) => {
      const x = 50 + cols.slice(0, i).reduce((a, b) => a + b, 0);
      const color =
        i === 3
          ? r.net >= 0
            ? '#30d158'
            : '#ff453a'
          : i === 4
            ? r.cumulative >= 0
              ? '#30d158'
              : '#ff453a'
            : DARK_HEX;
      doc
        .fillColor(color)
        .fontSize(9)
        .font('Helvetica')
        .text(c, x + 4, y + 4, { width: cols[i] - 8 });
    });
    y += 16;
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
  }

  y += 20;
  doc
    .fillColor(MUTED_HEX)
    .fontSize(9)
    .text(
      `Generated by FinTrack · ${new Date().toLocaleDateString('en-GB')}`,
      50,
      y,
    );
  doc.end();
  return promise;
}

// ─── Spending Breakdown PDF (fallback when image is not available) ──────────

/** @description Category spend breakdown from spending-trend gRPC data. */
export async function generateSpendingBreakdownPdf(
  trendData: SpendingTrendMonth[],
  periodLabel: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const promise = bufferFromDoc(doc);

  coverBlock(doc, 'Spending Breakdown', periodLabel);

  // Aggregate categories across all months
  const map = new Map<
    string,
    { name: string; color: string; amount: number }
  >();
  for (const month of trendData) {
    for (const cat of month.byCategory ?? []) {
      const existing = map.get(cat.name);
      if (existing) {
        existing.amount += cat.amount;
      } else {
        map.set(cat.name, {
          name: cat.name,
          color: cat.color,
          amount: cat.amount,
        });
      }
    }
  }
  const sorted = [...map.values()].sort((a, b) => b.amount - a.amount);
  const total = sorted.reduce((s, c) => s + c.amount, 0) || 1;

  let y = 190;
  doc
    .fillColor(DARK_HEX)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Spending by Category', 50, y);
  y += 22;

  for (const cat of sorted) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    const pct = ((cat.amount / total) * 100).toFixed(1);
    doc
      .fillColor(DARK_HEX)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(cat.name, 50, y);
    doc
      .fillColor(MUTED_HEX)
      .fontSize(10)
      .font('Helvetica')
      .text(`${formatNGN(cat.amount)} · ${pct}%`, 300, y);
    y += 14;
    const barW = Math.round((cat.amount / total) * 300);
    doc.rect(50, y, 300, 6).fill('#e5e7eb');
    if (barW > 0) doc.rect(50, y, barW, 6).fill(cat.color || PRIMARY_HEX);
    y += 16;
  }

  y += 10;
  doc
    .fillColor(MUTED_HEX)
    .fontSize(9)
    .text(
      `Generated by FinTrack · ${new Date().toLocaleDateString('en-GB')}`,
      50,
      y,
    );
  doc.end();
  return promise;
}
