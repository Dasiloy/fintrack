import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../setup';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ContentType, GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';

export interface PreviewSummaryItem {
  label: string;
  value: string;
  color?: 'green' | 'red' | 'primary';
}

export interface ExportPreviewData {
  summary: PreviewSummaryItem[];
  headers: string[];
  rows: (string | null)[][];
}

export interface CachedExport {
  bufferBase64: string;
  filename: string;
  mimeType: string;
  generatedAt: string;
  previewData: ExportPreviewData | null;
}

const ExportDocTypeSchema = z.enum([
  'transaction-history',
  'monthly-summary',
  'spending-breakdown',
  'budget-performance',
  'goal-progress',
  'net-worth',
]);

const ExportFormatSchema = z.enum(['csv', 'xlsx', 'pdf', 'image']);

export const exportRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Generates (or serves cached) an export for the authenticated user.
   * Free users are silently capped to a 120-day window server-side.
   * Returns the file as a base64 string inside the standard response envelope.
   *
   * @param type     - Document type (e.g. 'transaction-history', 'net-worth')
   * @param format   - Output format ('csv' | 'xlsx' | 'pdf' | 'image')
   * @param months   - Lookback window hint (default 6)
   * @param startDate - ISO date override for range start
   * @param endDate   - ISO date override for range end
   * @param txType    - Filter transactions by 'INCOME' | 'EXPENSE'
   * @param force     - Bypass cache and regenerate
   */
  generate: protectedProcedure
    .input(
      z.object({
        type: ExportDocTypeSchema,
        format: ExportFormatSchema,
        months: z.number().int().min(1).max(12).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        txType: z.enum(['INCOME', 'EXPENSE']).optional(),
        force: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/export/generate`, {
        method: 'POST',
        headers: gatewayHeaders(ctx.headers, ContentType.JSON),
        body: JSON.stringify(input),
      });
      if (!response.ok) await throwGatewayError(response);
      const data: StandardResponse<CachedExport> = await response.json();
      return data;
    }),

  /**
   * Invalidates all cached exports for the authenticated user (`DELETE /api/export/cache`).
   * Use for explicit "Regenerate" / preview refresh. Gateway mutations (transactions,
   * budgets, goals, recurring) already invalidate `export:{userId}:*` automatically.
   */
  invalidateCache: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/export/cache`, {
      method: 'DELETE',
      headers: gatewayHeaders(ctx.headers),
    });
    if (!response.ok) await throwGatewayError(response);
    const data: StandardResponse<null> = await response.json();
    return data;
  }),
});
