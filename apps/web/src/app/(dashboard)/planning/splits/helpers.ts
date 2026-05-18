export type SplitStatusVariant = 'info' | 'warning' | 'success' | 'secondary';

export function statusVariant(status: string): SplitStatusVariant {
  if (status === 'SETTLED') return 'success';
  if (status === 'PARTIALLY_SETTLED') return 'warning';
  return 'info';
}

export function statusLabel(status: string): string {
  if (status === 'SETTLED') return 'Settled';
  if (status === 'PARTIALLY_SETTLED') return 'Partial';
  return 'Open';
}

export function progressBarColor(status: string): string {
  if (status === 'SETTLED') return 'bg-emerald-500';
  if (status === 'PARTIALLY_SETTLED') return 'bg-amber-400';
  return 'bg-primary';
}

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
