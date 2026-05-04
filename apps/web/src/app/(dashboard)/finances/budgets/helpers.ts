import type { SpendingTrendMonth } from '@fintrack/types/protos/finance/budget';
import type { ChartConfig } from '@ui/components';

function buildTotalConfig(): ChartConfig {
  return { total: { label: 'Total Spending', color: '#6366f1' } };
}

function buildCategoryConfig(data: SpendingTrendMonth[]): ChartConfig {
  return data
    .flatMap((m) => m.byCategory)
    .reduce<ChartConfig>((cfg, cat) => {
      if (!(cat.slug in cfg)) cfg[cat.slug] = { label: cat.name, color: cat.color };
      return cfg;
    }, {});
}

function buildTotalData(data: SpendingTrendMonth[]) {
  return data.map((m) => ({ label: m.label, total: m.total }));
}

function buildCategoryData(data: SpendingTrendMonth[]) {
  return data.map((m) => ({
    label: m.label,
    ...Object.fromEntries(m.byCategory.map((cat) => [cat.slug, cat.amount])),
  }));
}

// ── Budget ring ──────────────────────────────────────────────────────────────

export const RING_RADIUS = 36;
export const RING_STROKE = 6;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ringColorClass(ratio: number, alertThreshold: number): string {
  if (ratio >= 1) return 'text-error';
  if (ratio >= alertThreshold) return 'text-warning';
  return 'text-success';
}

export { buildTotalConfig, buildCategoryConfig, buildTotalData, buildCategoryData };
