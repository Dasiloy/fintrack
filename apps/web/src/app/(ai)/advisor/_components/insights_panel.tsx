'use client';

// ── InsightsPanel ─────────────────────────────────────────────────────────────
// Full AI Insights view. Fetches the latest insight via tRPC and renders all 6
// section cards. expandedSections is controlled from AdvisorPageClient so the
// InsightsSidebarNav and this panel share the same open/closed state.

import * as React from 'react';
import { RefreshCw, Clock, BrainCircuit } from 'lucide-react';
import { Button, ScrollArea, Skeleton, toast } from '@ui/components';
import { cn } from '@ui/lib/utils';
import { api_client } from '@/lib/trpc_app/api_client';

import { InsightsSummaryCard } from './insights_summary_card';
import { InsightsAnomalyList } from './insights_anomaly_list';
import { InsightsGoalAlertList } from './insights_goal_alert_list';
import { InsightsCashFlowCard } from './insights_cash_flow_card';
import { InsightsRecommendationsList } from './insights_recommendations_list';
import { InsightsMacroCard } from './insights_macro_card';

import {
  relativeTime,
  getAnomalies,
  getGoalAlerts,
  getRecommendations,
  getMacroContext,
} from '../_lib/advisor.helpers';

interface InsightsPanelProps {
  expandedSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
}

export function InsightsPanel({ expandedSections, onToggleSection }: InsightsPanelProps) {
  const utils = api_client.useUtils();

  const { data, isLoading } = api_client.advisor.getInsights.useQuery(
    { limit: 1 },
    { staleTime: 60_000 },
  );

  const { mutate: trigger, isPending: isTriggering } =
    api_client.advisor.triggerInsights.useMutation({
      onSuccess: (res) => {
        const { queued, cooldownSeconds } = res.data ?? {};

        if (queued) {
          toast.success('Generating insights', {
            description: 'Your AI financial insight is being prepared — it will appear here in a moment.',
          });
          // Re-fetch after a short delay to pick up the new insight once the graph completes
          setTimeout(() => void utils.advisor.getInsights.invalidate(), 3000);
          return;
        }

        // Still within the 10-minute cooldown window
        const secs = cooldownSeconds ?? 0;
        const mins = Math.floor(secs / 60);
        const rem = secs % 60;
        const timeLabel = mins > 0
          ? `${mins} min${mins !== 1 ? 's' : ''}${rem > 0 ? ` ${rem}s` : ''}`
          : `${secs}s`;

        toast.info('Too soon to refresh', {
          description: `Insights refresh every 10 minutes. Try again in ${timeLabel}.`,
        });
      },
      onError: () => {
        toast.error('Failed to generate insights', {
          description: 'Something went wrong on our end. Please try again in a moment.',
        });
      },
    });

  const { mutate: markRead } = api_client.advisor.markRead.useMutation({
    onSuccess: () => void utils.advisor.getUnreadCount.invalidate(),
  });

  const insight = data?.data?.[0] ?? null;

  // Mark the latest insight as read once it loads (if it hasn't been read yet)
  React.useEffect(() => {
    if (insight && !insight.readAt) {
      markRead({ id: insight.id });
    }
  }, [insight?.id, insight?.readAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const isRefreshing = isTriggering;

  return (
    <div className="flex h-full flex-col">

      {/* ── Sub-header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-bg-elevated px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
          <Clock className="size-3 shrink-0" aria-hidden />
          {isLoading ? (
            <Skeleton className="h-3 w-24" />
          ) : insight ? (
            <span>Updated {relativeTime(new Date(insight.generatedAt))}</span>
          ) : (
            <span>No insights yet</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 cursor-pointer gap-1.5 px-2 text-[11px]"
          onClick={() => trigger()}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw className={cn('size-3', isRefreshing && 'animate-spin')} aria-hidden />
          {isRefreshing ? 'Generating…' : 'Refresh'}
        </Button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-3 p-4">

          {isLoading && (
            <>
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </>
          )}

          {!isLoading && !insight && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <BrainCircuit className="size-6 text-primary" aria-hidden />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-semibold text-text-primary">No insights yet</p>
                <p className="text-[12px] text-text-tertiary">
                  Tap Refresh to generate your first AI financial insight.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => trigger()} disabled={isTriggering}>
                <RefreshCw className={cn('mr-1.5 size-3', isTriggering && 'animate-spin')} />
                {isTriggering ? 'Generating…' : 'Generate insights'}
              </Button>
            </div>
          )}

          {!isLoading && insight && (
            <>
              <div id="insight-section-summary">
                <InsightsSummaryCard
                  summary={insight.summary ?? null}
                  expanded={expandedSections['summary'] ?? false}
                  onToggle={() => onToggleSection('summary')}
                />
              </div>

              <div id="insight-section-anomalies">
                <InsightsAnomalyList
                  anomalies={getAnomalies(insight)}
                  expanded={expandedSections['anomalies'] ?? false}
                  onToggle={() => onToggleSection('anomalies')}
                />
              </div>

              <div id="insight-section-goal_alerts">
                <InsightsGoalAlertList
                  goalAlerts={getGoalAlerts(insight)}
                  expanded={expandedSections['goal_alerts'] ?? false}
                  onToggle={() => onToggleSection('goal_alerts')}
                />
              </div>

              <div id="insight-section-cash_flow">
                <InsightsCashFlowCard
                  forecast={insight.cashFlowForecast ?? null}
                  expanded={expandedSections['cash_flow'] ?? false}
                  onToggle={() => onToggleSection('cash_flow')}
                />
              </div>

              <div id="insight-section-recommendations">
                <InsightsRecommendationsList
                  recommendations={getRecommendations(insight)}
                  expanded={expandedSections['recommendations'] ?? false}
                  onToggle={() => onToggleSection('recommendations')}
                />
              </div>

              <div id="insight-section-macro">
                <InsightsMacroCard
                  context={getMacroContext(insight)}
                  expanded={expandedSections['macro'] ?? false}
                  onToggle={() => onToggleSection('macro')}
                />
              </div>
            </>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}
