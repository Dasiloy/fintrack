'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { PageHeader } from '@/app/_components/page-header';
import { useIsPro } from '@/app/providers/plan_usage_provider';
import { HealthScorecard } from './health_scorecard';
import { IncomeExpenseChart } from './income_expense_chart';
import { SavingsRateChart } from './savings_rate_chart';
import { SubscriptionBurdenCard } from './subscription_burden_card';
import { GoalFundingCard } from './goal_funding_card';
import { IncomeAllocationDonut } from './income_allocation_donut';
import { NetWorthChart } from './net_worth_chart';
import { ExportCenter } from './export_center';

const RANGE_OPTIONS = [
  { label: '3mo', months: 3, proOnly: false },
  { label: '6mo', months: 6, proOnly: false },
  { label: '12mo', months: 12, proOnly: false },
  { label: 'All time', months: undefined, proOnly: true },
] as const;

export function AnalyticsClient() {
  const isPro = useIsPro();
  const [months, setMonths] = React.useState<number | undefined>(6);

  const handleRangeChange = (opt: (typeof RANGE_OPTIONS)[number]) => {
    if (opt.proOnly && !isPro) return;
    setMonths(opt.months);
  };

  const { data: summaryData, isLoading: summaryLoading } =
    api_client.transaction.getSummary.useQuery(
      { months },
      { staleTime: 5 * 60 * 1000 },
    );

  const { data: goalData, isLoading: goalLoading } =
    api_client.goal.getAggregate.useQuery(undefined, {
      staleTime: 2 * 60 * 1000,
    });

  const { data: recurringData, isLoading: recurringLoading } =
    api_client.recurring.getSummary.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
    });

  const { data: budgetData, isLoading: budgetLoading } =
    api_client.budget.getAll.useQuery(
      { month: new Date().getMonth(), year: new Date().getFullYear() },
      { staleTime: 5 * 60 * 1000 },
    );

  const summary = summaryData?.data ?? null;
  const goalAggregate = goalData?.data ?? null;
  const budgets = budgetData?.data?.budgets ?? [];
  const monthlyRecurringExpense = recurringData?.data?.monthlyExpense ?? 0;
  const monthlyIncome = parseFloat(summary?.monthlyIncome ?? '0');

  const isLoading = summaryLoading || goalLoading || recurringLoading || budgetLoading;

  return (
    <div className="flex h-full flex-col">
      <PageHeader breadcrumbs={[{ label: 'Analytics' }]}>
        {/* Mobile dropdown */}
        <select
          className="sm:hidden rounded-lg bg-bg-elevated border border-border-subtle px-2.5 py-1 text-[11px] font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          value={months === undefined ? 'all' : String(months)}
          onChange={(e) => {
            const val = e.target.value;
            const opt = RANGE_OPTIONS.find((o) =>
              val === 'all' ? o.months === undefined : o.months === Number(val),
            );
            if (opt) handleRangeChange(opt);
          }}
        >
          {RANGE_OPTIONS.map((opt) => (
            <option
              key={opt.label}
              value={opt.months === undefined ? 'all' : String(opt.months)}
              disabled={opt.proOnly && !isPro}
            >
              {opt.label}{opt.proOnly && !isPro ? ' 🔒' : ''}
            </option>
          ))}
        </select>

        {/* Desktop tab strip */}
        <div className="hidden sm:flex items-center gap-1 rounded-lg bg-bg-elevated p-1">
          {RANGE_OPTIONS.map((opt) => {
            const active = opt.proOnly
              ? months === undefined
              : opt.months === months;
            const isLocked = opt.proOnly && !isPro;
            return (
              <button
                key={opt.label}
                type="button"
                disabled={isLocked}
                onClick={() => handleRangeChange(opt)}
                className={cn(
                  'relative flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-tertiary hover:text-text-primary',
                  isLocked && 'cursor-not-allowed opacity-50',
                )}
              >
                {opt.label}
                {isLocked && <Lock className="size-2.5" />}
              </button>
            );
          })}
        </div>
      </PageHeader>

      <main className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
        {/* Health Scorecard */}
        <section>
          <HealthScorecard
            summary={summary}
            goalAggregate={goalAggregate}
            budgets={budgets}
            isLoading={isLoading}
          />
        </section>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
          <IncomeExpenseChart data={summary} isLoading={summaryLoading} />
          <SavingsRateChart data={summary} isLoading={summaryLoading} />
        </div>

        {/* New charts row — donut + net worth */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
          <IncomeAllocationDonut
            summary={summary}
            monthlyRecurringExpense={monthlyRecurringExpense}
            isLoading={recurringLoading || summaryLoading}
          />
          <NetWorthChart data={summary} isLoading={summaryLoading} />
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SubscriptionBurdenCard
            monthlyRecurringExpense={monthlyRecurringExpense}
            monthlyIncome={monthlyIncome}
            isLoading={recurringLoading || summaryLoading}
          />
          <GoalFundingCard
            avgMonthlyContribution={goalAggregate?.avgMonthlyContribution ?? 0}
            monthlyIncome={monthlyIncome}
            isLoading={goalLoading || summaryLoading}
          />
        </div>

        {/* Export Center */}
        <ExportCenter months={months} isProUser={isPro ?? false} />
      </main>
    </div>
  );
}
