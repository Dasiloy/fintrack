import { Zap, Globe, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Metric {
  icon: LucideIcon;
  stat: string;
  label: string;
  description: string;
}

const METRICS: Metric[] = [
  {
    icon: Zap,
    stat: '99.9%',
    label: 'Uptime Reliability',
    description:
      'Access your financial data anytime, anywhere. Our infrastructure ensures your money is always within reach.',
  },
  {
    icon: Globe,
    stat: '$2B+',
    label: 'Assets Tracked',
    description:
      'Trusted by thousands to monitor investments, savings, and daily expenses across the globe securely.',
  },
  {
    icon: TrendingUp,
    stat: '$400',
    label: 'Monthly Savings',
    description:
      'On average, our users save an extra $400 per month by identifying subscriptions and optimizing budgets.',
  },
];

/**
 * "Why FinTrack?" — three key metrics with icon, stat, and description.
 * Icon background transitions to solid primary on hover.
 */
export function MetricsSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 mb-32">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-manrope font-bold mb-4 text-text-primary">Why FinTrack?</h2>
        <p className="text-body text-text-secondary">
          Join a platform built for performance, reliability, and tangible financial results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {METRICS.map(({ icon: Icon, stat, label, description }) => (
          <div
            key={label}
            className="group p-6 rounded-card text-center border border-transparent hover:bg-bg-elevated hover:border-border-subtle transition-all duration-smooth"
          >
            {/* Icon */}
            <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-smooth shadow-card group-hover:shadow-glow">
              <Icon size={28} />
            </div>

            {/* Stat */}
            <p className="text-4xl font-manrope font-bold text-text-primary mb-2 tracking-tight">
              {stat}
            </p>

            {/* Label */}
            <p className="text-body font-bold text-text-primary mb-2">{label}</p>

            {/* Description */}
            <p className="text-body-sm text-text-secondary leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
