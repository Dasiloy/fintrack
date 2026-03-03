import { auth } from '@/lib/nextauth';
import { sessionToUser } from '@/helpers/session';

import { LandingNav } from './landing_nav';
import { LandingFooter } from './landing_footer';
import { BackToTop } from './back_to_top';

/**
 * Shared server-component shell for static/marketing pages.
 * Calls auth() internally (Next.js deduplicates the call across the request),
 * then renders LandingNav → children → LandingFooter with consistent background blobs.
 */
export async function StaticPageShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = sessionToUser(session);

  return (
    <>
      {/* Ambient background blobs */}
      <div
        aria-hidden="true"
        className="bg-primary/20 animate-landing-float pointer-events-none fixed top-[-20%] left-[-10%] z-0 h-[50vw] w-[50vw] rounded-full blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="bg-primary/10 animate-landing-float-delayed pointer-events-none fixed right-[-10%] bottom-[-10%] z-0 h-[40vw] w-[40vw] rounded-full blur-[100px]"
      />

      <div className="bg-bg-deep text-text-primary selection:bg-primary/30 relative z-10 min-h-screen overflow-x-hidden">
        <LandingNav user={user} />
        <main className="pt-32 pb-20">{children}</main>
        <LandingFooter />
        <BackToTop />
      </div>
    </>
  );
}
