import { Check, Lock, Infinity as InfinityIcon, BarChart3, FileText, Download, Brain, MessageCircle, Receipt, Target, Repeat2, PieChart, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PlanFeature {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

export interface PlanHighlight {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  key: 'free' | 'pro';
  name: string;
  price: number;
  period: string;
  tagline: string;
  badge?: string;
  highlights: PlanHighlight[];
  ctaLabel: string;
  popular?: boolean;
}

export interface ComparisonRow {
  label: string;
  icon: LucideIcon;
  free: string | boolean;
  pro: string | boolean;
  category?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    period: '/month',
    tagline: 'Everything you need to get started with smart money management.',
    highlights: [
      { label: '5 budgets & 3 financial goals', included: true },
      { label: '3 custom categories', included: true },
      { label: 'AI insights (20 queries/mo)', included: true },
      { label: 'AI chat (10 messages/mo)', included: true },
      { label: '10 receipt uploads / mo', included: true },
      { label: '6-month analytics window', included: true },
      { label: 'Split expenses (up to 3 people)', included: true },
      { label: 'PDF & CSV export', included: false },
      { label: 'Unlimited everything', included: false },
    ],
    ctaLabel: 'Get started free',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 5,
    period: '/month',
    tagline: 'Unlock unlimited power for serious financial tracking.',
    badge: 'Most popular',
    popular: true,
    highlights: [
      { label: 'Unlimited budgets & goals', included: true },
      { label: 'Unlimited custom categories', included: true },
      { label: 'Unlimited AI insights & chat', included: true },
      { label: 'Unlimited receipt uploads', included: true },
      { label: 'All-time analytics history', included: true },
      { label: 'Unlimited splits & people', included: true },
      { label: 'PDF reports & CSV export', included: true },
      { label: 'Priority support', included: true },
      { label: 'Everything in Free', included: true },
    ],
    ctaLabel: 'Upgrade to Pro',
  },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'Custom categories',
    icon: PieChart,
    free: '3 categories',
    pro: 'Unlimited',
    category: 'Core',
  },
  {
    label: 'Budgets',
    icon: BarChart3,
    free: '5 budgets',
    pro: 'Unlimited',
    category: 'Core',
  },
  {
    label: 'Recurring items',
    icon: Repeat2,
    free: '5 items',
    pro: 'Unlimited',
    category: 'Core',
  },
  {
    label: 'Financial goals',
    icon: Target,
    free: '3 goals',
    pro: 'Unlimited',
    category: 'Core',
  },
  {
    label: 'Expense splits',
    icon: Users,
    free: '3 splits · 3 people',
    pro: 'Unlimited',
    category: 'Collaboration',
  },
  {
    label: 'AI insights queries',
    icon: Brain,
    free: '20 / month',
    pro: 'Unlimited',
    category: 'AI',
  },
  {
    label: 'AI chat messages',
    icon: MessageCircle,
    free: '10 / month',
    pro: 'Unlimited',
    category: 'AI',
  },
  {
    label: 'Receipt uploads',
    icon: Receipt,
    free: '10 / month',
    pro: 'Unlimited',
    category: 'AI',
  },
  {
    label: 'Analytics history',
    icon: BarChart3,
    free: '6 months',
    pro: 'All time',
    category: 'Analytics',
  },
  {
    label: 'PDF reports',
    icon: FileText,
    free: false,
    pro: true,
    category: 'Export',
  },
  {
    label: 'CSV export',
    icon: Download,
    free: false,
    pro: true,
    category: 'Export',
  },
];

export { Check, Lock, InfinityIcon };
