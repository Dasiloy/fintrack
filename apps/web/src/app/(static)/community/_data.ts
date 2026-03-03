/**
 * Community Hub page — local data.
 *
 * All static content (categories, discussions, tags, stats) lives here.
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

export interface CommunityStat {
  value: string;
  label: string;
  accent: boolean;
  fullWidth: boolean;
}

// ─── Topic categories ─────────────────────────────────────────────────────────

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    icon: PiggyBank,
    title: 'Budgeting Tips',
    description: 'Master your monthly expenses with advice from pros.',
    slug: 'budgeting-tips',
    gradientClass: 'from-primary/25 via-primary/10 to-transparent',
    iconClass: 'text-primary',
  },
  {
    icon: TrendingUp,
    title: 'Investment Strategies',
    description: 'Long-term growth tactics and market analysis.',
    slug: 'investment-strategies',
    gradientClass: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
    iconClass: 'text-emerald-400',
  },
  {
    icon: Trophy,
    title: 'Success Stories',
    description: 'Real people sharing their journey to financial freedom.',
    slug: 'success-stories',
    gradientClass: 'from-amber-500/25 via-amber-500/10 to-transparent',
    iconClass: 'text-amber-400',
  },
  {
    icon: Lightbulb,
    title: 'Feature Requests',
    description: 'Help shape the future of the FinTrack platform.',
    slug: 'feature-requests',
    gradientClass: 'from-violet-500/25 via-violet-500/10 to-transparent',
    iconClass: 'text-violet-400',
  },
];

// ─── Discussions ──────────────────────────────────────────────────────────────

export const DISCUSSIONS: Discussion[] = [
  {
    slug: 'how-to-start-investing-50-month',
    topicSlug: 'investment-strategies',
    initials: 'SJ',
    authorName: 'Sarah J.',
    timeAgo: '2h ago',
    isOnline: true,
    tag: 'Investment',
    tagClass: 'bg-primary/10 text-primary',
    title: 'How to start investing with only $50 a month?',
    excerpt:
      "I'm a student and want to start building my portfolio early. What are the best low-cost index funds or apps for small recurring investments?",
    body: "I'm 22, just started my first job, and want to put aside $50 every month towards investing. I've heard about index funds and ETFs but the number of options is overwhelming. Should I go with a robo-advisor like Betterment, or open a brokerage account and buy VOO/VTI directly? Any tips from people who started small? I'm in the US if that's relevant.",
    comments: 24,
    likes: 156,
  },
  {
    slug: 'finally-debt-free-3-years-budgeting',
    topicSlug: 'success-stories',
    initials: 'MT',
    authorName: 'Mike T.',
    timeAgo: '5h ago',
    isOnline: false,
    tag: 'Success Story',
    tagClass: 'bg-emerald-500/10 text-emerald-400',
    title: 'Finally debt-free after 3 years of strict budgeting!',
    excerpt:
      'Just made my last student loan payment today. Here is the exact spreadsheet template I used to track every penny.',
    body: "Three years ago I had $28,000 in student loans and no idea how to pay them off. I downloaded FinTrack, built a zero-based budget, and committed to the debt avalanche method. I sacrificed a lot of luxuries — eating out, streaming services, weekend trips — but today I made my final payment. AMA about the journey! I'll share my exact template in the replies.",
    comments: 89,
    likes: 432,
  },
  {
    slug: 'thoughts-current-market-volatility',
    topicSlug: 'investment-strategies',
    initials: 'ER',
    authorName: 'Elena R.',
    timeAgo: '1d ago',
    isOnline: false,
    tag: 'Crypto',
    tagClass: 'bg-amber-500/10 text-amber-400',
    title: 'Thoughts on the current market volatility?',
    excerpt:
      "Is anyone seeing this as a buying opportunity, or are we heading for a correction? Let's discuss technical indicators.",
    body: "The past two weeks have been rough for crypto. BTC dropped 18%, ETH followed. I've been dollar-cost averaging since 2021 and historically these dips have been great entry points. But this time the macro environment feels different — higher-for-longer rates, regulatory pressure, etc. What's your strategy? Are you buying the dip, holding, or exiting?",
    comments: 45,
    likes: 89,
  },
  {
    slug: 'best-budgeting-apps-2026',
    topicSlug: 'budgeting-tips',
    initials: 'TK',
    authorName: 'Tom K.',
    timeAgo: '2d ago',
    isOnline: false,
    tag: 'Budgeting',
    tagClass: 'bg-primary/10 text-primary',
    title: 'Best budgeting apps for 2026 — honest comparison',
    excerpt:
      'I tested 7 budgeting apps over 3 months. Here is my honest breakdown with pros, cons, and which one I ended up keeping.',
    body: "After getting overwhelmed by subscriptions I tested Mint (RIP), YNAB, Copilot, Monarch Money, and of course FinTrack. Each has its strengths. YNAB is unbeatable for zero-based budgeting if you're willing to pay. FinTrack wins on UI and simplicity. Copilot is great for Mac/iOS users. I'll post a full table comparison in the comments — let me know if you want me to include any specific features.",
    comments: 38,
    likes: 211,
  },
  {
    slug: 'saved-10k-6-months-5030-20-rule',
    topicSlug: 'success-stories',
    initials: 'LM',
    authorName: 'Lena M.',
    timeAgo: '3d ago',
    isOnline: true,
    tag: 'Success Story',
    tagClass: 'bg-emerald-500/10 text-emerald-400',
    title: 'How I saved $10k in 6 months using the 50/30/20 rule',
    excerpt:
      'No side hustle, no salary increase. Just ruthless tracking and the 50/30/20 framework applied consistently.',
    body: "I earn $58k/year as a teacher. A lot of people said saving $10k in 6 months was impossible on my salary. It wasn't. I used the 50/30/20 rule: 50% needs, 30% wants, 20% savings. The key was tracking every single transaction in FinTrack so I could see where my 'wants' were creeping up. Cancelled 4 subscriptions I forgot about. Meal prepped 5 days a week. The discipline compounds fast.",
    comments: 61,
    likes: 318,
  },
  {
    slug: 'budget-templates-library-feature-request',
    topicSlug: 'feature-requests',
    initials: 'JR',
    authorName: 'James R.',
    timeAgo: '4d ago',
    isOnline: false,
    tag: 'Feature Request',
    tagClass: 'bg-violet-500/10 text-violet-400',
    title: 'Feature request: shared budget template library',
    excerpt:
      'Would love to see a community-curated library of budget templates. Browse, fork, and customise templates shared by other users.',
    body: "Every time I talk to a friend about budgeting, they ask me to share my template. What if FinTrack had a built-in library where users could publish their budget structures (anonymised amounts, just categories and percentages)? Something like GitHub but for budgets. You'd browse templates by life stage (student, family, FIRE, freelancer), fork one, and customise. This would be a massive differentiator.",
    comments: 17,
    likes: 94,
  },
  {
    slug: 'etf-vs-individual-stocks-long-term',
    topicSlug: 'investment-strategies',
    initials: 'AW',
    authorName: 'Alex W.',
    timeAgo: '5d ago',
    isOnline: false,
    tag: 'Investment',
    tagClass: 'bg-primary/10 text-primary',
    title: 'ETF vs individual stocks for long-term investing?',
    excerpt:
      'The passive vs active debate never ends. Here is my data-driven take after 8 years of running both strategies side by side.',
    body: "I've run a split portfolio for 8 years — 70% ETFs (VTI, VXUS, BND) and 30% individual stocks. The result? My ETF sleeve outperformed my stock picks in 6 of 8 years. I spent hundreds of hours researching individual companies for minimal extra return. Unless you have an edge (industry insider knowledge, proprietary data), ETFs almost certainly win for the retail investor. Happy to share exact numbers and methodology.",
    comments: 53,
    likes: 274,
  },
];

// ─── Trending tags ────────────────────────────────────────────────────────────

export const TRENDING_TAGS = [
  '#Retirement',
  '#SideHustle',
  '#RealEstate',
  '#ETFs',
  '#FrugalLiving',
  '#TaxSeason',
] as const;

// ─── Community stats ──────────────────────────────────────────────────────────

export const COMMUNITY_STATS: CommunityStat[] = [
  { value: '52k', label: 'Members', accent: false, fullWidth: false },
  { value: '1.2k', label: 'Online', accent: true, fullWidth: false },
  { value: '145', label: 'New Posts Today', accent: false, fullWidth: true },
];

// ─── AMA event ────────────────────────────────────────────────────────────────

export const AMA_EVENT = {
  initials: 'EC',
  title: 'Weekly AMA',
  statusLabel: 'Live in 2 hours',
  host: 'Dr. Emily Chen',
  description: 'Join our expert financial advisor for a live Q&A on tax optimisation strategies.',
} as const;

// ─── Mock comments (used on discussion detail pages) ─────────────────────────

export const MOCK_COMMENTS: Comment[] = [
  {
    initials: 'DL',
    authorName: 'Dan L.',
    timeAgo: '1h ago',
    body: "Great question! I started with $50/month in a Fidelity account buying FZROX (zero expense ratio). Two years later I bumped it to $200 and haven't looked back. Start simple, stay consistent.",
  },
  {
    initials: 'NP',
    authorName: 'Nina P.',
    timeAgo: '45m ago',
    body: 'Robo-advisors are great for beginners — lower cognitive load. Once you understand the basics after 12–18 months, consider migrating to a self-directed brokerage. Betterment → Fidelity was my journey.',
  },
  {
    initials: 'CW',
    authorName: 'Chris W.',
    timeAgo: '30m ago',
    body: 'The best investment is the one you actually make consistently. Whether it\'s $50 into VOO or a robo-advisor, just start. Time in market beats timing the market every single time.',
  },
];
