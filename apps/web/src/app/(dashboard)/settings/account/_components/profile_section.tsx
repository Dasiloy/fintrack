'use client';

import type { PropsWithChildren } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  Button,
} from '@ui/components';

interface ProfileSectionProps extends PropsWithChildren {
  title: string;
  description: string;
  Icon: React.ReactNode;
  saving?: boolean;
  onSave?: () => void;
}

export function ProfileSection({
  title,
  description,
  Icon,
  onSave,
  children,
  saving = false,
}: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            {Icon}
            <span>{title}</span>
          </div>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button size="xs" variant={'secondary'} loading={saving} onClick={onSave}>
            Save
          </Button>
        </CardAction>
      </CardHeader>{' '}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
