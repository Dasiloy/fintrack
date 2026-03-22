import { StaticPageShell } from '@/app/(static)/_components';
import { PricingHeader, PlanCards, ComparisonTable, PricingCta } from './_components';
import { auth } from '@/lib/nextauth';

export const metadata = {
  title: 'Pricing — FinTrack',
  description:
    'Start for free with powerful budgeting tools. Upgrade to Pro for unlimited AI, all-time analytics, and PDF/CSV exports — just $5/month.',
};

export default async function PricingPage() {
  const session = await auth();
  return (
    <StaticPageShell>
      <PricingHeader />
      <PlanCards session={session} />
      <ComparisonTable />
      <PricingCta />
    </StaticPageShell>
  );
}
