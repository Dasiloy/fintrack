import {
  BookOpen,
  CreditCard,
  ShieldCheck,
  BarChart3,
  Brain,
  Wrench,
  Users,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── Category ── */

export interface SupportCategory {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  gradientClass: string;
}

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Set up your account, connect your first budget, and get oriented.',
    icon: BookOpen,
    iconClass: 'text-primary',
    gradientClass: 'from-primary/15 to-transparent',
  },
  {
    slug: 'billing',
    title: 'Billing & Plans',
    description: 'Manage your subscription, understand your plan limits, and handle payments.',
    icon: CreditCard,
    iconClass: 'text-emerald-400',
    gradientClass: 'from-emerald-500/15 to-transparent',
  },
  {
    slug: 'account-security',
    title: 'Account & Security',
    description: 'Passwords, two-factor auth, connected accounts, and data privacy.',
    icon: ShieldCheck,
    iconClass: 'text-sky-400',
    gradientClass: 'from-sky-500/15 to-transparent',
  },
  {
    slug: 'budgets-goals',
    title: 'Budgets & Goals',
    description: 'Create budgets, set financial goals, and track your splits.',
    icon: Target,
    iconClass: 'text-amber-400',
    gradientClass: 'from-amber-500/15 to-transparent',
  },
  {
    slug: 'ai-features',
    title: 'AI Features',
    description: 'Using AI Insights, AI Chat, and receipt scanning to understand your finances.',
    icon: Brain,
    iconClass: 'text-violet-400',
    gradientClass: 'from-violet-500/15 to-transparent',
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Fix sync issues, resolve errors, and get your data back on track.',
    icon: Wrench,
    iconClass: 'text-rose-400',
    gradientClass: 'from-rose-500/15 to-transparent',
  },
];

/* ── Article body blocks ── */

export type SupportBlock =
  | { type: 'lead'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'steps'; items: Array<{ title: string; body: string }> }
  | { type: 'note'; variant: 'info' | 'warning' | 'tip'; text: string }
  | { type: 'list'; items: string[] };

/* ── Article ── */

export interface SupportArticle {
  slug: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  popular?: boolean;
  body: SupportBlock[];
}

/* ── Articles ── */

