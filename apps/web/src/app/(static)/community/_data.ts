/**
 * Community Hub page — local data.
 *
 * All static content (categories, discussions, tags, AMA) lives here.
 * When this page is backed by a real API, swap the constants for server
 * fetching functions and keep the components unchanged.
 */
import { PiggyBank, TrendingUp, Trophy, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TopicCategory {
  icon: LucideIcon;
  title: string;
  description: string;
  /** URL path segment — e.g. "budgeting-tips" */
  slug: string;
  gradientClass: string;
  iconClass: string;
}

export interface Comment {
  initials: string;
  authorName: string;
  timeAgo: string;
  body: string;
}

export interface Discussion {
  /** URL path segment — unique per post */
  slug: string;
  /** Matches TopicCategory.slug — determines which topic page this post lives under */
  topicSlug: string;
  initials: string;
  authorName: string;
  timeAgo: string;
  isOnline: boolean;
  tag: string;
  tagClass: string;
  title: string;
  /** Short preview shown in list views */
  excerpt: string;
  /** Full body shown on the discussion detail page */
  body: string;
  comments: number;
  likes: number;
}

export interface AMAEvent {
  initials: string;
  title: string;
  statusLabel: string;
  host: string;
  description: string;
}

// ─── Topic categories ─────────────────────────────────────────────────────────

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    icon: PiggyBank,
    title: 'Budgeting Tips',
    description: 'Share what works for managing your naira month to month.',
    slug: 'budgeting-tips',
    gradientClass: 'from-primary/25 via-primary/10 to-transparent',
    iconClass: 'text-primary',
  },
  {
    icon: TrendingUp,
    title: 'Investment Strategies',
    description: 'From NSE stocks to mutual funds and dollar assets.',
    slug: 'investment-strategies',
    gradientClass: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
    iconClass: 'text-emerald-400',
  },
  {
    icon: Trophy,
    title: 'Success Stories',
    description: 'Milestones worth sharing, big and small.',
    slug: 'success-stories',
    gradientClass: 'from-amber-500/25 via-amber-500/10 to-transparent',
    iconClass: 'text-amber-400',
  },
  {
    icon: Lightbulb,
    title: 'Feature Requests',
    description: 'Tell us what would make FinTrack more useful for you.',
    slug: 'feature-requests',
    gradientClass: 'from-violet-500/25 via-violet-500/10 to-transparent',
    iconClass: 'text-violet-400',
  },
];

// ─── Discussions ──────────────────────────────────────────────────────────────

