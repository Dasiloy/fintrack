'use client';

import type { Session } from '@fintrack/database/types';
import { parseUserAgent } from '@/utils/helpers';
import { Badge } from '@ui/components/atoms/badge';
import { maskIp } from '@fintrack/utils/format';
import { getTimeFromNow } from '@fintrack/utils/date';
import { Button } from '@ui/components';
import { Loader2, X } from 'lucide-react';

interface UiSessionProps {
  session: Session;
  isCurrent?: boolean;
  isDeleting?: boolean;
  showActionButton?: boolean;
  deleteSession?: ({ sessionId }: { sessionId: string }) => void;
}

export function UiSession({
  session,
  isCurrent,
  isDeleting,
  deleteSession,
  showActionButton,
  ...rest
}: UiSessionProps) {
  const { deviceName, browser, Icon } = parseUserAgent(session.userAgent);
  return (
    <li
      {...rest}
      className={`flex items-center justify-between rounded-lg p-3 ${
        isCurrent ? 'bg-primary/5 border-primary/15 border' : 'bg-bg-surface-hover'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            isCurrent ? 'bg-primary/10' : 'bg-bg-surface'
          }`}
        >
          <Icon className={`size-4 ${isCurrent ? 'text-primary' : 'text-text-tertiary'}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-text-primary text-xs font-medium">{deviceName}</p>
            {isCurrent && (
              <Badge variant="secondary" className="text-primary bg-primary/10 py-0 text-[10px]">
                Current
              </Badge>
            )}
          </div>
          <p className="text-text-disabled truncate text-[11px]">
            {browser}
            {session.location ? ` · ${session.location}` : ''}
            {` · ${maskIp(session.ipAddress)}`}
            {!isCurrent && ` · ${getTimeFromNow(session.lastUsedAt)}`}
          </p>
        </div>
      </div>

      {showActionButton && (
        <Button
          variant="ghost"
          size="sm"
          className="text-text-disabled hover:text-error ml-2 h-auto shrink-0 px-2 py-1 text-xs"
          disabled={isDeleting}
          onClick={deleteSession?.bind(null, { sessionId: session.id })}
        >
          {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
          <span className="ml-1">{isCurrent ? 'Sign out' : 'End'}</span>
        </Button>
      )}
    </li>
  );
}
