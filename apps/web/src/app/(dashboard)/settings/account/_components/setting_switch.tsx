'use client';

import { Switch } from '@ui/components';
import { cn } from '@ui/lib/utils';

interface SettingSwitchProps {
  title: string;
  description: string;
  Icon: React.ReactNode;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SettingSwitch({
  title,
  description,
  Icon,
  checked,
  disabled = false,
  onCheckedChange,
}: SettingSwitchProps) {
  return (
    <div className="bg-bg-surface flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center">
      {/**ICon container */}
      <div
        className={cn(
          'flex size-12 items-center justify-center rounded-lg',
          checked ? 'bg-primary/20 text-primary' : 'bg-bg-surface-hover text-text-secondary',
        )}
      >
        {Icon}
      </div>

      <div className="gap-between flex flex-1 items-start justify-between md:items-center">
        {/** title description */}
        <div className="flex flex-col gap-0.5">
          <p className="text-text-primary text-body font-medium">{title}</p>
          <p className="text-text-tertiary text-body-sm font-normal">{description}</p>
        </div>
        {/** toggle */}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          size={'default'}
        />
      </div>
    </div>
  );
}
