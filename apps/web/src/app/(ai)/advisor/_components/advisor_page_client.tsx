'use client';

// ── AdvisorPageClient ─────────────────────────────────────────────────────────
// Root client component for the AI Advisor page.
// Owns all top-level page state and orchestrates the responsive 3-panel layout.
//
// Layout behaviour by breakpoint (mobile-first):
//  < md  : single-column center panel; side panels open as Sheets
//  md–lg : left sidebar inline (~240px) + center; right panel in a Sheet
//  lg+   : full 3-panel ResizablePanelGroup with drag handles
//
// History sidebar (left panel) is only shown on the Advisor (chat) tab.
// Insights tab gets the full-width center + context-only right panel.
//
// ⚠️  react-resizable-panels v4 overrides `display` via inline styles, so
//     applying `hidden` directly on <ResizablePanelGroup> has no effect.
//     The group is wrapped in a <div> that controls visibility instead.
//     autoSaveId persists the layout to localStorage so it survives HMR/refresh.

import * as React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import Cookies from 'js-cookie';
import type { PanelImperativeHandle } from '@ui/components';
import { Sheet, SheetContent } from '@ui/components';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@ui/components';

import { AdvisorHeader } from './advisor_header';
import { ConversationSidebar } from './conversation_sidebar';
import { InsightsSidebarNav } from './insights_sidebar_nav';
import { AdvisorTabs } from './advisor_tabs';
import { ContextPanel } from './context_panel';

import type { AdvisorPageState, ConversationThread } from '../_lib/advisor.types';
import { api_client } from '@/lib/trpc_app/api_client';
import { conversationsListAtom, clearConversationData } from '../_lib/advisor.store';
import { ADVISOR_ACTIVE_CONVERSATION_COOKIE } from '../_lib/advisor.config';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { ConversationSummary } from '@fintrack/types/interfaces/ai';
import { useBoolean } from '@ui/hooks';
import { useRouter } from '@bprogress/next';
import { DASHBOARD_ROUTES } from '@fintrack/types/constants/routes.constants';

const SECTION_IDS = [
  'summary',
  'anomalies',
  'goal_alerts',
  'cash_flow',
  'recommendations',
  'macro',
] as const;

function buildInitialSections(initialSection?: string): Record<string, boolean> {
  return Object.fromEntries(SECTION_IDS.map((id) => [id, id === initialSection]));
}

interface AdvisorPageClientProps {
  initialTab?: 'insights' | 'advisor';
  initialSection?: string;
  /** The last-open conversation, read from a cookie by the server component. Its
   *  messages are already prefetched into the hydrated cache, so it opens with no
   *  loading gap on refresh. */
  initialActiveConversationId?: string | null;
}

