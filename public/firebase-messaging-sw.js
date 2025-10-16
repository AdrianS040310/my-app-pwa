// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDtL-K5aZiuBua5XvGFg1TsN1RPE2R9-D4",
  authDomain: "pwa-notificaciones-5be22.firebaseapp.com",
  projectId: "pwa-notificaciones-5be22",
  storageBucket: "pwa-notificaciones-5be22.firebasestorage.app",
  messagingSenderId: "124985123243",
  appId: "1:124985123243:web:49bdb479143ab9dfc9f2ee",
  measurementId: "G-DSMR30S7VD"
});

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación',
    icon: '/icons/MyPWA-144x144.webp',
    badge: '/icons/MyPWA-74x74.webp',
    tag: 'notification-tag',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Abrir aplicación',
        icon: '/icons/MyPWA-74x74.webp'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/MyPWA-74x74.webp'
      }
    ],
    data: {
      url: payload.data?.url || '/',
      ...payload.data
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Abrir la aplicación o navegar a la URL específica
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
        // Buscar si ya hay una ventana abierta
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (event.action === 'close') {
    // Solo cerrar la notificación
    event.notification.close();
  }
});

// Handle notification close
self.addEventListener('notificationclose', function (event) {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});
