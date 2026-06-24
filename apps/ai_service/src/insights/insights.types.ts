export {
  AlphaVantageFxResponse,
  GenerateInsightsRes,
  InsightRecommendation,
  InsightsJobPayload,
  MacroContext,
  UserBalanceContext,
} from '@fintrack/types/interfaces/insights';

/**
 * Static per-run context for the insights graph. Passed via LangGraph's
 * `context` option (not graph state) and read by nodes through `runtime.context`
 * and by tools through `config.context`.
 */
export interface InsightsContext {
  userId: string;
}