export function AdvisorPageClient({
  initialTab,
  initialSection,
  initialActiveConversationId = null,
}: AdvisorPageClientProps) {
  const router = useRouter();
  const [pageState, setPageState] = React.useState<AdvisorPageState>({
    activeTab: initialTab ?? 'advisor',
    activeConversationId: initialActiveConversationId,
    historySheetOpen: false,
    toolsSheetOpen: false,
  });

  const [isContextCollapsed, setIsContextCollapsed] = React.useState(false);
  const contextPanelRef = React.useRef<PanelImperativeHandle | null>(null);

  // Insights section expand/collapse — lifted here so InsightsSidebarNav and
  // InsightsPanel can share the same state.
  // When arriving from a notification deep-link, pre-open the targeted section.
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(() =>
    buildInitialSections(initialSection),
  );

  // Scroll the pre-opened section into view after the first paint.
  React.useEffect(() => {
    if (!initialSection) return;
    const el = document.getElementById(`insight-section-${initialSection}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = React.useCallback((id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleContextPanel = React.useCallback(() => {
    if (contextPanelRef.current?.isCollapsed()) {
      contextPanelRef.current.expand();
    } else {
      contextPanelRef.current?.collapse();
    }
  }, []);

  // Guards the New Conversation action: true once the user sends their first
  // message in a null-id session. Starts true if a real conversation is selected.
  const [chatHasMessages, setChatHasMessages] = React.useState(
    initialActiveConversationId !== null,
  );

  // True only when an existing conversation is opened from history — tells the
  // ChatPanel to fetch its transcript. A new (or just-promoted) conversation is
  // owned locally and must not be reloaded. A restored conversation is existing,
  // so it loads history.
  const [loadHistory, setLoadHistory] = React.useState(initialActiveConversationId !== null);

  const update = (patch: Partial<AdvisorPageState>) =>
    setPageState((prev) => ({ ...prev, ...patch }));

  const onTabChnage = (tab: 'insights' | 'advisor') => {
    update({ activeTab: tab });

    const params = new URLSearchParams();
    params.set('tab', tab);
    const query = params.toString();

    router.replace(`${DASHBOARD_ROUTES.ANALYTICS_CHAT}?${query}`, {
      scroll: false,
      showProgress: false,
    });
  };

  // Single writer for the active conversation: updates page state AND mirrors the
  // id into a cookie so the server component can prefetch its messages on the next
  // load. Imperative — never an effect — so it only fires on a real user action.
  const setActiveConversation = React.useCallback((id: string | null) => {
    if (id) {
      Cookies.set(ADVISOR_ACTIVE_CONVERSATION_COOKIE, id, {
        expires: 30,
        sameSite: 'lax',
        path: '/',
      });
    } else {
      Cookies.remove(ADVISOR_ACTIVE_CONVERSATION_COOKIE, { path: '/' });
    }
    update({ activeConversationId: id });
  }, []);

  // Selecting a conversation always switches to the Advisor (chat) tab.
  const selectConversation = (id: string) => {
    setChatHasMessages(true);
    setLoadHistory(true);
    setActiveConversation(id);
    update({ activeTab: 'advisor' });
  };

  // No-op when already in the empty state (null id, no messages sent yet).
  // This prevents double-clicking "New Conversation" from doing anything.
  const newConversation = () => {
    if (pageState.activeConversationId === null && !chatHasMessages) return;
    setChatHasMessages(false);
    setLoadHistory(false);
    setActiveConversation(null);
    update({ activeTab: 'advisor' });
  };

  // Called by ChatPanel when the user sends their very first message.
  // Lifts the guard so a subsequent "New Conversation" click works.
  const handleFirstMessageSent = React.useCallback(() => {
    setChatHasMessages(true);
  }, []);

  // Called by ChatPanel once a brand-new conversation gets its id. Select it so
  // the sidebar highlights it, without loading history (we own the live state).
  const handleConversationStarted = React.useCallback(
    (conversationId: string) => {
      setLoadHistory(false);
      setActiveConversation(conversationId);
    },
    [setActiveConversation],
  );

  // ── Conversation history (sidebar) ──────────────────────────────────────────
  const utils = api_client.useUtils();
  const cachedList = useAtomValue(conversationsListAtom);
  const setCachedList = useSetAtom(conversationsListAtom);
  const { data: conversationsData } = api_client.advisor.getConversations.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    // Instant sidebar on reload from the persisted list atom; network refetches.
    placeholderData: () =>
      cachedList.length
        ? ({
            success: true,
            message: '',
            statusCode: 200,
            data: cachedList,
          } as StandardResponse<ConversationSummary[]>)
        : undefined,
  });

  // Persist the latest list for the next cold load.
  React.useEffect(() => {
    if (conversationsData?.data) setCachedList(conversationsData.data);
  }, [conversationsData, setCachedList]);

  const threads: ConversationThread[] = React.useMemo(
    () =>
      (conversationsData?.data ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: new Date(c.updatedAt),
      })),
    [conversationsData],
  );

  // After a turn completes the transcript changed — refresh the list so a new
  // conversation appears and ordering stays current.
  const handleConversationUpdated = React.useCallback(() => {
    void utils.advisor.getConversations.invalidate();
  }, [utils]);

  // ── Rename / delete ─────────────────────────────────────────────────────────
  const renameMutation = api_client.advisor.renameConversation.useMutation({
    onMutate: async ({ conversationId, title }) => {
      await utils.advisor.getConversations.cancel();
      const prev = utils.advisor.getConversations.getData();
      utils.advisor.getConversations.setData(undefined, (old) =>
        old
          ? {
              ...old,
              data: (old.data ?? []).map((c) => (c.id === conversationId ? { ...c, title } : c)),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.advisor.getConversations.setData(undefined, ctx.prev);
    },
    onSettled: () => void utils.advisor.getConversations.invalidate(),
  });

  const deleteMutation = api_client.advisor.deleteConversation.useMutation({
    onMutate: async ({ conversationId }) => {
      await utils.advisor.getConversations.cancel();
      const prev = utils.advisor.getConversations.getData();
      utils.advisor.getConversations.setData(undefined, (old) =>
        old
          ? {
              ...old,
              data: (old.data ?? []).filter((c) => c.id !== conversationId),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.advisor.getConversations.setData(undefined, ctx.prev);
    },
    onSuccess: (_d, { conversationId }) => {
      // Forget the deleted thread's persisted head + live buffer.
      clearConversationData(conversationId);
      // If the open conversation was deleted, drop back to a fresh chat.
      if (pageState.activeConversationId === conversationId) {
        setChatHasMessages(false);
        setLoadHistory(false);
        setActiveConversation(null);
      }
    },
    onSettled: () => void utils.advisor.getConversations.invalidate(),
  });

  const handleRename = React.useCallback(
    (id: string, title: string) => renameMutation.mutate({ conversationId: id, title }),
    [renameMutation],
  );
  const handleDelete = React.useCallback(
    (id: string) => deleteMutation.mutate({ conversationId: id }),
    [deleteMutation],
  );
  const deletingId = deleteMutation.isPending
    ? (deleteMutation.variables?.conversationId ?? null)
    : null;

  const isAdvisorTab = pageState.activeTab === 'advisor';

  // react-resizable-panels computes its layout from a client-side measurement,
  // so server-rendering it produces a brief wrong-sized flash on load. We render
  // the resizable group only after mount; before that a static fallback with the
  // same proportions stands in (see the desktop layout below). The rest of the
  // page still server-renders normally.
  const [mounted, setMounted] = useBoolean();

  React.useEffect(() => {
    setMounted.on();
  }, []);

  // Desktop panel children — shared by the resizable group and its pre-hydration
  // fallback so the hand-off is seamless.
  const desktopLeft = isAdvisorTab ? (
    <ConversationSidebar
      threads={threads}
      isLoading={!conversationsData}
      activeId={pageState.activeConversationId}
      onSelect={selectConversation}
      onNewConversation={newConversation}
      onRename={handleRename}
      onDelete={handleDelete}
      deletingId={deletingId}
    />
  ) : (
    <InsightsSidebarNav expandedSections={expandedSections} onToggleSection={toggleSection} />
  );

  const desktopCenter = (
    <AdvisorTabs
      activeTab={pageState.activeTab}
      onTabChange={onTabChnage}
      expandedSections={expandedSections}
      onToggleSection={toggleSection}
      activeConversationId={pageState.activeConversationId}
      loadHistory={loadHistory}
      onFirstMessageSent={handleFirstMessageSent}
      onConversationUpdated={handleConversationUpdated}
      onConversationStarted={handleConversationStarted}
    />
  );

  const desktopRight = (
    <ContextPanel isCollapsed={isContextCollapsed} onToggle={toggleContextPanel} />
  );

  return (
    <div className="flex h-full flex-col">
      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <AdvisorHeader
        activeTab={pageState.activeTab}
        onTabChange={onTabChnage}
        onHistoryOpen={() => update({ historySheetOpen: true })}
        onToolsOpen={() => update({ toolsSheetOpen: true })}
      />

      {/* ── Mobile / Tablet Sheets ─────────────────────────────────────────── */}

      {/* History sheet — only relevant on advisor tab */}
      <Sheet
        open={pageState.historySheetOpen}
        onOpenChange={(open) => update({ historySheetOpen: open })}
      >
        <SheetContent side="left" className="w-[92vw] max-w-sm p-0">
          <ConversationSidebar
            threads={threads}
            isLoading={!conversationsData}
            activeId={pageState.activeConversationId}
            onSelect={(id) => {
              selectConversation(id);
              update({ historySheetOpen: false });
            }}
            onNewConversation={() => {
              newConversation();
              update({ historySheetOpen: false });
            }}
            onRename={handleRename}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={pageState.toolsSheetOpen}
        onOpenChange={(open) => update({ toolsSheetOpen: open })}
      >
        <SheetContent side="right" className="w-80 p-0">
          <ContextPanel />
        </SheetContent>
      </Sheet>

      {/* ── Main content area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {/* ── Mobile / Tablet layout (< lg) ────────────────────────────────── */}
        <div className="flex h-full lg:hidden">
          {/* Inline left sidebar — md only; content swaps based on active tab */}
          <div className="border-border-subtle hidden shrink-0 flex-col border-r md:flex md:w-60">
            {isAdvisorTab ? (
              <ConversationSidebar
                threads={threads}
                isLoading={!conversationsData}
                activeId={pageState.activeConversationId}
                onSelect={selectConversation}
                onNewConversation={newConversation}
                onRename={handleRename}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ) : (
              <InsightsSidebarNav
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />
            )}
          </div>

          {/* Center content */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AdvisorTabs
              activeTab={pageState.activeTab}
              onTabChange={onTabChnage}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              activeConversationId={pageState.activeConversationId}
              loadHistory={loadHistory}
              onFirstMessageSent={handleFirstMessageSent}
              onConversationUpdated={handleConversationUpdated}
              onConversationStarted={handleConversationStarted}
            />
          </div>
        </div>

        {/* ── Desktop 3-panel layout (lg+) ─────────────────────────────────── */}
        <div className="hidden h-full overflow-hidden lg:flex">
          {mounted ? (
            <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
              {/* Left: content swaps per tab; panel is always present to keep index stable */}
              <ResizablePanel defaultSize="20" minSize="14" maxSize="28" className="min-w-0">
                {desktopLeft}
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Center: tabs */}
              <ResizablePanel defaultSize="55" minSize="40" className="min-w-0">
                {desktopCenter}
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Right: context + tools — collapsible via button or drag */}
              <ResizablePanel
                panelRef={contextPanelRef}
                defaultSize="25"
                minSize="18"
                maxSize="25"
                collapsible
                collapsedSize="4"
                className="min-w-0"
                onResize={(size) => setIsContextCollapsed(size.asPercentage <= 4)}
              >
                {desktopRight}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            // Pre-hydration fallback — mirrors the resizable defaults (20 / 55 / 25
            // plus 1px dividers) so the resizable group takes over without a jump.
            <div className="flex h-full w-full">
              <div className="min-w-0 shrink-0 basis-[20%]">{desktopLeft}</div>
              <div className="bg-border-subtle w-px shrink-0" />
              <div className="min-w-0 flex-1">{desktopCenter}</div>
              <div className="bg-border-subtle w-px shrink-0" />
              <div className="min-w-0 shrink-0 basis-[25%]">{desktopRight}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
