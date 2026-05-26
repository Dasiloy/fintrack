'use client';

// ── InsightsPanel ─────────────────────────────────────────────────────────────
// Full AI Insights view. Renders all 6 insight sections from STUB_INSIGHT.
// expandedSections is controlled from AdvisorPageClient so the InsightsSidebarNav
// and this panel share the same open/closed state.
// A "Refresh" button simulates triggering a new insight generation run.

import * as React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Button, ScrollArea } from '@ui/components';
import { cn } from '@ui/lib/utils';

import { InsightsSummaryCard } from './insights_summary_card';
import { InsightsAnomalyList } from './insights_anomaly_list';
import { InsightsGoalAlertList } from './insights_goal_alert_list';
import { InsightsCashFlowCard } from './insights_cash_flow_card';
import { InsightsRecommendationsList } from './insights_recommendations_list';
import { InsightsMacroCard } from './insights_macro_card';

import { STUB_INSIGHT } from '../_lib/advisor.stub';
import { relativeTime } from '../_lib/advisor.helpers';

interface InsightsPanelProps {
  expandedSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
}

export function InsightsPanel({ expandedSections, onToggleSection }: InsightsPanelProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">

      {/* ── Sub-header: timestamp + refresh ──────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-bg-elevated px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
          <Clock className="size-3 shrink-0" aria-hidden />
          <span>Updated {relativeTime(STUB_INSIGHT.generatedAt)}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 cursor-pointer gap-1.5 px-2 text-[11px]"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn('size-3', isRefreshing && 'animate-spin')}
            aria-hidden
          />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-3 p-4">

          <div id="insight-section-summary">
            <InsightsSummaryCard
              summary={STUB_INSIGHT.summary}
              expanded={expandedSections['summary'] ?? false}
              onToggle={() => onToggleSection('summary')}
            />
          </div>

          <div id="insight-section-anomalies">
            <InsightsAnomalyList
              anomalies={STUB_INSIGHT.anomalies}
              expanded={expandedSections['anomalies'] ?? false}
              onToggle={() => onToggleSection('anomalies')}
            />
          </div>

          <div id="insight-section-goal_alerts">
            <InsightsGoalAlertList
              goalAlerts={STUB_INSIGHT.goalAlerts}
              expanded={expandedSections['goal_alerts'] ?? false}
              onToggle={() => onToggleSection('goal_alerts')}
            />
          </div>

          <div id="insight-section-cash_flow">
            <InsightsCashFlowCard
              forecast={STUB_INSIGHT.cashFlowForecast}
              expanded={expandedSections['cash_flow'] ?? false}
              onToggle={() => onToggleSection('cash_flow')}
            />
          </div>

          <div id="insight-section-recommendations">
            <InsightsRecommendationsList
              recommendations={STUB_INSIGHT.recommendations}
              expanded={expandedSections['recommendations'] ?? false}
              onToggle={() => onToggleSection('recommendations')}
            />
          </div>

          <div id="insight-section-macro">
            <InsightsMacroCard
              context={STUB_INSIGHT.macroContext}
              expanded={expandedSections['macro'] ?? false}
              onToggle={() => onToggleSection('macro')}
            />
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
