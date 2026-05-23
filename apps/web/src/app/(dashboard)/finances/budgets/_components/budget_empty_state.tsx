'use client';

import { PiggyBank } from 'lucide-react';
import { Button } from '@ui/components';
import { langToLocale } from '@fintrack/utils/format';
import { useUserPreferences } from '@/app/providers/user_preferences_provider';

interface BudgetEmptyStateProps {
  month: Date;
  onNew: () => void;
}

export function BudgetEmptyState({ month, onNew }: BudgetEmptyStateProps) {
  const { language } = useUserPreferences();
  const monthName = month.toLocaleDateString(langToLocale(language), { month: 'long', year: 'numeric' });

  return (
    <div className="col-span-full flex flex-col items-center gap-4 py-16 text-center">
      <div className="bg-bg-surface-hover flex size-14 items-center justify-center rounded-2xl">
        <PiggyBank className="text-text-disabled size-7" />
      </div>
      <div className="space-y-1">
        <p className="text-text-primary text-sm font-medium">No budgets for {monthName}</p>
        <p className="text-text-tertiary text-[12px]">
          Set spending limits to track where your money goes.
        </p>
      </div>
      <Button size="sm" onClick={onNew}>
        Create your first budget
      </Button>
    </div>
  );
}
