import { StaticPageShell } from '@/app/(static)/_components';
import { AboutHero, DesignPhilosophy, OurStory, MeetTheTeam, AboutCta } from './_components';

export const metadata = {
  title: 'About — FinTrack',
  description:
    'Learn the story behind FinTrack, our design philosophy, and the team building the future of personal finance.',
};

export default function AboutPage() {
  return (
    <StaticPageShell>
      <AboutHero />
      <DesignPhilosophy />
      <OurStory />
      <MeetTheTeam />
      <AboutCta />
    </StaticPageShell>
  );
}
