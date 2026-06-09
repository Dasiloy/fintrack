'use client';

import { useMemo } from 'react';
import { cn } from '@ui/lib/utils';
import dayjs from '@fintrack/utils/date';
import { Button, Skeleton } from '@ui/components';
import { useAtomValue, useSetAtom } from 'jotai';
import { Bell, CheckCheck, Clock3, Inbox, Trash2 } from 'lucide-react';
import { useRouter } from '@bprogress/next';
import {
  markNotificationAsReadAtom,
  notificationsAtom,
  removeNotificationAtom,
} from '@/lib/jotai/notification';
import { api_client } from '@/lib/trpc_app/api_client';
import { useFormatCurrency } from '@/hooks/use_format_currency';

type NotifData = Record<string, string> | null;

function resolveNotificationNav(data: NotifData) {
  if (!data?.type) return null;
  switch (data.type) {
    case 'transaction':
      return { href: '/finances/transactions', txId: data.transactionId ?? null, accountId: null, section: null };
    case 'bank_sync':
      return { href: '/finances/transactions', txId: null, accountId: null, section: null };
    case 'bank_link':
      return { href: '/finances/accounts', txId: null, accountId: data.accountId ?? null, section: null };
    case 'insight':
      return { href: '/advisor', txId: null, accountId: null, section: 'summary' };
    case 'budget_breach':
      return { href: '/advisor', txId: null, accountId: null, section: 'anomalies' };
    default:
      return null;
  }
}

type NotificationItem = ReturnType<typeof useAtomValue<typeof notificationsAtom>>[number];
type NotificationGroupKey = 'today' | 'yesterday' | 'older';

interface NotificationGroup {
  key: NotificationGroupKey;
  title: string;
  items: NotificationItem[];
}

const GROUP_ORDER: Array<{ key: NotificationGroupKey; title: string }> = [
  { key: 'today', title: 'Today' },
  { key: 'yesterday', title: 'Yesterday' },
  { key: 'older', title: 'Older' },
];

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getNotificationGroup(date: Date): NotificationGroupKey {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameLocalDay(date, now)) return 'today';
  if (isSameLocalDay(date, yesterday)) return 'yesterday';
  return 'older';
}

