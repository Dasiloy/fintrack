import { Card, CardHeader, CardTitle, CardAction, Button, CardContent, Text } from '@ui/components';
import { cn } from '@ui/lib/utils';

interface SectionshellProps {
  title: string;
  color: 'green' | 'blue' | 'orange' | 'yellow';
  Icon: React.ReactNode;
  onSave: () => void;
  description: string;
  isSaving: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Sectionshell({
  title,
  Icon,
  onSave,
  color,
  description,
  isSaving,
  children,
  disabled = false,
}: SectionshellProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div
            className={cn(
              `flex size-12 items-center justify-center rounded-xl`,
              color === 'green' && 'bg-green-700/10 text-green-700',
              color === 'blue' && 'bg-blue-700/10 text-blue-700',
              color === 'orange' && 'bg-orange-700/10 text-orange-700',
              color === 'yellow' && 'bg-yellow-700/10 text-yellow-700',
            )}
          >
            {Icon}
          </div>
        </CardTitle>
        <CardAction>
          <Button
            size="xs"
            variant={'secondary'}
            onClick={onSave}
            disabled={disabled}
            loading={isSaving}
          >
            Save
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="pb-space-6 flex flex-col gap-1">
          <Text variant={'body'} color="primary" className="font-bold">
            {title}
          </Text>
          <Text variant={'body-sm'} color="tertiary" className="font-normal">
            {description}
          </Text>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
