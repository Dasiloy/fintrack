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
  initials: string;
  linkedIn: string;
  image?: string;
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
    year: '2025',
    title: 'The Idea',
    description:
      'Frustrated with generic budgeting apps that ignored Nigerian financial context, I started sketching what a more honest tool could look like.',
    icon: Lightbulb,
  },
  {
    year: 'Early 2026',
    title: 'Building',
    description:
      'Core features shipped one by one: bank linking via Mono, AI-powered insights, budget tracking, and a dashboard built from scratch.',
    icon: Code2,
  },
  {
    year: '2026',
    title: 'Launching',
    description:
      'FinTrack opens to users. The mission stays the same: make financial clarity feel effortless for Nigerians.',
    icon: Rocket,
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Damilare Oyewole',
    role: 'Founder and Engineer',
    bio: 'Building FinTrack from the ground up — product, engineering, and design. One person, one focus: making financial clarity feel effortless.',
    initials: 'DO',
    linkedIn: 'https://www.linkedin.com/in/damilare-oyewole-5134791ab',
    image: '/untitled-84.JPG',
  },
];
