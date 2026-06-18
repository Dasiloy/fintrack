import {
  TrendingUp,
  Brain,
  PieChart,
  CircleDollarSign,
  Clock,
  BarChart3,
  BookOpen,
  Landmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── Category ── */

export interface BlogCategory {
  label: string;
  slug: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  { label: 'All', slug: '' },
  { label: 'Personal Finance', slug: 'personal-finance' },
  { label: 'Budgeting', slug: 'budgeting' },
  { label: 'Investing', slug: 'investing' },
];

/* ── Body content blocks ── */

export type ContentBlock =
  | { type: 'lead'; text: string }
  | { type: 'divider' }
  | { type: 'h2'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'list'; items: Array<{ title: string; body: string }> };

/* ── Post ── */

export interface BlogPost {
  slug: string;
  category: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  author: string;
  role: string;
  initials: string;
  date: string;
  dateISO: string;
  readTime: number;
  featured?: boolean;
  gradientFrom: string;
  gradientTo: string;
  icon: LucideIcon;
  body: ContentBlock[];
}

/* ── Posts ── */

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'mastering-monthly-budget-with-ai',
    category: 'Personal Finance',
    categorySlug: 'personal-finance',
    title: 'Mastering Your Monthly Budget with AI',
    excerpt:
      'Discover how AI-powered tools flip the traditional budgeting model — predicting overspending before it happens and automating savings so you can focus on wealth creation.',
    author: 'Damilare Oyewole',
    role: 'Founder, FinTrack',
    initials: 'DO',
    date: 'Jan 15, 2026',
    dateISO: '2026-01-15',
    readTime: 5,
    featured: true,
    gradientFrom: 'from-primary/30',
    gradientTo: 'to-violet-600/10',
    icon: TrendingUp,
    body: [
      {
        type: 'lead',
        text: 'Managing finances can feel like a daunting task, but AI tools are making it significantly easier. They automate savings and track spending patterns with a level of consistency that manual tracking rarely achieves.',
      },
      { type: 'divider' },
      { type: 'h2', text: 'Why AI Matters for Your Wallet' },
      {
        type: 'paragraph',
        text: 'Traditional budgeting relies heavily on manual entry and retrospective analysis. By the time you realize you have overspent on dining out, the month is already over. AI flips this model by providing predictive analytics — it learns your habits and alerts you before you break your budget.',
      },
      {
        type: 'paragraph',
        text: 'Imagine a system that knows your recurring bills, predicts your variable expenses, and suggests a safe-to-spend amount for the day. That is the standard for modern finance apps like FinTrack.',
      },
      {
        type: 'blockquote',
        text: '"The goal of AI in finance is not to replace your decision-making, but to remove the cognitive load of tracking every kobo so you can focus on wealth creation."',
      },
      { type: 'h2', text: 'Top Benefits of AI Budgeting' },
      {
        type: 'list',
        items: [
          {
            title: 'Automated Categorization',
            body: 'No more manually tagging every transaction. AI recognizes merchants instantly and groups spending intelligently.',
          },
          {
            title: 'Subscription Monitoring',
            body: 'Identify zombie subscriptions you forgot about and surface them clearly so you can cancel with confidence.',
          },
          {
            title: 'Smart Savings Goals',
            body: 'Algorithms analyze your cash flow and automatically suggest safe amounts to move into savings each week.',
          },
          {
            title: 'Predictive Alerts',
            body: 'Get notified mid-month when you are trending over budget, not after the damage is done.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: 'By embracing these tools early, you are not just organizing your money — you are optimizing your entire financial life for growth. Start with the AI Insights tab in FinTrack and see the difference within a week.',
      },
    ],
  },
  {
    slug: 'ai-insights-portfolio',
    category: 'Investing',
    categorySlug: 'investing',
    title: 'Understanding AI Insights in Your Portfolio',
    excerpt:
      'Artificial intelligence is not just a buzzword. Learn how AI-driven analytics can surface patterns and help safeguard your long-term investments.',
    author: 'Damilare Oyewole',
    role: 'Founder, FinTrack',
    initials: 'DO',
    date: 'Feb 3, 2026',
    dateISO: '2026-02-03',
    readTime: 5,
    gradientFrom: 'from-blue-500/25',
    gradientTo: 'to-cyan-500/10',
    icon: Brain,
    body: [
      {
        type: 'lead',
        text: 'AI has moved from institutional trading desks to your pocket. Modern portfolio tools use machine learning to surface patterns that would take a human analyst hours to find.',
      },
      { type: 'h2', text: 'Pattern Recognition at Scale' },
      {
        type: 'paragraph',
        text: 'AI models trained on large financial datasets can identify correlations between economic events and asset performance that are not obvious to the naked eye. When volatility spikes in one sector, an AI insight engine flags related exposures in your portfolio before you even open the app.',
      },
      {
        type: 'blockquote',
        text: '"Investors who use AI-assisted tools review their portfolios more frequently and make corrections faster than those relying on manual analysis."',
      },
      { type: 'h2', text: 'What AI Can and Cannot Do' },
      {
        type: 'list',
        items: [
          {
            title: 'Can: Trend detection',
            body: 'Spots momentum shifts and sector rotations before they become headlines.',
          },
          {
            title: 'Can: Risk scoring',
            body: 'Assigns a real-time risk score to each holding based on volatility, correlation, and macro signals.',
          },
          {
            title: 'Cannot: Predict the future',
            body: 'No model eliminates uncertainty. AI gives probabilities, not guarantees — always pair insights with your own judgement.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: "Use FinTrack's AI Insights to run weekly portfolio health checks. Set a recurring reminder, review the highlighted risks, and make one small rebalancing move per month.",
      },
    ],
  },
  {
    slug: 'the-50-30-20-rule-explained',
    category: 'Budgeting',
    categorySlug: 'budgeting',
    title: 'The 50/30/20 Rule Explained',
    excerpt:
      'A simple yet effective way to manage your after-tax income. Break down your needs, wants, and savings goals with a framework that still holds up today.',
    author: 'Damilare Oyewole',
    role: 'Founder, FinTrack',
    initials: 'DO',
    date: 'Feb 20, 2026',
    dateISO: '2026-02-20',
    readTime: 3,
    gradientFrom: 'from-emerald-500/25',
    gradientTo: 'to-teal-500/10',
    icon: PieChart,
    body: [
      {
        type: 'lead',
        text: 'Budgeting frameworks come and go, but the 50/30/20 rule has stood the test of time because of its radical simplicity. You only need to know one number: your monthly take-home pay.',
      },
      { type: 'h2', text: 'The Three Buckets' },
      {
        type: 'list',
        items: [
          {
            title: '50% — Needs',
            body: 'Rent, groceries, utilities, transport. Non-negotiable expenses that keep the lights on.',
          },
          {
            title: '30% — Wants',
            body: 'Dining out, streaming subscriptions, hobbies. Things you enjoy but could live without.',
          },
          {
            title: '20% — Savings and Debt',
            body: "Emergency fund, investments, extra debt repayments. Your future self's contribution.",
          },
        ],
      },
      {
        type: 'blockquote',
        text: '"You do not need to track every transaction. You just need to watch three numbers."',
      },
      { type: 'h2', text: 'Adapting It to Modern Life' },
      {
        type: 'paragraph',
        text: 'In high cost-of-living cities, your needs bucket may naturally run higher than 50%. That is fine — adjust your wants bucket first before touching savings. The goal is the savings floor of 20%, not the exact split.',
      },
      {
        type: 'paragraph',
        text: 'Track your spending against these three buckets in FinTrack and let the dashboard show you where each naira lands. A monthly review takes under 10 minutes.',
      },
    ],
  },
  {
    slug: 'defi-for-beginners',
    category: 'Investing',
    categorySlug: 'investing',
    title: 'DeFi for Beginners: What You Actually Need to Know',
    excerpt:
      'Demystifying decentralized finance. What it is, how it works, the real risks involved, and whether it belongs in a beginner financial strategy at all.',
    author: 'Damilare Oyewole',
    role: 'Founder, FinTrack',
    initials: 'DO',
    date: 'Mar 11, 2026',
    dateISO: '2026-03-11',
    readTime: 8,
    gradientFrom: 'from-amber-500/25',
    gradientTo: 'to-orange-500/10',
    icon: CircleDollarSign,
    body: [
      {
        type: 'lead',
        text: "DeFi — decentralized finance — promised to make banks obsolete. Several years in, the reality is more nuanced. Here is what actually matters for the average investor.",
      },
      { type: 'h2', text: 'What Is DeFi?' },
      {
        type: 'paragraph',
        text: 'DeFi is a collection of financial services built on public blockchains — primarily Ethereum — that operate without traditional intermediaries like banks or brokers. Lending, borrowing, and trading happen via smart contracts: self-executing code rather than human institutions.',
      },
      { type: 'h2', text: 'The Real Risks' },
      {
        type: 'list',
        items: [
          {
            title: 'Smart contract bugs',
            body: 'Code vulnerabilities have led to billions in losses since 2020. There is no insurance.',
          },
          {
            title: 'Regulatory uncertainty',
            body: 'Governments globally are still defining the legal status of DeFi. Rules can change overnight.',
          },
          {
            title: 'Volatility',
            body: 'Yield farming returns that look attractive today can be near-zero tomorrow due to token price swings.',
          },
          {
            title: 'Complexity',
            body: 'Wallet management, gas fees, and protocol risks require significant learning before committing capital.',
          },
        ],
      },
      {
        type: 'blockquote',
        text: '"DeFi is fascinating technology. Treat it as venture-style risk allocation: never more than 5% of your investable assets until you fully understand what you are doing."',
      },
      {
        type: 'paragraph',
        text: 'Before exploring DeFi, ensure you have an emergency fund, manageable debt, and a diversified traditional portfolio. Curiosity is healthy; FOMO is expensive.',
      },
    ],
  },
  {
    slug: 'early-retirement-fire-movement',
    category: 'Personal Finance',
    categorySlug: 'personal-finance',
    title: 'Early Retirement: Is the FIRE Movement Right for You?',
    excerpt:
      'Exploring Financial Independence, Retire Early. The math, the lifestyle trade-offs, and how to calculate whether your numbers actually add up.',
    author: 'Damilare Oyewole',
    role: 'Founder, FinTrack',
    initials: 'DO',
    date: 'Apr 2, 2026',
    dateISO: '2026-04-02',
    readTime: 4,
    gradientFrom: 'from-violet-500/25',
    gradientTo: 'to-purple-500/10',
    icon: Clock,
    body: [
      {
        type: 'lead',
        text: 'FIRE — Financial Independence, Retire Early — has captured the imagination of many. But is it a realistic path, or a fantasy dressed up in spreadsheets?',
      },
      { type: 'h2', text: 'The Core Math' },
      {
        type: 'paragraph',
        text: 'The FIRE framework rests on one number: your annual expenses multiplied by 25. If you spend the equivalent of $40,000 per year, you need a $1,000,000 portfolio. The 4% safe withdrawal rate — based on historical market data — means you can live off 4% of your portfolio indefinitely.',
      },
      {
        type: 'blockquote',
        text: '"FIRE is not about stopping work — it is about making work optional. That distinction changes everything."',
      },
      { type: 'h2', text: 'FIRE Variants Worth Knowing' },
      {
        type: 'list',
        items: [
          {
            title: 'Lean FIRE',
            body: 'Retire on a bare-bones budget. Requires extreme frugality but achievable on average income.',
          },
          {
            title: 'Fat FIRE',
            body: 'Retire with a comfortable lifestyle. Requires higher income or a longer accumulation phase.',
          },
          {
            title: 'Barista FIRE',
            body: 'Semi-retire with part-time work covering daily expenses while investments continue to grow.',
          },
          {
            title: 'Coast FIRE',
            body: 'Save aggressively early then stop — let compounding do the work while you earn just enough to live.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: "Use FinTrack's Goals feature to model your FIRE target. Set your annual expense figure, apply the 25x multiplier, and track your portfolio progress monthly. The journey is long — but the visibility makes it manageable.",
      },
    ],
  },
  {
    slug: 'micro-investing-apps-beginners',
    category: 'Investing',
    categorySlug: 'investing',
    title: 'Getting Started with Micro-Investing',
    excerpt:
      'Start investing with whatever you have. These approaches lower the barrier to entry and make building the habit almost effortless.',
    author: 'Damilare Oyewole',
    role: 'Founder, FinTrack',
    initials: 'DO',
    date: 'Apr 28, 2026',
    dateISO: '2026-04-28',
    readTime: 4,
    gradientFrom: 'from-sky-500/25',
    gradientTo: 'to-blue-500/10',
    icon: BarChart3,
    body: [
      {
        type: 'lead',
        text: "The biggest barrier to investing is not knowledge — it is inertia. Micro-investing removes the friction by letting you start with whatever you have.",
      },
      { type: 'h2', text: 'What to Look For' },
      {
        type: 'paragraph',
        text: 'A good micro-investing approach has no minimum balance requirement, low or zero fees, automatic recurring deposits, and a beginner-friendly interface. Secondary considerations include educational content and the breadth of available assets.',
      },
      { type: 'h2', text: 'The Key Features That Matter' },
      {
        type: 'list',
        items: [
          {
            title: 'Recurring deposits',
            body: 'Set a fixed weekly transfer so the habit runs in the background without requiring a decision each time.',
          },
          {
            title: 'Fractional ownership',
            body: 'Own a slice of a larger asset without needing a large upfront amount per unit.',
          },
          {
            title: 'Goal tagging',
            body: 'Label each investment pot — holiday, house deposit, retirement — for clarity on what you are building toward.',
          },
          {
            title: 'Low fees',
            body: 'On small amounts, high fees destroy returns. Every percentage point matters more when the base is small.',
          },
        ],
      },
      {
        type: 'blockquote',
        text: '"The best investment you can make is in the habit of investing. The amount is secondary."',
      },
      {
        type: 'paragraph',
        text: 'Connect your FinTrack account to track all your investment pots alongside your budget — one unified view of your complete financial picture.',
      },
    ],
  },
  {
    slug: 'building-emergency-fund-from-scratch',
    category: 'Budgeting',
    categorySlug: 'budgeting',
    title: 'Building an Emergency Fund From Scratch',
    excerpt:
      "A step-by-step guide to creating your financial safety net, even if you are living paycheck to paycheck. No magic required — just a system that works.",
    author: 'Damilare Oyewole',
    role: 'Founder, FinTrack',
    initials: 'DO',
    date: 'May 22, 2026',
    dateISO: '2026-05-22',
    readTime: 3,
    gradientFrom: 'from-lime-500/25',
    gradientTo: 'to-green-500/10',
    icon: Landmark,
    body: [
      {
        type: 'lead',
        text: "Three to six months of expenses. That is the number. It sounds impossible when you are stretched thin, but the path there is just a series of small, consistent steps.",
      },
      { type: 'h2', text: 'Start with a Starter Goal' },
      {
        type: 'paragraph',
        text: "A starter emergency fund of ₦100,000 handles most real-world emergencies — a car repair, a broken appliance, an urgent medical bill. It is the psychological and practical first milestone. Everything after that is scaling.",
      },
      {
        type: 'list',
        items: [
          {
            title: 'Separate account',
            body: 'Keep your emergency fund in a different bank. Out of sight, out of mind — and inaccessible for impulse spending.',
          },
          {
            title: 'Automate it',
            body: "Set up a recurring transfer the day after payday. Treat it like a bill you cannot skip.",
          },
          {
            title: 'Sell something',
            body: 'One declutter session — Jiji, Facebook Marketplace — can fund your starter emergency fund faster than you expect.',
          },
          {
            title: 'Track it visibly',
            body: "Use FinTrack's Goals feature with a progress bar. Visual progress is a powerful motivator.",
          },
        ],
      },
      {
        type: 'blockquote',
        text: '"An emergency fund does not earn you a great return. It earns you peace of mind — and that pays compound interest."',
      },
      {
        type: 'paragraph',
        text: "Once you hit ₦100,000, do not stop. Set the goal to three months of your essential expenses and keep the automation running. You will get there faster than you think.",
      },
    ],
  },
];

export const FEATURED_POST = BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0]!;

export { BookOpen };
