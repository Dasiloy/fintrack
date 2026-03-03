/**
 * About page — local data.
 *
 * Kept here (not in packages/types) because this content is specific to
 * the About page and has no cross-package utility. If team members or
 * philosophy values ever feed an API or are shared with other apps,
 * move them to packages/types/constants at that point.
 */
import { LayoutGrid, Eye, Gem, Lightbulb, Code2, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhilosophyCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TimelineEntry {
  year: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  /** Two-letter initials shown in the avatar placeholder */
  initials: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const PHILOSOPHY_CARDS: PhilosophyCard[] = [
  {
    icon: LayoutGrid,
    title: 'Minimalist',
    description:
      'Stripping away the noise to focus on what matters. No clutter, just your financial health at a glance.',
  },
  {
    icon: Eye,
    title: 'Focus',
    description:
      'Highlighting critical data points without distractions. We help you see the big picture instantly.',
  },
  {
    icon: Gem,
    title: 'Clarity',
    description:
      "Crystal clear insights into your spending habits. Understanding your money shouldn't be a puzzle.",
  },
];

export const TIMELINE_ENTRIES: TimelineEntry[] = [
  {
    year: '2021',
    title: 'Inception',
    description:
      'The idea was born from frustration with complex spreadsheets and cluttered banking apps.',
    icon: Lightbulb,
  },
  {
    year: '2022',
    title: 'First Prototype',
    description:
      'We built the first version focusing solely on tracking daily expenses with zero friction.',
    icon: Code2,
  },
  {
    year: '2023',
    title: 'Launch Day',
    description:
      'FinTrack went live to the public, welcoming thousands of users who wanted financial peace.',
    icon: Rocket,
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Alex Morgan',
    role: 'Co-Founder & CEO',
    bio: 'Finance geek with a passion for simplifying complex systems.',
    initials: 'AM',
  },
  {
    name: 'Sarah Chen',
    role: 'Lead Designer',
    bio: 'Minimalist artist ensuring every pixel has a purpose.',
    initials: 'SC',
  },
  {
    name: 'David Kim',
    role: 'CTO',
    bio: 'Building the secure and fast infrastructure behind FinTrack.',
    initials: 'DK',
  },
];
