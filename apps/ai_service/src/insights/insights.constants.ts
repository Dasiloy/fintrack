import { InsightSeverity, InsightTrigger } from '@fintrack/database/types';
import {
  GOOGLE_GEMINI_2_5_PRO,
  GOOGLE_GEMINI_2_5_FLASH,
} from '@fintrack/types/interfaces/ai';

/**
 * Decision model — Gemini 2.5 Pro (deep reasoning, structured output, tool use)
 * for analytical nodes that require judgment and accurate financial inference.
 * Switch to 'anthropic:claude-sonnet-4.6' once Anthropic credits are available.
 */
export const DECISION_MODEL = GOOGLE_GEMINI_2_5_PRO;

/**
 * Summary model — Gemini 2.5 Flash for free-text output nodes where
 * cost and latency matter more than deep reasoning (prose summary, cash flow forecast).
 */
export const SUMMARY_MODEL = GOOGLE_GEMINI_2_5_FLASH;

export const TRIGGER_MAP: Record<string, InsightTrigger> = {
  daily: InsightTrigger.DAILY,
  post_sync: InsightTrigger.POST_SYNC,
  month_end: InsightTrigger.MONTH_END,
  budget_breach: InsightTrigger.BUDGET_BREACH,
  manual: InsightTrigger.MANUAL,
};

export const SEVERITY_MAP: Record<string, InsightSeverity> = {
  info: InsightSeverity.INFO,
  warning: InsightSeverity.WARNING,
  critical: InsightSeverity.CRITICAL,
};
