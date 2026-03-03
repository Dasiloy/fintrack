import { Users, Rocket, Heart } from 'lucide-react';

const STATS = [
  { icon: Users, label: '3-person team' },
  { icon: Rocket, label: 'Founded 2021' },
  { icon: Heart, label: 'Built with care' },
] as const;

/**
 * About page hero — badge, headline, subtitle, and three quick-stat chips.
 */
export function AboutHero() {
  return (
    <section className="mx-auto mb-24 max-w-[800px] px-4 text-center md:px-6">
      {/* Badge */}
      <div className="bg-bg-elevated border-border-subtle text-overline text-primary mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
        Our Story
      </div>

      {/* Headline */}
      <h1 className="font-manrope text-text-primary mb-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
        We're building the future of{' '}
        <span className="to-primary bg-linear-to-r from-white bg-clip-text text-transparent">
          personal finance
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-body-lg text-text-secondary mx-auto mb-10 max-w-2xl leading-relaxed font-light">
        FinTrack was born from a simple belief — understanding your money should feel effortless,
        not overwhelming. We're a small team obsessed with clarity.
      </p>

      {/* Quick-stat chips */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {STATS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="bg-bg-elevated border-border-subtle text-body-sm text-text-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2"
          >
            <Icon size={14} className="text-primary" aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
