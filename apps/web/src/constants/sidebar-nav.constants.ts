import type { LucideIcon } from 'lucide-react';

import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';

import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  LayoutDashboard,
  MessageCircle,
  Repeat2,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Target,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isPro?: boolean;
}

export interface NavCollapsibleItem {
  title: string;
  icon: LucideIcon;
  isCollapsible: true;
  items: Omit<NavItem, 'isPro'>[];
}

export interface NavGroup {
  label: string;
  items: (NavItem | NavCollapsibleItem)[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', url: DASHBOARD_ROUTES.DASHBOARD, icon: LayoutDashboard }],
  },
  {
    label: 'Finances',
    items: [
      { title: 'Transactions', url: DASHBOARD_ROUTES.FINANCES_TRANSACTIONS, icon: ArrowLeftRight },
      { title: 'Bills & Recurring', url: DASHBOARD_ROUTES.FINANCES_BILLS, icon: Repeat2 },
      { title: 'Budgets', url: DASHBOARD_ROUTES.FINANCES_BUDGETS, icon: Wallet },
    ],
  },
  {
    label: 'Analytics & AI',
    items: [
      { title: 'Analytics', url: DASHBOARD_ROUTES.ANALYTICS, icon: BarChart3 },
      { title: 'Insights', url: DASHBOARD_ROUTES.ANALYTICS_INSIGHTS, icon: Sparkles, isPro: true },
      { title: 'Chat', url: DASHBOARD_ROUTES.ANALYTICS_CHAT, icon: MessageCircle, isPro: true },
    ],
  },
  {
    label: 'Planning',
    items: [
      { title: 'Goals', url: DASHBOARD_ROUTES.PLANNING_GOALS, icon: Target },
      { title: 'Split Bills', url: DASHBOARD_ROUTES.PLANNING_SPLITS, icon: Users },
    ],
  },
];

export const ACCOUNT_GROUP: NavGroup = {
  label: 'Account',
  items: [
    { title: 'Notifications', url: DASHBOARD_ROUTES.NOTIFICATIONS, icon: Bell },
    {
      title: 'Settings',
      icon: Settings2,
      isCollapsible: true,
      items: [
        { title: 'Profile', url: DASHBOARD_ROUTES.SETTINGS_PROFILE, icon: UserRound },
        { title: 'Account', url: DASHBOARD_ROUTES.SETTINGS_ACCOUNT, icon: SlidersHorizontal },
        { title: 'Invite Friends', url: DASHBOARD_ROUTES.SETTINGS_INVITE, icon: UserPlus },
      ],
    },
  ],
};
