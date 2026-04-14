import { Landmark, Plus } from 'lucide-react';
import { Button } from '@ui/components';

interface AccountsEmptyProps {
  onLink: () => void;
  isLinking: boolean;
}

export function AccountsEmpty({ onLink, isLinking }: AccountsEmptyProps) {
  return (
    <div className="glass-card rounded-card border-border-subtle flex flex-col items-center justify-center border px-6 py-16 text-center">
      <div className="bg-bg-surface-hover border-border-subtle mb-4 flex size-14 items-center justify-center rounded-2xl border">
        <Landmark className="text-text-disabled size-6" />
      </div>
      <p className="text-text-primary mb-1 text-[15px] font-semibold">No linked accounts</p>
      <p className="text-text-tertiary mb-6 max-w-xs text-[13px]">
        Connect your bank account to automatically import transactions and track your finances.
      </p>
      <Button onClick={onLink} loading={isLinking} className="gap-2">
        <Plus className="size-4" />
        Link Account
      </Button>
    </div>
  );
}
