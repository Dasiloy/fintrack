// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyB0EgT6tzzCmfU-n2AYkywSNcxURictDx0',
  authDomain: 'fintrack-ea372.firebaseapp.com',
  projectId: 'fintrack-ea372',
  storageBucket: 'fintrack-ea372.firebasestorage.app',
  messagingSenderId: '32358003290',
  appId: '1:32358003290:web:1e237797d222f4d6229e63',
  measurementId: 'G-FXVV69NL6B',
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Get Firebase Messaging
 * @returns Firebase Messaging instance or null if not supported
 */
export async function getFirebaseMessaging() {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}
