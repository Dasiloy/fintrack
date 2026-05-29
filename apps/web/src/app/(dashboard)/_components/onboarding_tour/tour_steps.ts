import type { OnbordaProps } from 'onborda';

// Steps 1–3 are the same on every screen size (they target main-content elements
// that are always visible). Steps 4–7 differ:
//   • Desktop/tablet: spotlight each sidebar nav item individually.
//   • Mobile: sidebar is a hidden drawer, so collapse all 4 into one step
//     that targets the visible SidebarTrigger button in the page header.

const SHARED_STEPS: OnbordaProps['steps'][number]['steps'] = [
  {
    icon: '💰',
    title: 'Your financial snapshot',
    content:
      'Your net balance is income minus expenses for all time. The cards on the right show your total income and total spend at a glance.',
    selector: '#onborda-hero',
    side: 'bottom',
    showControls: true,
    pointerPadding: 10,
    pointerRadius: 12,
  },
  {
    icon: '📊',
    title: 'Key metrics at a glance',
    content:
      'Income, expenses, savings rate, and transaction count for the selected month — all updated in real time.',
    selector: '#onborda-stat-cards',
    side: 'bottom',
    showControls: true,
    pointerPadding: 10,
    pointerRadius: 12,
  },
  {
    icon: '📈',
    title: 'Monthly cashflow',
    content:
      'Compare income vs. expenses across months. Hover any bar to see exact figures. Surplus months appear taller on the income side.',
    selector: '#onborda-cashflow',
    side: 'top',
    showControls: true,
    pointerPadding: 10,
    pointerRadius: 12,
  },
];

const SIDEBAR_NAV_STEPS: OnbordaProps['steps'][number]['steps'] = [
  {
    icon: '↕️',
    title: 'Log transactions',
    content:
      'Record every income and expense here. Categorise them, attach receipts, or let the AI classify them automatically.',
    selector: '#onborda-nav-transactions',
    side: 'right',
    showControls: true,
    pointerPadding: 10,
    pointerRadius: 12,
  },
  {
    icon: '💳',
    title: 'Set spending limits',
    content:
      "Create budgets per category and get alerted when you're close to the limit. Great for keeping discretionary spend in check.",
    selector: '#onborda-nav-budgets',
    side: 'right',
    showControls: true,
    pointerPadding: 10,
    pointerRadius: 12,
  },
  {
    icon: '🎯',
    title: 'Save towards goals',
    content:
      'Define a savings target — a car, an emergency fund, a vacation — and track progress as you contribute each month.',
    selector: '#onborda-nav-goals',
    side: 'right',
    showControls: true,
    pointerPadding: 10,
    pointerRadius: 12,
  },
  {
    icon: '🤝',
    title: 'Split group expenses',
    content:
      'Track shared costs with friends or flatmates. Add participants, split the bill, and see who owes what at a glance.',
    selector: '#onborda-nav-splits',
    side: 'right',
    showControls: true,
    pointerPadding: 10,
    pointerRadius: 12,
  },
];

// Single step used on mobile in place of the four sidebar nav steps.
const MOBILE_NAV_STEP: OnbordaProps['steps'][number]['steps'][number] = {
  icon: '🗺️',
  title: 'Explore the app',
  content:
    'Tap this button to open the navigation menu. Inside you\'ll find Transactions, Budgets, Goals, and Split Bills — everything you need to manage your finances.',
  selector: '#onborda-mobile-nav',
  side: 'bottom',
  showControls: true,
  pointerPadding: 10,
  pointerRadius: 12,
};

/** Full 7-step tour — used on tablet and desktop where the sidebar is visible. */
export const TOUR_STEPS: OnbordaProps['steps'] = [
  { tour: 'main', steps: [...SHARED_STEPS, ...SIDEBAR_NAV_STEPS] },
];

/** Condensed 4-step tour — used on mobile where the sidebar nav is hidden in a drawer. */
export const TOUR_STEPS_MOBILE: OnbordaProps['steps'] = [
  { tour: 'main', steps: [...SHARED_STEPS, MOBILE_NAV_STEP] },
];
