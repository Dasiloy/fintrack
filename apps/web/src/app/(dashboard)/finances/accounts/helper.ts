export function bankColor(name: string): string {
  const palette = ['#6366f1', '#22c55e', '#f59e0b', '#14b8a6', '#3b82f6', '#ec4899', '#f97316'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length]!;
}

export function maskNumber(n: string): string {
  return n.length > 4 ? `•••• ${n.slice(-4)}` : n;
}

export const STATUS_CONFIG = {
  AVAILABLE: { label: 'Active', dot: 'bg-success', text: 'text-success' },
  PARTIAL: { label: 'Partial', dot: 'bg-warning', text: 'text-warning' },
  UNAVAILABLE: { label: 'Disconnected', dot: 'bg-error', text: 'text-error' },
} as const;
