import { Suspense } from 'react';
import { BudgetPageClient } from './_components/budget_page_client';
import { BudgetSpendingTrendServer } from './_components/budget_spending_trend_server';
import { SpendingTrendSkeleton } from '@/app/(dashboard)/finances/budgets/_components/spending_trend_skeletoon';

export default function BudgetsPage() {
  return (
    <BudgetPageClient
      trendNode={
        <Suspense fallback={<SpendingTrendSkeleton />}>
          <BudgetSpendingTrendServer defaultMonths={6} />
        </Suspense>
      }
    />
  );
}
