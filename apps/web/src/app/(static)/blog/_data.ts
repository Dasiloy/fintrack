import {
  TrendingUp,
  Brain,
  PieChart,
  Zap,
  Heart,
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
  { label: 'Product News', slug: 'product-news' },
  { label: 'Success Stories', slug: 'success-stories' },
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
      'Discover how AI-powered tools flip the traditional budgeting model—predicting overspending before it happens and automating savings so you can focus on wealth creation.',
    author: 'Damilare Isaac',
    role: 'Financial Analyst',
    initials: 'DI',
    date: 'Oct 24, 2023',
    dateISO: '2023-10-24',
    readTime: 5,
    featured: true,
    gradientFrom: 'from-primary/30',
    gradientTo: 'to-violet-600/10',
    icon: TrendingUp,
    body: [
      {
        type: 'lead',
        text: 'Managing finances can often feel like a daunting task, but with the advent of artificial intelligence, it\'s becoming easier than ever. AI tools can automate your savings and track spending patterns with unprecedented accuracy.',
      },
      { type: 'divider' },
      { type: 'h2', text: 'Why AI Matters for Your Wallet' },
      {
        type: 'paragraph',
        text: 'Traditional budgeting relies heavily on manual entry and retrospective analysis. By the time you realize you\'ve overspent on dining out, the month is already over. AI flips this model by providing predictive analytics — it learns your habits and alerts you before you break your budget.',
      },
      {
        type: 'paragraph',
        text: 'Imagine a system that knows your recurring bills, predicts your variable expenses, and suggests a "safe to spend" amount for the day. That is no longer science fiction; it\'s the standard for modern fintech apps like FinTrack.',
      },
      {
        type: 'blockquote',
        text: '"The goal of AI in finance isn\'t to replace your decision-making, but to remove the cognitive load of tracking every penny so you can focus on wealth creation."',
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
            body: 'Algorithms analyze your cash flow and automatically suggest "safe" amounts to move into savings each week.',
          },
          {
            title: 'Predictive Alerts',
            body: 'Get notified mid-month when you\'re trending over budget — not after the damage is done.',
          },
        ],
      },
      {
        type: 'paragraph',
        text: 'The future of personal finance is autonomous. By embracing these tools early, you\'re not just organizing your money — you\'re optimizing your entire financial life for growth. Start with FinTrack\'s AI Insights tab and see the difference within a week.',
      },
    ],
  },
  {
    slug: 'ai-insights-portfolio',
    category: 'Investing',
    categorySlug: 'investing',
    title: 'Understanding AI Insights in Your Portfolio',
    excerpt:
      'Artificial Intelligence isn\'t just a buzzword. Learn how AI-driven analytics can predict market trends and help safeguard your long-term investments.',
    author: 'Amara Osei',
    role: 'Investment Strategist',
    initials: 'AO',
    date: 'Nov 3, 2023',
    dateISO: '2023-11-03',
    readTime: 5,
    gradientFrom: 'from-blue-500/25',
    gradientTo: 'to-cyan-500/10',
    icon: Brain,
    body: [
      {
        type: 'lead',
        text: 'AI has moved from Wall Street data centers to your pocket. Modern portfolio tools use machine learning to surface patterns that would take a human analyst hours to find.',
      },
      { type: 'h2', text: 'Pattern Recognition at Scale' },
      {
        type: 'paragraph',
        text: 'AI models trained on decades of market data can identify correlations between economic events and asset performance that aren\'t obvious to the naked eye. When volatility spikes in one sector, an AI insight engine flags related exposures in your portfolio before you even open the app.',
      },
      {
        type: 'blockquote',
        text: '"Investors who use AI-assisted tools review their portfolios 3× more frequently and make corrections 40% faster than those relying on manual analysis."',
      },
      { type: 'h2', text: 'What AI Can and Cannot Do' },
      {
        type: 'list',
        items: [
          { title: 'Can: Trend detection', body: 'Spots momentum shifts and sector rotations weeks before they become headlines.' },
          { title: 'Can: Risk scoring', body: 'Assigns a real-time risk score to each holding based on volatility, correlation, and macro signals.' },
          { title: 'Cannot: Predict the future', body: 'No model eliminates uncertainty. AI gives probabilities, not guarantees — always pair insights with your own judgement.' },
        ],
      },
      {
        type: 'paragraph',
        text: 'Use FinTrack\'s AI Insights to run weekly portfolio health checks. Set a recurring reminder, review the highlighted risks, and make one small rebalancing move per month.',
      },
    ],
  },
  {
    slug: 'the-50-30-20-rule-explained',
    category: 'Budgeting',
    categorySlug: 'budgeting',
    title: 'The 50/30/20 Rule Explained',
    excerpt:
      'A simple yet effective way to manage your after-tax income. Break down your needs, wants, and savings goals with this classic framework that still works in 2024.',
    author: 'Kezia Mensah',
    role: 'Personal Finance Coach',
    initials: 'KM',
    date: 'Nov 12, 2023',
    dateISO: '2023-11-12',
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
          { title: '50% — Needs', body: 'Rent, groceries, utilities, transport. Non-negotiable expenses that keep the lights on.' },
          { title: '30% — Wants', body: 'Dining out, streaming subscriptions, hobbies. Things you enjoy but could live without.' },
          { title: '20% — Savings & Debt', body: 'Emergency fund, investments, extra debt repayments. Your future self\'s contribution.' },
        ],
      },
      {
        type: 'blockquote',
        text: '"You don\'t need to track every coffee purchase. You just need to watch three numbers."',
      },
      { type: 'h2', text: 'Adapting It to Modern Life' },
      {
        type: 'paragraph',
        text: 'In high cost-of-living cities, your "needs" bucket may naturally run higher than 50%. That\'s fine — adjust your wants bucket first before touching savings. The goal is the savings floor of 20%, not the exact split.',
      },
      {
        type: 'paragraph',
        text: 'Set up three FinTrack budget categories — Needs, Wants, and Savings — and let the dashboard show you where each pound goes. Monthly review takes under 10 minutes.',
      },
    ],
  },
  {
    slug: 'fintrack-2-whats-new',
    category: 'Product News',
    categorySlug: 'product-news',
    title: 'FinTrack 2.0: What\'s New',
    excerpt:
      'We\'ve completely overhauled the dashboard experience. Faster syncing, a redesigned analytics view, new budget widgets, and a powerful AI chat — all in one release.',
    author: 'FinTrack Team',
    role: 'Product',
    initials: 'FT',
    date: 'Dec 1, 2023',
    dateISO: '2023-12-01',
    readTime: 2,
    gradientFrom: 'from-primary/25',
    gradientTo: 'to-indigo-500/10',
    icon: Zap,
    body: [
      {
        type: 'lead',
        text: 'After six months of building, we\'re thrilled to ship FinTrack 2.0 — the biggest product update in our history. Here\'s everything that changed.',
      },
      { type: 'h2', text: 'Highlights' },
      {
        type: 'list',
        items: [
          { title: 'Redesigned Dashboard', body: 'A cleaner, widget-based layout that surfaces your most important numbers at a glance.' },
          { title: 'AI Chat (Beta)', body: 'Ask questions like "How much did I spend on food last month?" and get instant answers.' },
          { title: 'Faster Sync', body: 'Transaction processing is now 3× faster with our new background sync engine.' },
          { title: 'PDF Reports', body: 'Generate and download a full monthly financial report in one click. Pro feature.' },
        ],
      },
      {
        type: 'blockquote',
        text: '"We rebuilt from the ground up with one goal: make every financial decision feel effortless."',
      },
      {
        type: 'paragraph',
        text: 'The update is live now for all users. Pro subscribers get early access to AI Chat and PDF Reports. We\'re already working on 2.1 — stay tuned in the Community.',
      },
    ],
  },
  {
    slug: 'how-sarah-paid-off-30k-debt',
    category: 'Success Stories',
    categorySlug: 'success-stories',
    title: 'How Sarah Paid Off $30k in Debt in 2 Years',
    excerpt:
      'Real stories from real users. See the exact steps Sarah took — including her FinTrack setup, budget tweaks, and the mindset shift that made all the difference.',
    author: 'Editorial Team',
    role: 'FinTrack Blog',
    initials: 'ET',
    date: 'Dec 14, 2023',
    dateISO: '2023-12-14',
    readTime: 6,
    gradientFrom: 'from-rose-500/25',
    gradientTo: 'to-pink-500/10',
    icon: Heart,
    body: [
      {
        type: 'lead',
        text: 'Sarah, a 29-year-old teacher from Manchester, had $30,000 in combined student loan and credit card debt. Two years later, it\'s gone. This is her story.',
      },
      { type: 'h2', text: 'The Starting Point' },
      {
        type: 'paragraph',
        text: 'Sarah signed up for FinTrack after a particularly stressful month where she couldn\'t explain where her salary had gone. The first thing the app revealed: she was spending $420/month on subscriptions and impulse food orders she\'d forgotten about.',
      },
      {
        type: 'blockquote',
        text: '"Seeing the number on screen was a gut punch. But it was exactly the wake-up call I needed."',
      },
      { type: 'h2', text: 'The Plan' },
      {
        type: 'list',
        items: [
          { title: 'Cancelled 8 subscriptions', body: 'Freed up $180/month immediately. Redirected straight to her highest-interest debt.' },
          { title: 'Set a strict dining budget', body: 'Cut food spend by 60% using FinTrack\'s real-time budget alerts. Still ate well.' },
          { title: 'Automated debt payments', body: 'Used recurring goals to earmark $900/month as untouchable debt repayment.' },
          { title: 'Tracked every win', body: 'Posted monthly progress in the FinTrack Community for accountability.' },
        ],
      },
      {
        type: 'paragraph',
        text: 'Sarah\'s story proves that financial freedom isn\'t about earning more — it\'s about seeing clearly and acting consistently. Her FinTrack account is still open, now focused on building a six-month emergency fund.',
      },
    ],
  },
  {
    slug: 'defi-for-beginners',
    category: 'Investing',
    categorySlug: 'investing',
    title: 'DeFi for Beginners: What You Actually Need to Know',
    excerpt:
      'Demystifying decentralized finance. What it is, how it works, the real risks involved — and whether it belongs in a beginner\'s financial strategy at all.',
    author: 'Amara Osei',
    role: 'Investment Strategist',
    initials: 'AO',
    date: 'Jan 8, 2024',
    dateISO: '2024-01-08',
    readTime: 8,
    gradientFrom: 'from-amber-500/25',
    gradientTo: 'to-orange-500/10',
    icon: CircleDollarSign,
    body: [
      {
        type: 'lead',
        text: 'DeFi — decentralized finance — promised to make banks obsolete. Three years in, the reality is more nuanced. Here\'s what actually matters for the average investor.',
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
          { title: 'Smart contract bugs', body: 'Code vulnerabilities have led to over $3 billion in losses since 2020. There is no insurance.' },
          { title: 'Regulatory uncertainty', body: 'Governments globally are still defining DeFi\'s legal status. Rules can change overnight.' },
          { title: 'Volatility', body: 'Yield farming returns that look attractive today can be near-zero tomorrow due to token price swings.' },
          { title: 'Complexity', body: 'Gas fees, wallet management, and protocol risks require significant learning before committing capital.' },
        ],
      },
      {
        type: 'blockquote',
        text: '"DeFi is fascinating technology. Treat it as venture-style risk allocation: never more than 5% of your investable assets until you fully understand what you\'re doing."',
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
    author: 'Kezia Mensah',
    role: 'Personal Finance Coach',
    initials: 'KM',
    date: 'Jan 22, 2024',
    dateISO: '2024-01-22',
    readTime: 4,
    gradientFrom: 'from-violet-500/25',
    gradientTo: 'to-purple-500/10',
    icon: Clock,
    body: [
      {
        type: 'lead',
        text: 'FIRE — Financial Independence, Retire Early — has captured the imagination of millions. But is it a realistic path, or a millennial fantasy dressed up in spreadsheets?',
      },
      { type: 'h2', text: 'The Core Math' },
      {
        type: 'paragraph',
        text: 'The FIRE framework rests on one number: your annual expenses multiplied by 25. If you spend $40,000/year, you need a $1,000,000 portfolio. The 4% safe withdrawal rate — based on historical market data — means you can live off 4% of your portfolio indefinitely.',
      },
      {
        type: 'blockquote',
        text: '"FIRE isn\'t about stopping work — it\'s about making work optional. That distinction changes everything."',
      },
      { type: 'h2', text: 'FIRE Variants Worth Knowing' },
      {
        type: 'list',
        items: [
          { title: 'Lean FIRE', body: 'Retire on a bare-bones budget ($25k–$40k/year). Requires extreme frugality but achievable on average income.' },
          { title: 'Fat FIRE', body: 'Retire with a comfortable lifestyle ($80k+/year). Requires higher income or a longer accumulation phase.' },
          { title: 'Barista FIRE', body: 'Semi-retire with part-time work covering daily expenses while investments continue to grow.' },
          { title: 'Coast FIRE', body: 'Save aggressively early then stop — let compounding do the work while you earn just enough to live.' },
        ],
      },
      {
        type: 'paragraph',
        text: 'Use FinTrack\'s Goals feature to model your FIRE target. Set your annual expense figure, apply the 25× multiplier, and track your portfolio progress monthly. The journey is long — but the visibility makes it manageable.',
      },
    ],
  },
  {
    slug: 'micro-investing-apps-beginners',
    category: 'Investing',
    categorySlug: 'investing',
    title: '5 Micro-Investing Apps for Beginners',
    excerpt:
      'Start investing with as little as $5. These top-rated micro-investing platforms lower the barrier to entry and make building the habit almost effortless.',
    author: 'Amara Osei',
    role: 'Investment Strategist',
    initials: 'AO',
    date: 'Feb 5, 2024',
    dateISO: '2024-02-05',
    readTime: 4,
    gradientFrom: 'from-sky-500/25',
    gradientTo: 'to-blue-500/10',
    icon: BarChart3,
    body: [
      {
        type: 'lead',
        text: 'The biggest barrier to investing isn\'t knowledge — it\'s inertia. Micro-investing apps remove the friction by letting you start with whatever you have, even $1.',
      },
      { type: 'h2', text: 'What to Look For' },
      {
        type: 'paragraph',
        text: 'A good micro-investing app should have no minimum balance, low or zero fees, automatic round-ups or recurring deposits, and a beginner-friendly interface. Secondary considerations include educational content and the breadth of available assets.',
      },
      { type: 'h2', text: 'The Key Features Compared' },
      {
        type: 'list',
        items: [
          { title: 'Round-up investing', body: 'Round up every purchase to the nearest dollar and invest the difference automatically.' },
          { title: 'Recurring deposits', body: 'Set $10/week auto-transfers so the habit runs in the background.' },
          { title: 'Fractional shares', body: 'Own a slice of Amazon or Apple without needing $100+ per share.' },
          { title: 'Goal tagging', body: 'Label each investment pot (holiday, house deposit, retirement) for clarity.' },
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
      'A step-by-step guide to creating your financial safety net, even if you\'re living paycheck to paycheck. No magic required — just a system that works.',
    author: 'Kezia Mensah',
    role: 'Personal Finance Coach',
    initials: 'KM',
    date: 'Feb 19, 2024',
    dateISO: '2024-02-19',
    readTime: 3,
    gradientFrom: 'from-lime-500/25',
    gradientTo: 'to-green-500/10',
    icon: Landmark,
    body: [
      {
        type: 'lead',
        text: 'Three to six months of expenses. That\'s the number. It sounds impossible when you\'re stretched thin, but the path there is just a series of small, consistent steps.',
      },
      { type: 'h2', text: 'Start with $1,000' },
      {
        type: 'paragraph',
        text: 'A starter emergency fund of $1,000 handles most real-world emergencies — a car repair, a broken appliance, a medical co-pay. It\'s the psychological and practical first milestone. Everything after that is scaling.',
      },
      {
        type: 'list',
        items: [
          { title: 'Separate account', body: 'Keep your emergency fund in a different bank. Out of sight, out of mind — and inaccessible for impulse spending.' },
          { title: 'Automate it', body: 'Set up a recurring transfer the day after payday. Treat it like a bill you can\'t skip.' },
          { title: 'Sell something', body: 'One declutter session — eBay, Facebook Marketplace — can fund your starter emergency fund in a weekend.' },
          { title: 'Track it visibly', body: 'Use FinTrack\'s Goals feature with a progress bar. Visual progress is a powerful motivator.' },
        ],
      },
      {
        type: 'blockquote',
        text: '"An emergency fund doesn\'t earn you a great return. It earns you peace of mind — and that pays compound interest."',
      },
      {
        type: 'paragraph',
        text: 'Once you hit $1,000, don\'t stop. Set the goal to three months of your essential expenses and keep the automation running. You\'ll get there faster than you think.',
      },
    ],
  },
];

export const FEATURED_POST = BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0];

export { BookOpen };
