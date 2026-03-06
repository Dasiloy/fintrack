import { Mail, LifeBuoy, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const CONTACT_EMAIL = 'support@fintrack.live';

export interface ContactChannel {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  label: string;
}

export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    icon: Mail,
    title: 'Email Us',
    description: "Send us a message and we'll get back to you within one business day.",
    href: `mailto:${CONTACT_EMAIL}`,
    label: CONTACT_EMAIL,
  },
  {
    icon: LifeBuoy,
    title: 'Help Center',
    description: 'Browse our library of guides, tutorials, and FAQs.',
    href: '/support',
    label: 'Browse help articles',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Ask questions and share tips with other FinTrack users.',
    href: '/community',
    label: 'Join the community',
  },
];
