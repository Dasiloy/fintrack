import { StaticPageShell } from '../_components';
import { CommunityHub, CommunityCta } from './_components';

export const metadata = {
  title: 'Community — FinTrack',
  description:
    'Connect with 50,000+ members. Share budgeting tips, investment strategies, and financial success stories in the FinTrack Community Hub.',
};

export default function CommunityPage() {
  return (
    <StaticPageShell>
      <CommunityHub />
      <CommunityCta />
    </StaticPageShell>
  );
}
