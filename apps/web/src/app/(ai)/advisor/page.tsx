// ── /advisor — AI Advisor page ───────────────────────────────────────────────
// Server component. Prefetches into the dehydrated cache so the page renders WITH
// data in the initial HTML — no empty flash on refresh:
//   • the conversation list (user-scoped via the RSC tRPC context), and
//   • the active conversation's first message page, when known.
// The active conversation is client state, but we mirror it into a cookie so the
// server can read it here and prefetch its transcript. The client then takes over
// and refetches in the background.

import { cookies } from 'next/headers';

import { api_server, HydrateClient } from '@/lib/trpc_app/api_server';
import { AdvisorPageClient } from './_components/advisor_page_client';
import {
  ADVISOR_ACTIVE_CONVERSATION_COOKIE,
  ADVISOR_MESSAGE_PAGE_SIZE,
} from './_lib/advisor.config';

export const metadata = { title: 'AI Advisor — FinTrack' };

export default async function AdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; section?: string }>;
}) {
  const { tab, section } = await searchParams;

  const activeConversationId =
    (await cookies()).get(ADVISOR_ACTIVE_CONVERSATION_COOKIE)?.value || null;

  console.log('activeConversationId', activeConversationId);

  await Promise.all([
    api_server.advisor.getConversations.prefetch(),
    activeConversationId
      ? api_server.advisor.getConversationMessages.prefetchInfinite({
          conversationId: activeConversationId,
          limit: ADVISOR_MESSAGE_PAGE_SIZE,
        })
      : Promise.resolve(),
  ]);

  return (
    <HydrateClient>
      <AdvisorPageClient
        initialTab={tab === 'insights' ? 'insights' : undefined}
        initialSection={section}
        initialActiveConversationId={activeConversationId}
      />
    </HydrateClient>
  );
}
