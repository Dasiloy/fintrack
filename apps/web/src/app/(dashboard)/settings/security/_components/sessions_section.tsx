'use client';

import { useState, useMemo } from 'react';
import Cookies from 'js-cookie';
import { Globe, Loader2, Monitor, Shield, WifiOff, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button, toast } from '@ui/components';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { env } from '@/env';
import { api_client } from '@/lib/trpc_app/api_client';
import { UiSession } from '@/app/(dashboard)/settings/_components/session';
import type { LoginActivity, Session } from '@fintrack/database/types';
import { LoginActivityItem } from '@/app/(dashboard)/settings/_components/login_activity';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SessionsSection() {
  const currentDeviceId = Cookies.get(env.NEXT_PUBLIC_DEVICE_ID_COOKIE_NAME) ?? '';

  const { data: sessionsData } = api_client.auth.getSessions.useQuery({ take: 10 });
  const { data: activityData } = api_client.auth.getLoginActivity.useQuery({ take: 10 });
  const utils = api_client.useUtils();

  const sessions = useMemo(() => sessionsData?.data ?? [], [sessionsData]);
  const activities = useMemo(() => activityData?.data ?? [], [sessionsData]);

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
              const isDeleting = deletingIds.has(session.id);

              return (
                <UiSession
                  key={session.id}
                  session={session as Session}
                  isCurrent={isCurrent}
                  isDeleting={isDeleting}
                  deleteSession={deleteSession}
                  showActionButton={true}
                />
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
              return <LoginActivityItem key={row.id} loginActivity={row as LoginActivity} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
