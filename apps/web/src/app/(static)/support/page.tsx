import { StaticPageShell } from '@/app/(static)/_components';
import { SupportHub } from './_components';

export const metadata = {
  title: 'Help Center — FinTrack',
  description:
    'Find answers to common questions about FinTrack — budgets, billing, account security, AI features, and more.',
};

export default function SupportPage() {
  return (
    <StaticPageShell>
      <SupportHub />
    </StaticPageShell>
  );
}
