import type { SpendingTrendMonth } from '@fintrack/types/protos/finance/budget';
import type { ChartConfig } from '@ui/components';

function buildTotalConfig(): ChartConfig {
  return { total: { label: 'Total Spending', color: '#6366f1' } };
}

function buildCategoryConfig(data: SpendingTrendMonth[]): ChartConfig {
  return data
    .flatMap((m) => m.byCategory ?? [])
    .reduce<ChartConfig>((cfg, cat) => {
      if (!(cat.slug in cfg)) cfg[cat.slug] = { label: cat.name, color: cat.color };
      return cfg;
    }, {});
}

function buildTotalData(data: SpendingTrendMonth[]) {
  return data.map((m) => ({ label: m.label, total: m.total }));
}

function buildCategoryData(data: SpendingTrendMonth[]) {
  // Collect every slug that appears in any month — ensures all Area series
  // have a value in every data point so Recharts renders colors correctly.
  const allSlugs = [
    ...new Set(data.flatMap((m) => (m.byCategory ?? []).map((c) => c.slug))),
  ];

  return data.map((m) => {
    const catMap = new Map((m.byCategory ?? []).map((c) => [c.slug, c.amount]));
    return {
      label: m.label,
      ...Object.fromEntries(allSlugs.map((slug) => [slug, catMap.get(slug) ?? 0])),
    };
  });
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

export function formatYAxisTick(val: number): string {
  if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}m`;
  if (val >= 1_000) return `₦${Math.round(val / 1_000)}k`;
  return `₦${val}`;
}
