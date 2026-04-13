import { SubscriptionPlan, SubscriptionStatus } from '@fintrack/database/types';
import { Usage } from '@fintrack/types/constants/plan.constants';

export interface GatedUsageResponse {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  stripeCurrentPeriodEnd: string | null;
  usage: Partial<
    Record<Usage, { count: number; periodStart: string; periodEnd: string }>
  >;
  limits: Record<Usage, number | boolean | null>;
  resourceCounts: {
    categories: number;
    budgets: number;
    recurringItems: number;
    goals: number;
    splits: number;
  };
}
