'use client';

// ── InsightsSidebarNav ────────────────────────────────────────────────────────
// Left-panel companion for the Insights tab. Shows a section map of the current
// insight run. Clicking a row toggles that section open/closed in InsightsPanel
// (shared state via AdvisorPageClient) and scrolls to the section.

import * as React from 'react';
import {
  FileText,
  AlertTriangle,
  Target,
  TrendingUp,
  Lightbulb,
  Globe,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { Skeleton } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { INSIGHT_SECTION_IDS } from '../_lib/advisor.constants';
import {
  relativeTime,
  getAnomalies,
  getGoalAlerts,
  getRecommendations,
} from '../_lib/advisor.helpers';

// ── Static section config (counts are derived from live data below) ───────────

const SECTION_CONFIG = [
  {
    id: INSIGHT_SECTION_IDS.SUMMARY,
    label: 'Summary',
    icon: FileText,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    countColor: '',
  },
  {
    id: INSIGHT_SECTION_IDS.ANOMALIES,
    label: 'Anomalies',
    icon: AlertTriangle,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
    countColor: 'bg-warning/10 text-warning',
  },
  {
    id: INSIGHT_SECTION_IDS.GOAL_ALERTS,
    label: 'Goal Alerts',
    icon: Target,
    iconColor: 'text-error',
    iconBg: 'bg-error/10',
    countColor: 'bg-error/10 text-error',
  },
  {
    id: INSIGHT_SECTION_IDS.CASH_FLOW,
    label: 'Cash Flow',
    icon: TrendingUp,
    iconColor: 'text-info',
    iconBg: 'bg-info/10',
    countColor: '',
  },
  {
    id: INSIGHT_SECTION_IDS.RECOMMENDATIONS,
    label: 'Recommendations',
    icon: Lightbulb,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    countColor: 'bg-success/10 text-success',
  },
  {
    id: INSIGHT_SECTION_IDS.MACRO,
    label: 'Macro Context',
    icon: Globe,
    iconColor: 'text-text-tertiary',
    iconBg: 'bg-bg-elevated',
    countColor: '',
  },
] as const;

// ── Sections that carry a count badge ────────────────────────────────────────
const COUNTED_IDS = new Set([
  INSIGHT_SECTION_IDS.ANOMALIES,
  INSIGHT_SECTION_IDS.GOAL_ALERTS,
  INSIGHT_SECTION_IDS.RECOMMENDATIONS,
]);

// ── Component ─────────────────────────────────────────────────────────────────

interface InsightsSidebarNavProps {
  expandedSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
}

export function InsightsSidebarNav({
  expandedSections,
  onToggleSection,
}: InsightsSidebarNavProps) {
  const { data, isLoading } = api_client.advisor.getInsights.useQuery(
    { limit: 1 },
    { staleTime: 60_000 },
  );

  const insight = data?.data?.[0] ?? null;

  const anomalies = insight ? getAnomalies(insight) : [];
  const goalAlerts = insight ? getGoalAlerts(insight) : [];
  const recommendations = insight ? getRecommendations(insight) : [];
  const actionableCount = recommendations.filter((r) => r.actionable).length;

  const counts: Record<string, number> = {
    [INSIGHT_SECTION_IDS.ANOMALIES]: anomalies.length,
    [INSIGHT_SECTION_IDS.GOAL_ALERTS]: goalAlerts.length,
    [INSIGHT_SECTION_IDS.RECOMMENDATIONS]: recommendations.length,
  };

  const handleSectionClick = (id: string) => {
    const isCurrentlyOpen = expandedSections[id] ?? false;
    onToggleSection(id);
    if (!isCurrentlyOpen) {
      setTimeout(() => {
        document.getElementById(`insight-section-${id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 50);
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg-elevated">

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Insights Map
        </span>
      </div>

      {/* Run metadata */}
      <div className="border-b border-border-subtle px-3 py-2.5">
        {isLoading ? (
          <Skeleton className="h-3 w-28" />
        ) : insight ? (
          <>
            <p className="text-[11px] text-text-disabled">
              Updated {relativeTime(new Date(insight.generatedAt))}
            </p>
            <p className="mt-0.5 text-[11px] capitalize text-text-tertiary">
              {insight.trigger.toLowerCase().replace(/_/g, ' ')} run
            </p>
          </>
        ) : (
          <p className="text-[11px] text-text-disabled">No insights yet</p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-px border-b border-border-subtle bg-border-subtle">
        {[
          { label: 'Actionable', value: actionableCount, color: 'text-primary' },
          { label: 'Anomalies', value: anomalies.length, color: 'text-warning' },
          { label: 'Alerts', value: goalAlerts.length, color: 'text-error' },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-0.5 bg-bg-elevated py-2.5">
            {isLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : (
              <span className={cn('text-[16px] font-bold tabular-nums', stat.color)}>
                {stat.value}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-wide text-text-disabled">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Section list */}
      <div className="flex flex-col gap-0.5 overflow-y-auto px-2 py-2">
        {SECTION_CONFIG.map((section) => {
          const isOpen = expandedSections[section.id] ?? false;
          const count = COUNTED_IDS.has(section.id as any) ? counts[section.id] : null;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleSectionClick(section.id)}
              className={cn(
                'flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors',
                isOpen ? 'bg-primary/10' : 'hover:bg-bg-surface-hover',
              )}
            >
              <div className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', section.iconBg)}>
                <section.icon className={cn('size-3.5', section.iconColor)} aria-hidden />
              </div>
              <span
                className={cn(
                  'flex-1 text-[12px] transition-colors',
                  isOpen ? 'font-semibold text-primary' : 'font-medium text-text-secondary',
                )}
              >
                {section.label}
              </span>
              {count != null && count > 0 && (
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums', section.countColor)}>
                  {count}
                </span>
              )}
              <ChevronRight
                className={cn(
                  'size-3 shrink-0 text-text-disabled transition-transform duration-200',
                  isOpen && 'rotate-90',
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {/* Actionable footer */}
      {actionableCount > 0 && (
        <div className="mt-auto border-t border-border-subtle px-3 py-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-2">
            <Zap className="size-3 shrink-0 text-primary" aria-hidden />
            <span className="text-[11px] text-text-tertiary">
              <span className="font-semibold text-primary">{actionableCount}</span>{' '}
              {actionableCount === 1 ? 'action' : 'actions'} ready to apply
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
