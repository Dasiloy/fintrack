import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

import {
  InsightRecommendation,
  MacroContext,
  UserBalanceContext,
} from './insights.types';

/**
 * LangGraph state for the insights generation pipeline.
 *
 * ## Field semantics
 *
 * - `messages` — append reducer; used by the analysis ReAct branch
 *   (analysis_think ↔ tx_tools loop). Not touched by summarize / cash_flow.
 * - `anomalies` / `goalAlerts` — append reducers so the analysis branch
 *   can write without overwriting any other parallel writes.
 * - All other fields use replace semantics (last write wins).
 * - `nodeErrors` — merge reducer so parallel branches each contribute.
 */
export const InsightState = Annotation.Root({
  userId: Annotation<string>(),
  /** Last 3 AiInsight rows — provides trend awareness for the LLM */
  historicalInsights: Annotation<any[]>({
    value: (_, upd: any[]) => upd,
    default: () => [],
  }),
  /** Latest monthly AnalyticsSnapshot data payload */
  analyticsSnapshot: Annotation<any>(),
  goals: Annotation<any[]>({
    value: (_, upd: any[]) => upd,
    default: () => [],
  }),
  budgets: Annotation<any[]>({
    value: (_, upd: any[]) => upd,
    default: () => [],
  }),
  recurringItems: Annotation<any[]>({
    value: (_, upd: any[]) => upd,
    default: () => [],
  }),
  splits: Annotation<any[]>({
    value: (_, upd: any[]) => upd,
    default: () => [],
  }),
  macroContext: Annotation<MacroContext>(),
  summary: Annotation<string>({
    value: (_, upd: string) => upd,
    default: () => '',
  }),
  anomalies: Annotation<string[]>({
    value: (curr: string[], upd: string[]) => curr.concat(upd),
    default: () => [],
  }),
  goalAlerts: Annotation<string[]>({
    value: (curr: string[], upd: string[]) => curr.concat(upd),
    default: () => [],
  }),
  cashFlowForecast: Annotation<string>({
    value: (_, upd: string) => upd,
    default: () => '',
  }),
  recommendations: Annotation<InsightRecommendation[]>({
    value: (_, upd: InsightRecommendation[]) => upd,
    default: () => [],
  }),
  severity: Annotation<'info' | 'warning' | 'critical'>({
    value: (_, upd: 'info' | 'warning' | 'critical') => upd,
    default: () => 'info' as const,
  }),
  /** Real-time account balance snapshot — loaded by load_context */
  userBalance: Annotation<UserBalanceContext | null>(),
  /**
   * Message history for the analysis ReAct loop (analysis_think ↔ tx_tools).
   * Append reducer so each node can push without losing prior context.
   */
  messages: Annotation<BaseMessage[]>({
    value: (curr: BaseMessage[], upd: BaseMessage[]) => curr.concat(upd),
    default: () => [],
  }),
  /**
   * Accumulates error messages from nodes that degraded gracefully.
   * Merge reducer so parallel branches can each contribute without overwriting.
   */
  nodeErrors: Annotation<Record<string, string>>({
    value: (curr: Record<string, string>, upd: Record<string, string>) => ({
      ...curr,
      ...upd,
    }),
    default: () => ({}),
  }),
});