function NotificationCard({ notification }: { notification: NotificationItem }) {
  const formatCurrency = useFormatCurrency();
  const isRead = notification.read;
  const createdAt = new Date(notification.createdAt);
  const removeNotification = useSetAtom(removeNotificationAtom);
  const markNotificationAsRead = useSetAtom(markNotificationAsReadAtom);
  const router = useRouter();

  const data = (notification.data ?? null) as NotifData;
  const nav = resolveNotificationNav(data);

  // mutations
  const utils = api_client.useUtils();
  const { mutate: markAsRead, isPending: isMarkingAsRead } =
    api_client.notification.markNotificationAsRead.useMutation({
      onSettled: () => {
        utils.notification.getNotifications.invalidate();
      },
    });
  const { mutate: archive, isPending: isArchiving } =
    api_client.notification.archiveNotification.useMutation({
      onSettled: () => {
        utils.notification.getNotifications.invalidate();
      },
    });

  // helpers
  function handleMarkAsRead(notificationId: string) {
    markNotificationAsRead(notificationId);
    markAsRead({ notificationId });
  }
  function handleArchive(notificationId: string) {
    removeNotification(notificationId);
    archive({ notificationId });
  }
  function handleCardClick() {
    if (!nav) return;
    // Fire-and-forget: optimistic atom update + API call, never blocks navigation
    if (!isRead) {
      markNotificationAsRead(notification.notificationId);
      void markAsRead({ notificationId: notification.notificationId });
    }
    const params = new URLSearchParams();
    if (nav.txId) params.set('txId', nav.txId);
    if (nav.accountId) params.set('accountId', nav.accountId);
    if (nav.section) {
      params.set('tab', 'insights');
      params.set('section', nav.section);
    }
    const qs = params.toString();
    router.push(qs ? `${nav.href}?${qs}` : nav.href);
  }

  return (
    <article
      role={nav ? 'button' : undefined}
      tabIndex={nav ? 0 : undefined}
      onClick={nav ? handleCardClick : undefined}
      onKeyDown={
        nav
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleCardClick();
            }
          : undefined
      }
      className={cn(
        'group relative border-b px-3 py-2.5 transition-colors duration-200 last:border-b-0',
        isRead ? 'border-border-light bg-transparent' : 'border-primary/12 bg-transparent',
        nav &&
          'cursor-pointer outline-none hover:bg-bg-surface-hover focus-visible:ring-1 focus-visible:ring-border-light',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                'flex size-5.5 shrink-0 items-center justify-center rounded-md border',
                isRead
                  ? 'text-text-secondary border-border-light bg-transparent'
                  : 'border-primary/20 bg-primary/8 text-primary',
              )}
            >
              <Bell className="size-2.5" />
            </div>

            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="text-text-primary line-clamp-1 text-[12px] font-medium tracking-tight">
                {notification.title}
              </h3>
              {!isRead && (
                <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase">
                  New
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-text-secondary hover:text-text-primary size-7"
              disabled={isRead || isMarkingAsRead}
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead(notification.notificationId);
              }}
              aria-label={
                isRead
                  ? `${notification.title} already read`
                  : `Mark ${notification.title ?? 'notification'} as read`
              }
            >
              <CheckCheck className="size-3.5" />
            </Button>

            <Button
              size="icon-sm"
              variant="ghost"
              className="text-error hover:bg-error/10 hover:text-error size-7"
              disabled={isArchiving}
              onClick={(e) => {
                e.stopPropagation();
                handleArchive(notification.notificationId);
              }}
              aria-label={`Remove ${notification.title ?? 'notification'}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-text-tertiary mt-0.5 line-clamp-2 pl-7.5 text-[11px] leading-4.5">
          {notification.body}
        </p>

        {/* Entity detail line */}
        {data?.type === 'transaction' && data.transactionAmount && (
          <p className="text-text-disabled mt-0.5 pl-7.5 text-[10px] font-medium tabular-nums">
            {data.transactionType === 'EXPENSE' ? '-' : '+'}
            {formatCurrency(Number(data.transactionAmount))}
            {data.transactionSource
              ? ` · ${data.transactionSource.charAt(0) + data.transactionSource.slice(1).toLowerCase()}`
              : ''}
            {data.transactionDate ? ` · ${dayjs(data.transactionDate).format('DD MMM YYYY')}` : ''}
          </p>
        )}
        {data?.type === 'bank_sync' && (
          <p className="text-primary mt-0.5 pl-7.5 text-[10px] font-medium">→ View transactions</p>
        )}
        {data?.type === 'bank_link' && (
          <p className="text-primary mt-0.5 pl-7.5 text-[10px] font-medium">
            {data.accountId ? '→ View linked account' : '→ Go to accounts'}
          </p>
        )}
        {(data?.type === 'insight' || data?.type === 'budget_breach') && (
          <p className="text-primary mt-0.5 pl-7.5 text-[10px] font-medium">→ View in AI Advisor</p>
        )}

        <div className="text-text-disabled mt-1.5 flex items-center gap-1.5 pl-7.5 text-[10px]">
          <Clock3 className="size-2.5 shrink-0" />
          <span>{dayjs(createdAt).format('DD MMM YYYY, HH:mm')}</span>
        </div>
      </div>
    </article>
  );
}

function EmptyNotificationsState() {
  return (
    <div className="flex flex-1 items-start justify-center px-5 pt-10">
      <div className="flex flex-col items-center text-center">
        <Inbox className="text-text-secondary size-5 shrink-0" />
        <p className="text-text-tertiary mt-2 text-sm">No inbox yet.</p>
      </div>
    </div>
  );
}

function NotificationItemSkeleton() {
  return (
    <div className="border-b border-border-light px-3 py-2.5 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="size-5.5 rounded-md" />
          <div className="flex min-w-0 items-center gap-1.5">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="size-7 rounded-md" />
        </div>
      </div>

      <div className="mt-1 space-y-1 pl-7.5">
        <Skeleton className="h-3 w-[88%] rounded-full" />
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 pl-7.5">
        <Skeleton className="size-2.5 rounded-full" />
        <Skeleton className="h-2.5 w-24 rounded-full" />
      </div>
    </div>
  );
}

function NotificationGroupSkeleton() {
  return (
    <section aria-hidden="true">
      <div className="mb-3 flex items-center gap-3 px-1">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-px flex-1 rounded-none" />
        <Skeleton className="h-3 w-4 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-light">
        <NotificationItemSkeleton />
        <NotificationItemSkeleton />
        <NotificationItemSkeleton />
      </div>
    </section>
  );
}

// =================================================================================
//   MAIN COMPONENT
// =================================================================================
export default function Notifications() {
  const { isPending } = api_client.notification.getNotifications.useQuery();

  const notifications = useAtomValue(notificationsAtom);

  const groupedNotifications = useMemo<NotificationGroup[]>(() => {
    const buckets: Record<NotificationGroupKey, NotificationItem[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    notifications.forEach((notification) => {
      const createdAt = new Date(notification.createdAt);
      buckets[getNotificationGroup(createdAt)].push(notification);
    });

    return GROUP_ORDER.map((group) => ({
      ...group,
      items: buckets[group.key],
    })).filter((group) => group.items.length > 0);
  }, [notifications]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="from-bg-elevated via-bg-surface to-bg-deep flex h-full w-full flex-col bg-linear-to-b">
      <div className="sticky top-0 z-10 border-b border-border-light bg-bg-elevated/80 px-5 py-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-text-disabled mb-1 text-[11px] font-semibold tracking-[0.24em] uppercase">
              Inbox
            </p>
            <h1 className="text-text-primary text-xl font-semibold tracking-tight">
              Notifications
            </h1>
            <p className="text-text-tertiary mt-1 text-sm">
              Stay on top of updates, reminders, and important account activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border-light bg-bg-surface">
              <Bell className="text-text-primary size-4" />
            </div>

            {isPending ? (
              <Skeleton className="size-7 rounded-md" />
            ) : (
              <div className="min-w-[56px] text-right">
                <p className="text-text-disabled text-[10px] font-semibold tracking-[0.18em] uppercase">
                  Unread
                </p>
                <p className="text-text-primary mt-1 text-lg font-semibold">{unreadCount}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent flex-1 overflow-y-auto px-4 py-4">
        {isPending ? (
          <div className="space-y-6">
            <NotificationGroupSkeleton />
            <NotificationGroupSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyNotificationsState />
        ) : (
          <div className="space-y-6">
            {groupedNotifications.map((group) => (
              <section key={group.key} aria-labelledby={`notifications-group-${group.key}`}>
                <div className="mb-3 flex items-center gap-3 px-1">
                  <h2
                    id={`notifications-group-${group.key}`}
                    className="text-text-primary text-sm font-semibold tracking-tight"
                  >
                    {group.title}
                  </h2>
                  <div className="h-px flex-1 bg-border-light" />
                  <span className="text-text-disabled text-xs">{group.items.length}</span>
                </div>

                <div className="space-y-3">
                  {group.items.map((notification) => (
                    <NotificationCard
                      key={notification.notificationId}
                      notification={notification}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
