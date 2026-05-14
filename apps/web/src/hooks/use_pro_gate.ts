'use client';

import * as React from 'react';
import { type Usage } from '@fintrack/types/constants/plan.constants';
import { useCanUseFeature } from '@/app/providers/plan_usage_provider';

/**
 * Returns gate state and a `triggerGate` helper for a Pro-gated feature.
 *
 * Usage:
 * ```tsx
 * const { open, onClose, triggerGate } = useProGate(Usage.CSV_EXPORT);
 *
 * <Button onClick={() => triggerGate(handleExport)}>Export</Button>
 * <ProGateModal feature={Usage.CSV_EXPORT} open={open} onClose={onClose} />
 * ```
 *
 * `triggerGate(fn?)` executes `fn` if the user can use the feature,
 * otherwise opens the upgrade modal.
 */
export function useProGate(feature: Usage) {
  const [open, setOpen] = React.useState(false);
  const canUse = useCanUseFeature(feature);

  const triggerGate = React.useCallback(
    (action?: () => void) => {
      if (canUse) {
        action?.();
      } else {
        setOpen(true);
      }
    },
    [canUse],
  );

  const onClose = React.useCallback(() => setOpen(false), []);

  return { open, onClose, canUse, triggerGate };
}
