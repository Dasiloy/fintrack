import { Divide } from 'lucide-react';
import { Button } from '@ui/components';

interface SplitEmptyStateProps {
  onNew: () => void;
}

export function SplitEmptyState({ onNew }: SplitEmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="bg-bg-surface-hover flex size-14 items-center justify-center rounded-2xl">
        <Divide className="text-text-disabled size-7" />
      </div>
      <div className="space-y-1">
        <p className="text-text-primary text-[15px] font-semibold">No splits yet</p>
        <p className="text-text-tertiary max-w-[260px] text-[13px] leading-snug">
          Split a shared expense with friends or colleagues and track who's paid.
        </p>
      </div>
      <Button size="sm" onClick={onNew}>
        Create your first split
      </Button>
    </div>
  );
}
