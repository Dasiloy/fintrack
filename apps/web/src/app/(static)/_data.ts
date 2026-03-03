/**
 * Homepage — local data.
 *
 * Centralises the content for every landing-page section so that
 * marketing copy can be updated in one place without touching component
 * layout/styling code.
 *
 * Scope: this file is intentionally local to the (static) homepage.
 * Move any entry to packages/types/constants only if another app
 * or package needs the same content.
 */
import { Zap, Globe, TrendingUp } from 'lucide-react';
import {
  BarChart3,
  PieChart,
  GitFork,
  Target,
  PiggyBank,
  FileText,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Metric {
  icon: LucideIcon;
  stat: string;
  label: string;
  description: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export const METRICS: Metric[] = [
  {
    icon: Zap,
    stat: '99.9%',
    label: 'Uptime Reliability',
    description:
      'Access your financial data anytime, anywhere. Our infrastructure ensures your money is always within reach.',
  },
  {
    icon: Globe,
    stat: '$2B+',
    label: 'Assets Tracked',
    description:
      'Trusted by thousands to monitor investments, savings, and daily expenses across the globe securely.',
  },
  {
    icon: TrendingUp,
    stat: '$400',
    label: 'Monthly Savings',
    description:
      'On average, our users save an extra $400 per month by identifying subscriptions and optimizing budgets.',
  },
];

// ─── Feature grid ─────────────────────────────────────────────────────────────

export const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: 'Smart Track',
    description: 'Automatically categorize transactions from all your accounts in real-time.',
  },
  {
    icon: PieChart,
    title: 'Flexible Budget',
    description: 'Create budgets that adapt to your spending habits and monthly needs.',
  },
  {
    icon: GitFork,
    title: 'Bill Splitting',
    description: 'Easily split bills and expenses with friends directly within the app.',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description: 'Set financial milestones and track your progress visually over time.',
  },
  {
    icon: PiggyBank,
    title: 'Auto Savings',
    description: 'Round up purchases and save the spare change automatically.',
  },
  {
    icon: FileText,
    title: 'Custom Reports',
    description: 'Generate detailed PDF reports for tax season or personal analysis.',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description: 'Receive personalized financial advice based on your spending patterns.',
  },
  {
    icon: Lock,
    title: 'Bank Security',
    description: 'Your data is protected with 256-bit encryption and biometric security.',
  },
];

// ─── Social proof ─────────────────────────────────────────────────────────────

export const LOGOS = [
  { name: 'Acme', shapeClass: 'rounded-full' },
  { name: 'Nexus', shapeClass: 'rotate-45' },
  { name: 'Stark', shapeClass: 'rounded-sm border-2 border-current' },
  { name: 'Bolt', shapeClass: 'rounded-tr-xl rounded-bl-xl' },
] as const;

// ─── Feature highlight ────────────────────────────────────────────────────────

export const FEATURE_CHECKLIST = [
  'Bank-level security encryption',
  'Custom alerts and notifications',
  'Exportable reports for tax season',
] as const;
