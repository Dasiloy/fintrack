'use client';

import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet } from 'lucide-react';
import { MetricCard } from '@/app/(dashboard)/_components/metric_card';
import { useFormatCurrency } from '@/hooks/use_format_currency';
import type { GetTransactionSummaryRes } from '@fintrack/types/protos/finance/transaction';

interface StatCardsProps {
  data?: GetTransactionSummaryRes | null;
  isLoading: boolean;
}

export function StatCards({ data, isLoading }: StatCardsProps) {
  const formatCurrency = useFormatCurrency();

  const income = data ? parseFloat(data.monthlyIncome) : 0;
  const expense = data ? parseFloat(data.monthlyExpense) : 0;
  const net = data ? parseFloat(data.monthlyNet) : 0;
  const savingsRate = income > 0 ? Math.max(0, (net / income) * 100) : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Thi Month's Income"
        value={income}
        format={formatCurrency}
        icon={ArrowUpRight}
        accentColor="#30d158"
        isLoading={isLoading}
        className="shadow-card"
        delay={0}
      />
      <MetricCard
        label="This Month's Expense"
        value={expense}
        format={formatCurrency}
        icon={ArrowDownRight}
        accentColor="#ff453a"
        isLoading={isLoading}
        className="shadow-card"
        delay={60}
      />
      <MetricCard
        label="Net Cashflow"
        value={net}
        format={formatCurrency}
        icon={Wallet}
        accentColor={net >= 0 ? '#7c7aff' : '#ff9f0a'}
        isLoading={isLoading}
        className="shadow-card"
        delay={120}
      />
      <MetricCard
        label="Savings Rate"
        value={savingsRate}
        format={(n) => `${n.toFixed(1)}%`}
        icon={TrendingUp}
        accentColor="#0a84ff"
        isLoading={isLoading}
        className="shadow-card"
        delay={180}
      />
    </div>
  );
}
