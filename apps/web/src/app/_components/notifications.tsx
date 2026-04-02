'use client';

import { useMemo } from 'react';
import dayjs from '@fintrack/utils/date';
import { Button, Skeleton } from '@ui/components';
import { useAtomValue, useSetAtom } from 'jotai';
import { Bell, CheckCheck, Clock3, Inbox, Trash2 } from 'lucide-react';
import {
  markNotificationAsReadAtom,
  notificationsAtom,
  removeNotificationAtom,
} from '@/lib/jotai/notification';
import { api_client } from '@/lib/trpc_app/api_client';
import { cn } from '@ui/lib/utils';

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
  const isRead = notification.read;
  const createdAt = new Date(notification.createdAt);
  const removeNotification = useSetAtom(removeNotificationAtom);
  const markNotificationAsRead = useSetAtom(markNotificationAsReadAtom);

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
    // optimistic update
    markNotificationAsRead(notificationId);
    markAsRead({ notificationId });
  }
  function handleArchive(notificationId: string) {
    // optimistic update
    removeNotification(notificationId);
    archive({ notificationId });
  }

  return (
    <article
      className={cn(
        'group relative border-b px-3 py-2.5 transition-colors duration-200 last:border-b-0',
        isRead ? 'border-white/6 bg-transparent' : 'border-primary/12 bg-transparent',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                'flex size-5.5 shrink-0 items-center justify-center rounded-md border',
                isRead
                  ? 'text-text-secondary border-white/8 bg-transparent'
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
              onClick={() => handleMarkAsRead(notification.notificationId)}
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
              onClick={() => handleArchive(notification.notificationId)}
              aria-label={`Remove ${notification.title ?? 'notification'}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-text-tertiary mt-0.5 line-clamp-2 pl-7.5 text-[11px] leading-4.5">
          {notification.body}
        </p>

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
    <div className="border-b border-white/6 px-3 py-2.5 last:border-b-0">
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

      <div className="overflow-hidden rounded-2xl border border-white/6">
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
  // queries

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
      <div className="sticky top-0 z-10 border-b border-white/6 bg-black/10 px-5 py-5 backdrop-blur-xl">
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
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

      <div className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1 overflow-y-auto px-4 py-4">
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
                  <div className="h-px flex-1 bg-white/8" />
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
