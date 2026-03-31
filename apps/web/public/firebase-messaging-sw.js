importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB0EgT6tzzCmfU-n2AYkywSNcxURictDx0',
  authDomain: 'fintrack-ea372.firebaseapp.com',
  projectId: 'fintrack-ea372',
  storageBucket: 'fintrack-ea372.firebasestorage.app',
  messagingSenderId: '32358003290',
  appId: '1:32358003290:web:1e237797d222f4d6229e63',
  measurementId: 'G-FXVV69NL6B',
});

const messaging = firebase.messaging();

// Handle background messages — fires when app is not in focus
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;

  self.registration.showNotification(title, {
    body,
    icon: icon ?? '/icons/icon-192.png',
    data: payload.data, // pass through any custom data
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // App already open in a tab — just focus it
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      // App not open — open a new tab
      return clients.openWindow(event.notification.data.url);
    }),
  );
});
