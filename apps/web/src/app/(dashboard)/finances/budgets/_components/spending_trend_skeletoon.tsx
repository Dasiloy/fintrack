'use client';

import { SpendingTrendHeader } from './spending_trend_header';

export function SpendingTrendChartSkeleton() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl">
        {/* Grid lines */}
        <div className="absolute inset-x-[52px] inset-y-2 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-border-subtle border-t border-dashed opacity-60" />
          ))}
        </div>

        {/* Y-axis label skeletons */}
        <div className="absolute left-0 top-0 flex h-[calc(100%-20px)] w-[52px] flex-col justify-between py-2 pr-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-surface-hover h-2.5 w-full animate-pulse rounded" />
          ))}
        </div>

        {/* Area chart silhouette */}
        <div className="absolute inset-x-[52px] bottom-5 top-2">
          <svg
            viewBox="0 0 400 160"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id="skel-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path
              d="M0,115 C35,105 65,72 105,82 C145,92 175,48 220,36 C260,24 295,58 335,46 C360,38 385,52 400,46 L400,160 L0,160 Z"
              fill="url(#skel-area-grad)"
              className="animate-pulse text-current"
              style={{ color: 'var(--ft-color-text-disabled)' }}
            />
            {/* Line */}
            <path
              d="M0,115 C35,105 65,72 105,82 C145,92 175,48 220,36 C260,24 295,58 335,46 C360,38 385,52 400,46"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-pulse"
              style={{ color: 'var(--ft-color-text-disabled)', opacity: 0.35 }}
            />
          </svg>
        </div>

        {/* X-axis label skeletons */}
        <div className="absolute bottom-0 left-[52px] right-0 flex justify-between px-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-surface-hover h-2.5 w-12 animate-pulse rounded" />
          ))}
        </div>
    </div>
  );
}

export function SpendingTrendSkeleton() {
  return (
    <div className="space-y-3">
      <SpendingTrendHeader mode="total" months={6} disabled />
      <SpendingTrendChartSkeleton />
    </div>
  );
}