export const DISCUSSIONS: Discussion[] = [
  {
    slug: 'budgeting-irregular-income-lagos',
    topicSlug: 'budgeting-tips',
    initials: 'TA',
    authorName: 'Tunde A.',
    timeAgo: '2h ago',
    isOnline: true,
    tag: 'Budgeting',
    tagClass: 'bg-primary/10 text-primary',
    title: 'How do you budget when your income changes every month?',
    excerpt:
      'Self-employed, income ranges from ₦120k to ₦400k depending on the month. Standard templates assume a fixed salary and just do not work for me.',
    body: 'Running a small design studio in Lagos. Some months I invoice ₦400k, other months closer to ₦120k. I can never predict what is coming in. Standard budget templates assume a fixed salary and just do not work. What I have tried: budgeting from a base income equal to my worst month in the past six and treating anything above that as savings. Works okay but feels restrictive when good months hit. Anyone with irregular income found a better system? Would love to hear how you use FinTrack for this.',
    comments: 14,
    likes: 87,
  },
  {
    slug: 'stanbic-arm-cowrywise-mutual-funds',
    topicSlug: 'investment-strategies',
    initials: 'NE',
    authorName: 'Ngozi E.',
    timeAgo: '5h ago',
    isOnline: false,
    tag: 'Investment',
    tagClass: 'bg-emerald-500/10 text-emerald-400',
    title: 'Stanbic IBTC vs ARM vs Cowrywise — which has worked better for you?',
    excerpt:
      'About ₦500k sitting in a savings account earning very little. Ready to move into a mutual fund but confused between traditional providers and the newer fintechs.',
    body: 'I have about ₦500k sitting in a savings account earning almost nothing. Ready to put it to work in a money market or balanced fund. Been comparing Stanbic IBTC Money Market, ARM Discovery, and Cowrywise. The older providers have longer track records but Cowrywise is so much easier to use on a phone. Has anyone run money in more than one of these and can share actual returns over the last 12 months? Not asking for financial advice, just real experiences.',
    comments: 21,
    likes: 142,
  },
  {
    slug: 'built-emergency-fund-6-months',
    topicSlug: 'success-stories',
    initials: 'FO',
    authorName: 'Femi O.',
    timeAgo: '1d ago',
    isOnline: false,
    tag: 'Success Story',
    tagClass: 'bg-amber-500/10 text-amber-400',
    title: 'Finally built a 3-month emergency fund. Took 6 months of strict tracking.',
    excerpt:
      'Two years ago I had almost zero savings and no idea where my salary was going. Sharing exactly what changed.',
    body: 'January 2026 I had ₦8,000 in my account and genuinely no idea where last month\'s ₦250k salary went. Started tracking every transaction in FinTrack. What surprised me most was food delivery and "small small" subscriptions adding up to almost ₦40k a month. Cut the obvious leaks, kept one meal out per week for sanity, set a standing order for savings the day salary hits. Six months later, ₦450k locked in Piggyvest Safelock. Small win but it completely changed how I think about money.',
    comments: 38,
    likes: 267,
  },
  {
    slug: '50-30-20-rule-nigerian-salary',
    topicSlug: 'budgeting-tips',
    initials: 'AI',
    authorName: 'Amaka I.',
    timeAgo: '2d ago',
    isOnline: false,
    tag: 'Budgeting',
    tagClass: 'bg-primary/10 text-primary',
    title: 'Is the 50/30/20 rule realistic on a ₦200k monthly salary in Lagos?',
    excerpt:
      'Rent alone takes over 40% of my take-home. The math does not add up and I want to know if anyone has made this work here.',
    body: 'The 50/30/20 rule says 50% needs, 30% wants, 20% savings. My rent in Surulere is ₦85k a month. That is already 42.5% of ₦200k before food, transport, or data. I genuinely cannot make the numbers work as written. What I am trying instead: treating savings as a fixed deduction first, then managing whatever is left around needs and wants. Has anyone made 50/30/20 work at this income level in Lagos or Abuja? Or do you use a completely different framework?',
    comments: 33,
    likes: 198,
  },
  {
    slug: 'dollar-investing-bamboo-trove-nigeria',
    topicSlug: 'investment-strategies',
    initials: 'CN',
    authorName: 'Chidi N.',
    timeAgo: '3d ago',
    isOnline: true,
    tag: 'Investment',
    tagClass: 'bg-emerald-500/10 text-emerald-400',
    title: 'Dollar investing via Bamboo or Trove — is it worth it given the naira situation?',
    excerpt:
      'Thinking about moving part of my savings into dollar assets as a hedge. Anyone with 12 months of experience on either platform willing to share?',
    body: 'The naira has lost a lot of value over the past few years. I have been looking at Bamboo and Trove as ways to hold dollar assets and get exposure to global markets. The appeal is obvious but I have questions: how does the FX rate work when converting in and out, what is the regulatory picture for each platform, and how do you think about the split between naira savings for local expenses and dollar holdings for long-term growth? Anyone doing this who can speak to real experience rather than theory?',
    comments: 29,
    likes: 176,
  },
  {
    slug: 'bill-reminders-local-recurring-expenses',
    topicSlug: 'feature-requests',
    initials: 'TB',
    authorName: 'Taiwo B.',
    timeAgo: '4d ago',
    isOnline: false,
    tag: 'Feature Request',
    tagClass: 'bg-violet-500/10 text-violet-400',
    title: 'Feature request: reminders for DSTV, PHCN prepaid, and other recurring local bills',
    excerpt:
      'These expenses happen on a predictable cycle but always seem to sneak up on me. A nudge before they are due would make a real difference.',
    body: 'Most budgeting apps I have used are built for western subscription models. DSTV, PHCN prepaid tokens, estate levies, generator fuel, children\'s school fees — these are the recurring expenses that actually define Nigerian household budgets. FinTrack tracks them well after the fact but I would love proactive reminders before they are due. Even a simple "you usually spend on this around now" alert would help. Anyone else think this would be useful, or have a workaround that works for you right now?',
    comments: 12,
    likes: 61,
  },
  {
    slug: 'first-savings-goal-hit',
    topicSlug: 'success-stories',
    initials: 'KA',
    authorName: 'Kemi A.',
    timeAgo: '5d ago',
    isOnline: false,
    tag: 'Success Story',
    tagClass: 'bg-amber-500/10 text-amber-400',
    title: 'Hit my first savings goal using FinTrack. Sharing what actually worked.',
    excerpt:
      'Set a ₦300k savings goal in January. Hit it by April. The thing that helped most was not what I expected.',
    body: 'Set a ₦300k savings target at the start of this year. Previous years I would set goals and abandon them by February. This time I tracked every transaction from day one. The most useful thing was not the budgeting features. It was seeing the trend graph move up week by week. Made it feel real. I transferred ₦25k every Friday right after looking at the week\'s spending summary. Small, consistent, visible. Hit the goal in 15 weeks. For anyone just starting out: the tracking matters more than the plan.',
    comments: 27,
    likes: 193,
  },
];

// ─── Trending tags ────────────────────────────────────────────────────────────

export const TRENDING_TAGS = [
  '#PensionFund',
  '#NSE',
  '#SideIncome',
  '#NairaInvesting',
  '#MutualFunds',
  '#SaveFirst',
] as const;

// ─── AMA event ────────────────────────────────────────────────────────────────

export const AMA_EVENT: AMAEvent = {
  initials: 'DO',
  title: 'Founder Office Hours',
  statusLabel: 'Coming Soon',
  host: 'Damilare Oyewole',
  description: 'Ask the founder anything about FinTrack, the roadmap, or building a personal finance tool for Nigeria.',
};

// ─── Mock comments (used on discussion detail pages) ─────────────────────────

export const MOCK_COMMENTS: Comment[] = [
  {
    initials: 'AB',
    authorName: 'Adaeze B.',
    timeAgo: '1h ago',
    body: 'This is exactly the kind of conversation I needed to see. I have been dealing with the same thing and felt like I was the only one. Tracking consistently in FinTrack for the past two months has been the biggest shift for me — just seeing the numbers removes all the guesswork.',
  },
  {
    initials: 'SO',
    authorName: 'Seun O.',
    timeAgo: '45m ago',
    body: 'Good point. I think a lot of advice out there is written for a different financial context. What works in the UK or US does not always translate to Nigeria, especially with how things like FX rates, fuel costs, and informal income work here. Would love to see more Nigeria-specific discussions on this.',
  },
  {
    initials: 'KE',
    authorName: 'Kayode E.',
    timeAgo: '20m ago',
    body: 'Agreed with everything here. The discipline is harder than the math. Once I stopped trying to have a perfect budget and just focused on tracking honestly, things actually started to improve. Small wins compound.',
  },
];
