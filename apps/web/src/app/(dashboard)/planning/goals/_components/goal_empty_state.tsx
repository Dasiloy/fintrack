import { Target } from 'lucide-react';
import { Button } from '@ui/components';

interface GoalEmptyStateProps {
  onNew: () => void;
}

export function GoalEmptyState({ onNew }: GoalEmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="bg-bg-muted flex size-14 items-center justify-center rounded-2xl">
        <Target className="text-text-disabled size-7" />
      </div>
      <div className="space-y-1">
        <p className="text-text-primary text-[15px] font-semibold">No goals yet</p>
        <p className="text-text-tertiary max-w-[260px] text-[13px] leading-snug">
          Create your first savings goal and start tracking your progress.
        </p>
      </div>
      <Button size="sm" onClick={onNew}>
        Create your first goal
      </Button>
    </div>
  );
}
