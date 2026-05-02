import { SubscriptionPlan, SubscriptionStatus } from './generated/prisma/index.js';
import { Usage } from '@fintrack/types/constants/plan.constants';

export interface GatedUsageResponse {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  stripeCurrentPeriodEnd: string | null;
  usage: Partial<Record<Usage, { count: number; periodStart: string; periodEnd: string }>>;
  limits: Record<Usage, number | boolean | null>;
  resourceCounts: {
    categories: number;
    budgets: number;
    recurringItems: number;
    goals: number;
    splits: number;
  };
}
