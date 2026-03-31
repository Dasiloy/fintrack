'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { getSession } from 'next-auth/react';
import { api_client } from '@/lib/trpc_app/api_client';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/notification';
import { addNotificationAtom, notificationsAtom } from '@/lib/jotai/notification';

export function usePushNotifications() {
  const { data } = api_client.notification.getNotifications.useQuery();
  const setNotifications = useSetAtom(notificationsAtom);
  const addNotification = useSetAtom(addNotificationAtom);

  useEffect(() => {
    if (data) {
      setNotifications(data.data ?? []);
    }
  }, [data]);

  useEffect(() => {
    // Notification API not supported — stop here
    if (!('Notification' in window)) return;

    // User already denied — do not ask again, do not register
    if (Notification.permission === 'denied') return;

    // User already granted — register without prompting
    // User has not decided yet — requestPermission() will prompt once
    async function register() {
      const session = await getSession();

      if (!session || !session.user) return;

      const token = await requestNotificationPermission();
      if (!token) return; // covers denied + unsupported cases

      const res = await fetch('/api/fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken: token }),
      });
      if (!res.ok) return;

      const { success } = await res.json();
      if (!success) return;

      unsubscribeForeground = await onForegroundMessage((payload) => {
        const newNotification = {
          title: payload.notification?.title,
          body: payload.notification?.body,
          data: payload.data,
          createdAt: new Date(payload.data?.createdAt),
          notificationId: payload.data?.notificationId,
        };
        addNotification(newNotification);
      });
    }

    let unsubscribeForeground: (() => void) | null = null;
    register();

    return () => {
      unsubscribeForeground?.();
    };
  }, []);
}
