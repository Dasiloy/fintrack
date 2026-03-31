import { atom } from 'jotai';
import type { RouterOutputs } from '@/lib/trpc_app/client';

type Notification = NonNullable<RouterOutputs['notification']['getNotifications']['data']>[number];

export const notificationsAtom = atom<Notification[]>([]);

export const addNotificationAtom = atom(null, (get, set, notification: Notification) => {
  const ids = new Set(get(notificationsAtom).map((n) => n.notificationId));
  if (ids.has(notification.notificationId)) return;
  set(notificationsAtom, [notification, ...get(notificationsAtom)]);
});

export const removeNotificationAtom = atom(null, (get, set, notificationId: string) => {
  const notifications = get(notificationsAtom);
  set(
    notificationsAtom,
    notifications.filter((n) => n.notificationId !== notificationId),
  );
});

export const markNotificationAsReadAtom = atom(null, (get, set, notificationId: string) => {
  const notifications = get(notificationsAtom);
  set(
    notificationsAtom,
    notifications.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n)),
  );
});
