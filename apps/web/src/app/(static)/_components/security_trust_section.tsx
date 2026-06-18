import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

/**
 * Minimal security trust banner — single card linking to the dedicated /security page.
 * The full 6-pillar breakdown lives at /security; this section drives users there.
 */
export function SecurityTrustSection() {
  return (
    <section
      id="security"
      className="mx-auto mb-32 max-w-[1200px] scroll-mt-32 px-4 md:px-6"
    >
      <div className="glass-card rounded-[20px] border border-border-light p-6 md:p-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="font-manrope font-bold text-text-primary">
                Bank-level security, built in from day one
              </p>
              <p className="text-body-sm text-text-secondary mt-0.5">
                AES-256-GCM encryption · Read-only bank access · NDPA 2023 compliant · 2FA supported
              </p>
            </div>
          </div>

          <Link
            href={STATIC_ROUTES.SECURITY}
            className="text-body-sm text-primary inline-flex shrink-0 items-center gap-1.5 font-semibold transition-opacity hover:opacity-80"
          >
            How we protect your data
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
