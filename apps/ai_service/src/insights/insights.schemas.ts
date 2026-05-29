import { z } from 'zod';

/**
 * Combined schema for the analysis branch (analysis_think → analysis_parse).
 * Replaces the separate AnomalyOutputSchema + GoalAlertOutputSchema now that
 * both concerns are handled by a single ReAct agent with tool-calling.
 */
export const AnalysisSchema = z.object({
  anomalies: z
    .array(
      z
        .string()
        .describe(
          'A single factual sentence about a spending anomaly, budget breach, or macro-economic concern. Use ₦ for amounts.',
        ),
    )
    .describe(
      '0–4 spending anomalies. Flag: budget over 80% utilisation, unusual recurring charges, food-inflation exposure. Return [] if nothing significant.',
    ),
  goalAlerts: z
    .array(
      z
        .string()
        .describe(
          'Alert for a goal behind schedule: include goal name, current vs. target-to-date progress, and the ₦ catch-up amount needed.',
        ),
    )
    .describe(
      'Alerts for goals that are behind schedule. Return [] if all goals are on track or there are no active goals.',
    ),
});
export type AnalysisOutput = z.infer<typeof AnalysisSchema>;

export const RecommendOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      text: z
        .string()
        .describe(
          'Specific, actionable recommendation with ₦ amounts where relevant.',
        ),
      priority: z.enum(['high', 'medium', 'low']),
      category: z.enum(['budget', 'goal', 'spending', 'saving', 'cashflow']),
      actionable: z
        .boolean()
        .describe('true only when a concrete next step exists for the user'),
    }),
  ),
  severity: z
    .enum(['info', 'warning', 'critical'])
    .describe(
      'critical = multiple high-priority issues or negative cash flow; ' +
        'warning = at least one notable concern; info = generally healthy',
    ),
});
export type RecommendOutput = z.infer<typeof RecommendOutputSchema>;
