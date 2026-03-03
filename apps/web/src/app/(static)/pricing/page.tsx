import { StaticPageShell } from '@/app/(static)/_components';
import { PricingHeader, PlanCards, ComparisonTable, PricingCta } from './_components';

export const metadata = {
  title: 'Pricing — FinTrack',
  description:
    'Start for free with powerful budgeting tools. Upgrade to Pro for unlimited AI, all-time analytics, and PDF/CSV exports — just $5/month.',
};

export default function PricingPage() {
  return (
    <StaticPageShell>
      <PricingHeader />
      <PlanCards />
      <ComparisonTable />
      <PricingCta />
    </StaticPageShell>
  );
}
