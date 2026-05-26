// ── /advisor — AI Advisor page ───────────────────────────────────────────────
// Server component: checks subscription status, passes isPro to the client.
// The client renders the full 3-panel advisor UI; isPro controls whether the
// persistent pro gate overlay is shown.

import { api_caller } from '@/lib/trpc_app/api_server';
import { AdvisorPageClient } from './_components/advisor_page_client';

export const metadata = { title: 'AI Advisor — FinTrack' };

export default async function AdvisorPage() {
  let isPro = false;

  try {
    isPro = await api_caller.subscription.isPro().then((r) => r.data ?? false);
  } catch {
    // non-fatal — free-user gate applies
  }

  return <AdvisorPageClient isPro={isPro} />;
}
