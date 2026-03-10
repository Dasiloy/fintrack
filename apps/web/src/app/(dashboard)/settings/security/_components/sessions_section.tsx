'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';
import {
  Globe,
  Laptop,
  Loader2,
  Monitor,
  Shield,
  Smartphone,
  Tablet,
  WifiOff,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Badge, Button, toast } from '@ui/components';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { env } from '@/env';
import { api_client } from '@/lib/trpc_app/api_client';
import { getTimeFromNow } from '@fintrack/utils/date';
import { maskIp } from '@fintrack/utils/format';

/** Infer a human-readable device type and icon from a raw user-agent string. */
function parseUserAgent(ua?: string | null): {
  deviceName: string;
  browser: string;
  Icon: typeof Monitor;
} {
  if (!ua) return { deviceName: 'Unknown Device', browser: 'Unknown Browser', Icon: Monitor };

  const uaLower = ua.toLowerCase();

  // Icon / device type
  const Icon =
    uaLower.includes('mobile') || uaLower.includes('android')
      ? Smartphone
      : uaLower.includes('ipad') || uaLower.includes('tablet')
        ? Tablet
        : uaLower.includes('windows') || uaLower.includes('macintosh') || uaLower.includes('linux')
          ? Laptop
          : Monitor;

  // Device OS label
  const deviceName = uaLower.includes('iphone')
    ? 'iPhone'
    : uaLower.includes('ipad')
      ? 'iPad'
      : uaLower.includes('android')
        ? 'Android'
        : uaLower.includes('macintosh')
          ? 'Mac'
          : uaLower.includes('windows')
            ? 'Windows PC'
            : uaLower.includes('linux')
              ? 'Linux'
              : 'Device';

  // Browser
  const browser = uaLower.includes('edg/')
    ? 'Edge'
    : uaLower.includes('chrome') && !uaLower.includes('chromium')
      ? 'Chrome'
      : uaLower.includes('firefox')
        ? 'Firefox'
        : uaLower.includes('safari') && !uaLower.includes('chrome')
          ? 'Safari'
          : uaLower.includes('opera') || uaLower.includes('opr/')
            ? 'Opera'
            : 'Browser';

  return { deviceName, browser, Icon };
}

/** Format activity type label. */
function activityTypeLabel(type: string) {
  return type === 'MFA' ? '2FA Authenticator' : 'Password';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionsSection() {
  const currentDeviceId = Cookies.get(env.NEXT_PUBLIC_DEVICE_ID_COOKIE_NAME) ?? '';

  const { data: sessionsData } = api_client.auth.getSessions.useQuery();
  const { data: activityData } = api_client.auth.getLoginActivity.useQuery();
  const utils = api_client.useUtils();

  const sessions = sessionsData?.data?.sessions ?? [];
  const activities = activityData?.data?.activities ?? [];

  // Track which session IDs are in-flight for deletion
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const { mutate: deleteSession } = api_client.auth.deleteSession.useMutation({
    onMutate: ({ sessionId }) => {
      setDeletingIds((prev) => new Set(prev).add(sessionId));
    },
    onSuccess: (res, { sessionId }) => {
      void utils.auth.getSessions.invalidate();
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });

      if (res.data?.wasCurrentSession) {
        toast.success('Session ended. Signing you out…');
        void signOut({ redirect: true, redirectTo: AUTH_ROUTES.LOGIN });
      } else {
        toast.success('Session ended');
      }
    },
    onError: (_, { sessionId }) => {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
      toast.error('Failed to end session. Please try again.');
    },
  });

  const { mutate: revokeAll } = api_client.auth.revokeAllOtherSessions.useMutation({
    onMutate: () => setIsRevokingAll(true),
    onSuccess: (res) => {
      void utils.auth.getSessions.invalidate();
      setIsRevokingAll(false);
      const count = res.data?.count ?? 0;
      toast.success(count > 0 ? `${count} session(s) ended` : 'No other sessions to end');
    },
    onError: () => {
      setIsRevokingAll(false);
      toast.error('Failed to end sessions. Please try again.');
    },
  });

  // Count other (non-current) sessions
  const otherSessionCount = sessions.filter((s) => s.deviceId !== currentDeviceId).length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Active sessions card ──────────────────────────────────────────── */}
      <div className="border-border-subtle bg-bg-elevated rounded-card border p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
              <Monitor className="text-primary size-4" />
            </div>
            <div>
              <p className="text-text-primary text-sm font-medium">Active Sessions</p>
              <p className="text-text-tertiary text-xs">Devices logged into your account</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-error text-xs"
            disabled={isRevokingAll || otherSessionCount === 0}
            onClick={() => revokeAll()}
          >
            {isRevokingAll ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
            End All Others
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className="border-border-subtle flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <WifiOff className="text-text-disabled size-5" />
            <p className="text-text-secondary text-sm font-medium">No active sessions</p>
            <p className="text-text-disabled text-xs">
              Sessions will appear here after you sign in
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => {
              const isCurrent = session.deviceId === currentDeviceId;
              const { deviceName, browser, Icon } = parseUserAgent(session.userAgent);
              const isDeleting = deletingIds.has(session.id);

              return (
                <li
                  key={session.id}
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
                      <Icon
                        className={`size-4 ${isCurrent ? 'text-primary' : 'text-text-tertiary'}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-text-primary text-xs font-medium">{deviceName}</p>
                        {isCurrent && (
                          <Badge
                            variant="secondary"
                            className="text-primary bg-primary/10 py-0 text-[10px]"
                          >
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

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-disabled hover:text-error ml-2 h-auto shrink-0 px-2 py-1 text-xs"
                    disabled={isDeleting}
                    onClick={() => deleteSession({ sessionId: session.id })}
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <X className="size-3" />
                    )}
                    <span className="ml-1">{isCurrent ? 'Sign out' : 'End'}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Login history card ────────────────────────────────────────────── */}
      <div className="border-border-subtle bg-bg-elevated rounded-card border p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
            <Shield className="text-primary size-4" />
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">Login History</p>
            <p className="text-text-tertiary text-xs">Recent sign-in activity</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="border-border-subtle flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <Globe className="text-text-disabled size-5" />
            <p className="text-text-secondary text-sm font-medium">No login history yet</p>
            <p className="text-text-disabled text-xs">
              Activity will appear here after you sign in
            </p>
          </div>
        ) : (
          <div className="space-y-0 overflow-hidden rounded-lg border border-white/5">
            {activities.map((row) => {
              const isSuccess = row.status === 'SUCCESS';
              return (
                <div
                  key={row.id}
                  className="border-border-subtle flex items-center gap-4 border-b px-4 py-3 last:border-0"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      isSuccess
                        ? 'bg-success shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                        : 'bg-error shadow-[0_0_6px_rgba(248,113,113,0.5)]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary text-xs font-medium capitalize">
                      {isSuccess ? 'Success' : 'Failed'}
                    </p>
                    <p className="text-text-disabled font-mono text-[11px]">
                      {maskIp(row.ipAddress)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-secondary text-xs">{activityTypeLabel(row.type)}</p>
                    <p className="text-text-disabled text-[11px]">
                      {getTimeFromNow(row.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
