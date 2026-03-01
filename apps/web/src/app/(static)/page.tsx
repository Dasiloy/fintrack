import { HydrateClient } from '@/lib/trpc_app/api_server';

import {
  LandingNav,
  HeroSection,
  MetricsSection,
  SocialProofSection,
  FeatureHighlightSection,
  FeaturesGrid,
  CTASection,
  LandingFooter,
} from './_components';
import { auth } from '@/lib/nextauth';
import { sessionToUser } from '@/helpers/session';

/**
 * FinTrack public landing page.
 * Server component — only LandingNav and CTASection are client components.
 * Background blobs are fixed-position decorative elements with CSS float animations.
 */
export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      {/* Ambient background blobs — GPU-composited via transform */}
      <div
        aria-hidden="true"
        className="bg-primary/20 animate-landing-float pointer-events-none fixed top-[-20%] left-[-10%] z-0 h-[50vw] w-[50vw] rounded-full blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="bg-primary/10 animate-landing-float-delayed pointer-events-none fixed right-[-10%] bottom-[-10%] z-0 h-[40vw] w-[40vw] rounded-full blur-[100px]"
      />

      <div className="bg-bg-deep text-text-primary selection:bg-primary/30 relative z-10 min-h-screen overflow-x-hidden">
        <LandingNav user={sessionToUser(session)} />

        <main className="pt-32 pb-20">
          <HeroSection />
          <MetricsSection />
          <SocialProofSection />
          <FeatureHighlightSection />
          <FeaturesGrid />
          <CTASection />
        </main>

        <LandingFooter />
      </div>
    </HydrateClient>
  );
}
