// lib/firebase/notifications.ts
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { env } from '@/env';

/**
 * @description Request notification permission and get FCM token
 *
 *
 * @async
 * @returns {Promise<string | null>} FCM token or null if permission is denied
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token;
  } catch (err) {
    console.error('Failed to get FCM token:', err);
    return null;
  }
}

/**
 * @description Listen for foreground messages
 *
 * @async
 * @public
 * @param {Function} callback - The callback function to handle the message
 * @returns {Promise<(() => void) | null>} Unsubscribe function or null if messaging is not initialized
 */
export async function onForegroundMessage(
  callback: (payload: any) => void,
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  // Returns an unsubscribe function
  const unsubscribe = onMessage(messaging, callback);
  return unsubscribe;
}