export const SUPPORT_ARTICLES: SupportArticle[] = [
  // ── Getting Started ──
  {
    slug: 'create-your-account',
    categorySlug: 'getting-started',
    title: 'How to create your FinTrack account',
    excerpt: 'Step-by-step guide to signing up with email, Google, or Apple.',
    popular: true,
    body: [
      { type: 'lead', text: 'Getting started with FinTrack takes under two minutes. You can sign up with your email and password, or use Google or Apple for a one-tap setup.' },
      { type: 'h2', text: 'Sign up with email' },
      {
        type: 'steps',
        items: [
          { title: 'Go to the sign-up page', body: 'Visit fintrack.app/signup or click "Get Started" on the home page.' },
          { title: 'Enter your details', body: 'Type your first name, last name, email address, and a strong password (min. 8 characters).' },
          { title: 'Verify your email', body: 'Check your inbox for a 6-digit code and enter it on the verification screen. The code expires in 10 minutes.' },
          { title: 'Complete your profile', body: 'Set your preferred currency and timezone. You can change these later in Settings.' },
        ],
      },
      { type: 'h2', text: 'Sign up with Google or Apple' },
      { type: 'paragraph', text: 'Click "Login with Google" or "Login with Apple" on the sign-up page. Authorize the permissions, and FinTrack creates your account automatically — no email verification step required.' },
      { type: 'note', variant: 'tip', text: 'Social sign-in accounts can add a password later via Settings → Account → Set Password, so you can always log in either way.' },
    ],
  },
  {
    slug: 'first-budget',
    categorySlug: 'getting-started',
    title: 'Creating your first budget',
    excerpt: 'Learn how to set up a budget in under 5 minutes and start tracking immediately.',
    popular: true,
    body: [
      { type: 'lead', text: 'A budget in FinTrack is a monthly spending limit for a category. Creating one takes seconds — here\'s how.' },
      { type: 'steps', items: [
        { title: 'Open Finances → Budgets', body: 'From the sidebar, go to Finances and select Budgets.' },
        { title: 'Click "New Budget"', body: 'Hit the "+ New Budget" button in the top right.' },
        { title: 'Pick a category', body: 'Choose from your existing categories or create a new one. Examples: Groceries, Dining, Transport.' },
        { title: 'Set your limit', body: 'Enter the monthly spending limit in your account currency.' },
        { title: 'Save', body: 'Click Save. Your budget is live and will track transactions in that category for the current month.' },
      ]},
      { type: 'note', variant: 'info', text: 'Free accounts can create up to 5 budgets. Upgrade to Pro for unlimited budgets.' },
    ],
  },
  {
    slug: 'add-transactions',
    categorySlug: 'getting-started',
    title: 'Adding and categorizing transactions',
    excerpt: 'Manually add transactions or upload a receipt and let AI handle the rest.',
    body: [
      { type: 'lead', text: 'FinTrack lets you add transactions manually or via receipt scan. Here\'s how both work.' },
      { type: 'h2', text: 'Manual entry' },
      { type: 'steps', items: [
        { title: 'Go to Finances → Transactions', body: 'Open the Transactions tab from the sidebar.' },
        { title: 'Click "Add Transaction"', body: 'Fill in the amount, date, and description.' },
        { title: 'Assign a category', body: 'Pick from your existing categories. FinTrack will remember your choice for similar merchants.' },
      ]},
      { type: 'h2', text: 'Receipt scan (Pro)' },
      { type: 'paragraph', text: 'Tap the camera icon, photograph your receipt, and FinTrack\'s AI extracts the merchant, amount, and date automatically. Review and confirm before saving.' },
    ],
  },
  {
    slug: 'dashboard-overview',
    categorySlug: 'getting-started',
    title: 'Understanding the dashboard',
    excerpt: 'A quick tour of every widget and what it tells you about your finances.',
    body: [
      { type: 'lead', text: 'The FinTrack dashboard is designed to give you a full picture of your financial health at a glance. Here\'s what each section shows.' },
      { type: 'list', items: [
        'Net Worth widget — your total assets minus liabilities, updated in real time.',
        'Spending this month — total spend vs last month, color-coded by budget status.',
        'Budget bars — progress bars for each active budget category.',
        'Goals — progress toward your savings and financial goals.',
        'Recent transactions — your last 5 transactions with category labels.',
        'AI Insights — one-click access to your latest AI-generated financial summary.',
      ]},
      { type: 'note', variant: 'tip', text: 'You can reorder and hide widgets from Settings → Dashboard Layout (Pro feature).' },
    ],
  },

  // ── Billing ──
  {
    slug: 'upgrade-to-pro',
    categorySlug: 'billing',
    title: 'How to upgrade to Pro',
    excerpt: 'Unlock unlimited features for $5/month. Here\'s how to upgrade in seconds.',
    popular: true,
    body: [
      { type: 'lead', text: 'FinTrack Pro gives you unlimited budgets, goals, AI features, and PDF/CSV exports for $5/month. Here\'s how to upgrade.' },
      { type: 'steps', items: [
        { title: 'Go to Settings → Account', body: 'Click your avatar in the top-right corner and select Settings, then Account.' },
        { title: 'Click "Upgrade to Pro"', body: 'You\'ll see your current plan and a prominent upgrade button.' },
        { title: 'Enter payment details', body: 'We use Stripe for secure payment processing. Your card details are never stored on our servers.' },
        { title: 'Confirm', body: 'Click "Subscribe". Your account upgrades instantly — no waiting period.' },
      ]},
      { type: 'note', variant: 'tip', text: 'Pro renews monthly. You can cancel any time from the same Settings page and keep your Pro access until the end of the billing period.' },
    ],
  },
  {
    slug: 'cancel-subscription',
    categorySlug: 'billing',
    title: 'How to cancel your subscription',
    excerpt: 'Cancel at any time — no penalties, and you keep Pro access until your billing period ends.',
    body: [
      { type: 'lead', text: 'You can cancel your Pro subscription at any time. There are no cancellation fees.' },
      { type: 'steps', items: [
        { title: 'Go to Settings → Account', body: 'Click your avatar, then Settings → Account.' },
        { title: 'Find your plan details', body: 'Your current plan and next billing date are shown here.' },
        { title: 'Click "Cancel subscription"', body: 'Confirm when prompted. Your plan will not renew on the next billing date.' },
      ]},
      { type: 'note', variant: 'info', text: 'After cancellation you keep Pro features until the end of your current billing period. After that you revert to the Free plan — your data is never deleted.' },
    ],
  },
  {
    slug: 'plan-limits',
    categorySlug: 'billing',
    title: 'Free vs Pro plan limits',
    excerpt: 'A full breakdown of what\'s included in each plan.',
    body: [
      { type: 'lead', text: 'Here\'s exactly what each plan includes so you can decide which is right for you.' },
      { type: 'h2', text: 'Free plan' },
      { type: 'list', items: [
        '5 budgets per month',
        '3 custom categories',
        '3 financial goals',
        '3 active expense splits (up to 3 people each)',
        '20 AI Insights queries per month',
        '10 AI Chat messages per month',
        '10 receipt uploads per month',
        '6 months of analytics history',
      ]},
      { type: 'h2', text: 'Pro plan ($5/month)' },
      { type: 'list', items: [
        'Unlimited budgets, categories, and goals',
        'Unlimited expense splits and participants',
        'Unlimited AI Insights and AI Chat',
        'Unlimited receipt uploads',
        'All-time analytics history',
        'PDF reports and CSV export',
        'Priority support',
      ]},
    ],
  },
  {
    slug: 'payment-failed',
    categorySlug: 'billing',
    title: 'My payment failed — what do I do?',
    excerpt: 'Common reasons payments fail and how to fix them quickly.',
    body: [
      { type: 'lead', text: 'If your subscription payment fails, your Pro access remains active for a short grace period while you resolve the issue.' },
      { type: 'h2', text: 'Common reasons & fixes' },
      { type: 'list', items: [
        'Expired card — update your card details in Settings → Account → Billing.',
        'Insufficient funds — ensure your card has enough available balance on your renewal date.',
        'Card declined by bank — contact your bank or try a different card.',
        '3DS authentication required — check your email for a verification link from your bank.',
      ]},
      { type: 'note', variant: 'warning', text: 'After 3 failed retries over 7 days, your subscription is cancelled automatically. You\'ll receive an email notification before this happens.' },
    ],
  },

  // ── Account & Security ──
  {
    slug: 'reset-password',
    categorySlug: 'account-security',
    title: 'How to reset your password',
    excerpt: 'Forgotten your password? Reset it in a few clicks via email.',
    popular: true,
    body: [
      { type: 'lead', text: 'You can reset your password from the login page at any time. You\'ll need access to your registered email address.' },
      { type: 'steps', items: [
        { title: 'Go to the login page', body: 'Visit fintrack.app/login.' },
        { title: 'Click "Forgot password?"', body: 'This link is below the password field.' },
        { title: 'Enter your email', body: 'We\'ll send a 6-digit OTP code to that address.' },
        { title: 'Enter the OTP', body: 'Check your inbox (and spam folder) for the code. It expires in 15 minutes.' },
        { title: 'Set a new password', body: 'Choose a strong password of at least 8 characters. You\'ll be logged in automatically.' },
      ]},
    ],
  },
  {
    slug: 'change-email',
    categorySlug: 'account-security',
    title: 'How to change your email address',
    excerpt: 'Update the email linked to your FinTrack account safely.',
    body: [
      { type: 'lead', text: 'You can change your email address from the profile settings. Your current email will be notified of the change.' },
      { type: 'steps', items: [
        { title: 'Go to Settings → Profile', body: 'Click your avatar in the top-right, then Settings → Profile.' },
        { title: 'Click "Change email"', body: 'Enter your new email address.' },
        { title: 'Verify the new address', body: 'We\'ll send a verification code to your new email. Enter it to confirm the change.' },
      ]},
      { type: 'note', variant: 'warning', text: 'If your account was created via Google or Apple, your email is managed by that provider. Change it there first, then re-link in FinTrack.' },
    ],
  },
  {
    slug: 'delete-account',
    categorySlug: 'account-security',
    title: 'How to delete your account',
    excerpt: 'Permanently delete your FinTrack account and all associated data.',
    body: [
      { type: 'lead', text: 'Account deletion is permanent. All your data — transactions, budgets, goals, and settings — will be deleted and cannot be recovered.' },
      { type: 'steps', items: [
        { title: 'Go to Settings → Account', body: 'Click your avatar, then Settings → Account.' },
        { title: 'Scroll to "Danger zone"', body: 'The Delete Account option is at the bottom of the page.' },
        { title: 'Confirm deletion', body: 'Type your email address to confirm, then click "Delete my account".' },
      ]},
      { type: 'note', variant: 'warning', text: 'If you have an active Pro subscription, cancel it first to avoid being billed again. Deleting your account does not automatically cancel your subscription.' },
    ],
  },
  {
    slug: 'data-privacy',
    categorySlug: 'account-security',
    title: 'How FinTrack handles your data',
    excerpt: 'What data we collect, how we use it, and how you can export or delete it.',
    body: [
      { type: 'lead', text: 'FinTrack takes privacy seriously. Here\'s exactly what we collect and how it\'s used.' },
      { type: 'list', items: [
        'We collect the transaction data you manually enter or upload.',
        'We collect account metadata (email, name, profile photo) from sign-up.',
        'We never sell your data to third parties.',
        'All data is encrypted at rest and in transit.',
        'You can export all your data as a CSV at any time (Pro) or by contacting support.',
      ]},
      { type: 'note', variant: 'info', text: 'For the full details, read our Privacy Policy at fintrack.app/privacy.' },
    ],
  },

  // ── Budgets & Goals ──
  {
    slug: 'set-financial-goal',
    categorySlug: 'budgets-goals',
    title: 'How to set a financial goal',
    excerpt: 'Create a savings goal, set a target amount, and track progress automatically.',
    body: [
      { type: 'lead', text: 'Goals in FinTrack let you save toward a specific target — an emergency fund, a holiday, a new laptop, or anything else.' },
      { type: 'steps', items: [
        { title: 'Go to Planning → Goals', body: 'Open Goals from the sidebar.' },
        { title: 'Click "New Goal"', body: 'Give your goal a name and an optional emoji.' },
        { title: 'Set the target amount', body: 'Enter how much you want to save in total.' },
        { title: 'Set the target date (optional)', body: 'FinTrack will calculate how much you need to save per month to hit the deadline.' },
        { title: 'Track contributions', body: 'Add contributions manually or have FinTrack auto-track tagged transactions.' },
      ]},
    ],
  },
  {
    slug: 'split-expenses',
    categorySlug: 'budgets-goals',
    title: 'Splitting expenses with others',
    excerpt: 'Share bills and track who owes what with expense splits.',
    popular: true,
    body: [
      { type: 'lead', text: 'Expense splits let you share costs with friends, family, or housemates and track who has paid.' },
      { type: 'steps', items: [
        { title: 'Go to Planning → Splits', body: 'Open the Splits section from the sidebar.' },
        { title: 'Create a new split', body: 'Click "+ New Split" and give it a name (e.g., "Barcelona trip").' },
        { title: 'Add participants', body: 'Enter the names or emails of the people in the split. They don\'t need a FinTrack account.' },
        { title: 'Add expenses', body: 'For each shared expense, enter the amount and who paid. FinTrack calculates who owes what.' },
        { title: 'Mark as settled', body: 'When someone pays their share, mark it as settled to keep balances accurate.' },
      ]},
      { type: 'note', variant: 'info', text: 'Free accounts support up to 3 active splits with 3 people each. Pro has no limits.' },
    ],
  },
  {
    slug: 'recurring-items',
    categorySlug: 'budgets-goals',
    title: 'Setting up recurring transactions',
    excerpt: 'Automate regular bills so they appear in your budget without manual entry.',
    body: [
      { type: 'lead', text: 'Recurring items represent bills or income that happen on a schedule — rent, salary, Netflix, gym memberships.' },
      { type: 'steps', items: [
        { title: 'Go to Finances → Bills', body: 'Open the Bills section from the sidebar.' },
        { title: 'Click "Add recurring item"', body: 'Enter the name, amount, and frequency (weekly, monthly, yearly).' },
        { title: 'Set the start date', body: 'Choose the date of the first occurrence. FinTrack will project future entries.' },
      ]},
      { type: 'note', variant: 'tip', text: 'Recurring items don\'t automatically create transactions — they serve as reminders and projections. Mark them as paid when the actual charge clears.' },
    ],
  },

  // ── AI Features ──
  {
    slug: 'ai-insights',
    categorySlug: 'ai-features',
    title: 'How AI Insights works',
    excerpt: 'Get a plain-English summary of your financial health generated by AI.',
    popular: true,
    body: [
      { type: 'lead', text: 'AI Insights analyzes your recent transactions, budgets, and goals and generates a plain-English summary of your financial health — including what\'s going well and what to watch.' },
      { type: 'h2', text: 'What it covers' },
      { type: 'list', items: [
        'Spending trends vs last month',
        'Which categories are over or under budget',
        'Progress toward your goals',
        'Unusual transactions or spending spikes',
        'Personalized suggestions to save more',
      ]},
      { type: 'note', variant: 'info', text: 'Free accounts get 20 AI Insight queries per month. Pro gets unlimited. Queries reset on the 1st of each month.' },
    ],
  },
  {
    slug: 'ai-chat',
    categorySlug: 'ai-features',
    title: 'Using AI Chat to ask about your finances',
    excerpt: 'Ask natural-language questions about your money and get instant, accurate answers.',
    body: [
      { type: 'lead', text: 'AI Chat lets you ask questions about your financial data in plain language — like chatting with a personal finance advisor who knows your numbers.' },
      { type: 'list', items: [
        '"How much did I spend on food last month?"',
        '"Am I on track to hit my emergency fund goal?"',
        '"What were my three biggest expenses this year?"',
        '"How much have I spent on subscriptions this quarter?"',
      ]},
      { type: 'note', variant: 'tip', text: 'AI Chat has access to your transactions, budgets, goals, and splits — but never your payment credentials or external accounts.' },
    ],
  },
  {
    slug: 'receipt-scanning',
    categorySlug: 'ai-features',
    title: 'Scanning receipts with AI',
    excerpt: 'Photograph a receipt and let AI extract the details — no manual entry needed.',
    body: [
      { type: 'lead', text: 'Receipt scanning uses AI to extract the merchant name, amount, date, and line items from a photo of your receipt.' },
      { type: 'steps', items: [
        { title: 'Open the transaction form', body: 'Go to Finances → Transactions and click "Add Transaction".' },
        { title: 'Tap the camera icon', body: 'This opens the receipt scanner.' },
        { title: 'Take or upload a photo', body: 'Make sure the receipt is well-lit and the text is legible.' },
        { title: 'Review the extracted details', body: 'AI fills in the merchant, amount, and date. Correct anything that looks off.' },
        { title: 'Save', body: 'The transaction is added to your account with full details.' },
      ]},
      { type: 'note', variant: 'info', text: 'Free accounts get 10 receipt uploads per month. Pro gets unlimited.' },
    ],
  },

  // ── Troubleshooting ──
  {
    slug: 'transactions-not-syncing',
    categorySlug: 'troubleshooting',
    title: 'Transactions aren\'t appearing',
    excerpt: 'Steps to fix missing or delayed transactions in your account.',
    popular: true,
    body: [
      { type: 'lead', text: 'If transactions you\'ve added aren\'t showing up, try these steps in order.' },
      { type: 'steps', items: [
        { title: 'Hard-refresh the page', body: 'Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac) to force a fresh load.' },
        { title: 'Check your date filter', body: 'Make sure the date range in the Transactions view includes the expected period.' },
        { title: 'Check the category filter', body: 'An active category filter may be hiding transactions. Reset filters to "All".' },
        { title: 'Wait a moment', body: 'Newly added transactions may take up to 30 seconds to index.' },
        { title: 'Contact support', body: 'If none of the above works, reach out with your account email and the transaction details.' },
      ]},
    ],
  },
  {
    slug: 'login-issues',
    categorySlug: 'troubleshooting',
    title: 'Can\'t log in to my account',
    excerpt: 'Fix common login problems including wrong password, locked accounts, and OAuth errors.',
    body: [
      { type: 'lead', text: 'Having trouble logging in? Here are the most common causes and how to fix each one.' },
      { type: 'list', items: [
        'Wrong password — use the "Forgot password?" link on the login page to reset it.',
        'Wrong email — check if you signed up with a different address or via Google/Apple.',
        'OAuth error — try clearing your browser cache or using an incognito window.',
        'Account not verified — check your inbox for a verification email and confirm your address.',
        'Account suspended — contact support if you believe this is an error.',
      ]},
      { type: 'note', variant: 'tip', text: 'If you signed up with Google, you must click "Login with Google" — the email/password form won\'t work for that account.' },
    ],
  },
  {
    slug: 'budget-calculations-wrong',
    categorySlug: 'troubleshooting',
    title: 'My budget totals look wrong',
    excerpt: 'Understand why budget numbers might not match your expectations.',
    body: [
      { type: 'lead', text: 'Budget calculations in FinTrack are based on categorized transactions in the current calendar month. Here\'s why the numbers might look off.' },
      { type: 'list', items: [
        'Transactions assigned to a different category won\'t count against the budget you\'re checking.',
        'Transactions from a different month don\'t affect the current month\'s budget.',
        'Refunds and credits are subtracted from the category spend.',
        'Recurring items only count when manually marked as paid — projected future items are not included.',
      ]},
      { type: 'note', variant: 'tip', text: 'Click on any budget bar to see the full list of transactions contributing to it. This makes it easy to spot mismatched categories.' },
    ],
  },
  {
    slug: 'export-data',
    categorySlug: 'troubleshooting',
    title: 'How to export your data',
    excerpt: 'Download your transactions, budgets, and reports in CSV or PDF format.',
    body: [
      { type: 'lead', text: 'You can export your financial data at any time. CSV export and PDF reports are Pro features.' },
      { type: 'h2', text: 'CSV export' },
      { type: 'steps', items: [
        { title: 'Go to Finances → Transactions', body: 'Open the Transactions view.' },
        { title: 'Click the export icon', body: 'Look for the download icon in the top-right of the transactions table.' },
        { title: 'Choose your date range', body: 'Select the period you want to export.' },
        { title: 'Download', body: 'A CSV file will download immediately.' },
      ]},
      { type: 'h2', text: 'PDF report' },
      { type: 'paragraph', text: 'Go to Analytics → Reports, choose a month, and click "Generate PDF". The report includes a summary of income, spending by category, budget performance, and goal progress.' },
      { type: 'note', variant: 'info', text: 'PDF reports and CSV export are Pro-only features. Free users can request a one-time data export by contacting support.' },
    ],
  },
];

export const POPULAR_ARTICLES = SUPPORT_ARTICLES.filter((a) => a.popular);
export { Users, BookOpen };
