import { ShieldCheck, EyeOff, BadgeCheck, Fingerprint, Building2 } from 'lucide-react';

const TRUST_SIGNALS = [
  { icon: Building2, label: 'Mono-powered bank sync' },
  { icon: EyeOff, label: 'Read-only bank access' },
  { icon: ShieldCheck, label: 'AES-256-GCM encrypted' },
  { icon: BadgeCheck, label: 'NDPA 2023 compliant' },
  { icon: Fingerprint, label: '2FA supported' },
] as const;

/**
 * Trust signal bar — replaces fake logo row with honest product guarantees.
 */
export function SocialProofSection() {
  return (
    <section className="mx-auto mb-32 max-w-[1200px] border-b border-border-light px-4 pb-16 md:px-6">
      <p className="text-overline text-text-disabled mb-8 text-center">
        Built with security and compliance in mind
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="bg-bg-elevated border-border-light text-body-sm text-text-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 font-medium"
          >
            <Icon size={14} className="text-primary shrink-0" aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
