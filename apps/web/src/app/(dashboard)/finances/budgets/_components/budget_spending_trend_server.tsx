import { api_caller } from '@/lib/trpc_app/api_server';
import { BudgetSpendingTrend } from './budget_spending_trend';

interface BudgetSpendingTrendServerProps {
  defaultMonths?: 3 | 6 | 12;
}

export async function BudgetSpendingTrendServer({
  defaultMonths = 6,
}: BudgetSpendingTrendServerProps) {
  try {
    const data = await api_caller.budget.getSpendingTrend({ months: defaultMonths });
    return <BudgetSpendingTrend defaultMonths={defaultMonths} initialData={data} />;
  } catch {
    // Fallback to client-only fetch if SSR fails — no skeleton flash, just client fetch.
    return <BudgetSpendingTrend defaultMonths={defaultMonths} />;
  }
}
