import type { Transaction } from '@fintrack/types/protos/finance/transaction';
import { format, isDateThisWeekIso, isDateToday, isDateYesterday } from '@fintrack/utils/date';

export function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  if (isDateToday(d)) return 'TODAY';
  if (isDateYesterday(d)) return 'YESTERDAY';
  if (isDateThisWeekIso(d)) return 'THIS WEEK';
  return format(d, 'MMMM d, yyyy');
}

export function groupTransactionsByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const g = getDateGroup(tx.date);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(tx);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}
