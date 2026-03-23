'use client';

import { api_client } from '@/lib/trpc_app/api_client';
import type { RouterOutputs } from '@/lib/trpc_app/client';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { createContext, useContext, useMemo } from 'react';

type PlanUsageContextValue = RouterOutputs['subscription']['getGatedUsage'];

const PlanUsageContext = createContext<PlanUsageContextValue | null>(null);

export function PlanUsageProvider({ children }: React.PropsWithChildren) {
  const { data } = api_client.subscription.getGatedUsage.useQuery({} as any, {
    staleTime: 1000 * 60 * 5, //5min
  });

  const value = useMemo(() => data ?? null, [data]);

  return <PlanUsageContext.Provider value={value}>{children}</PlanUsageContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanUsageContext);
  if (!context) {
    return null;
  }
  return context;
}

export function useIsPro() {
  const context = useContext(PlanUsageContext);
  if (!context) {
    return null;
  }
  return context.plan === 'PRO';
}

export function useCanUseFeature(feature: Usage) {
  const context = useContext(PlanUsageContext);

  //*  Data is not loaded yet
  if (!context) {
    return false;
  }

  //* if user is pro, return true
  if (context.plan === 'PRO') {
    return true;
  }

  //* Free plan users are not allowed to access this feature
  if (['PDF_REPORTS', 'CSV_EXPORT'].includes(feature)) {
    //? Free plan users are not allowed to access this feature
    return false;
  }

  //* Feature is a resource limit ==> Resource based access
  if (feature.startsWith('MAX')) {
    let currentUsage = Infinity;

    switch (feature) {
      case Usage.MAX_ACTIVE_SPLITS:
        currentUsage = context.resourceCounts.splits;
        break;
      case Usage.MAX_GOALS:
        currentUsage = context.resourceCounts.goals;
        break;
      case Usage.MAX_BUDGETS:
        currentUsage = context.resourceCounts.budgets;
        break;
      case Usage.MAX_CUSTOM_CATEGORIES:
        currentUsage = context.resourceCounts.categories;
        break;

      case Usage.MAX_RECURRING_ITEMS:
        currentUsage = context.resourceCounts.recurringItems;
        break;
      default:
        currentUsage = Infinity;
    }
    return currentUsage < context.limits[feature];
  }

  //* Feature is a monthly limit ==> Usage based access
  if (feature.endsWith('_PER_MONTH')) {
    const currentUsage = context.usage[feature]!;
    const limit = context.limits[feature];
    return currentUsage?.count < limit;
  }

  //* Potential hacker trying to access a feature that is not allowed
  return false;
}
