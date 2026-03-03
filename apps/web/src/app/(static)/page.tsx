import { HydrateClient } from '@/lib/trpc_app/api_server';

import {
  LandingNav,
  HeroSection,
  MetricsSection,
  SocialProofSection,
  FeatureHighlightSection,
  FeaturesGrid,
  CTASection,
  StaticPageShell,
} from './_components';

export default async function Home() {
  return (
    <HydrateClient>
      <StaticPageShell>
        <HeroSection />
        <MetricsSection />
        <SocialProofSection />
        <FeatureHighlightSection />
        <FeaturesGrid />
        <CTASection />
      </StaticPageShell>
    </HydrateClient>
  );
}
