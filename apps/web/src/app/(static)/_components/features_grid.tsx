import { BarChart3, PieChart, GitFork, Target, PiggyBank, FileText, Sparkles, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: 'Smart Track',
    description: 'Automatically categorize transactions from all your accounts in real-time.',
  },
  {
    icon: PieChart,
    title: 'Flexible Budget',
    description: 'Create budgets that adapt to your spending habits and monthly needs.',
  },
  {
    icon: GitFork,
    title: 'Bill Splitting',
    description: 'Easily split bills and expenses with friends directly within the app.',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description: 'Set financial milestones and track your progress visually over time.',
  },
  {
    icon: PiggyBank,
    title: 'Auto Savings',
    description: 'Round up purchases and save the spare change automatically.',
  },
  {
    icon: FileText,
    title: 'Custom Reports',
    description: 'Generate detailed PDF reports for tax season or personal analysis.',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description: 'Receive personalized financial advice based on your spending patterns.',
  },
  {
    icon: Lock,
    title: 'Bank Security',
    description: 'Your data is protected with 256-bit encryption and biometric security.',
  },
];

/**
 * 4×2 grid of feature cards — "Comprehensive Features".
 * Icon scales up on hover; card background lifts to surface-hover.
 */
export function FeaturesGrid() {
  return (
    <section
      id="all-features"
      className="relative max-w-[1200px] mx-auto px-4 md:px-6 mb-32 scroll-mt-32"
    >
      {/* Ambient centre glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10"
      />

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-manrope font-bold mb-4 text-text-primary">Comprehensive Features</h2>
        <p className="text-body text-text-secondary">
          Everything you need to master your financial life, broken down into powerful tools.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="group p-6 rounded-card bg-bg-elevated border border-border-subtle hover:bg-bg-surface-hover hover:border-border-light transition-all duration-smooth"
          >
            {/* Icon box */}
            <div className="size-10 rounded-button bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-smooth">
              <Icon size={20} aria-hidden="true" />
            </div>

            <h3 className="text-h4 font-manrope font-bold text-text-primary mb-2">{title}</h3>
            <p className="text-body-sm text-text-secondary leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
