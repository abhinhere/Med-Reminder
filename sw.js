const CACHE_NAME = 'medremind-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || 'icon-512.png',
        tag: data.tag,
        data: data.data || { url: './index.html' },
        requireInteraction: true
      };
      event.waitUntil(
        self.registration.showNotification(data.title || '💊 Medicine Reminder', options)
      );
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.url || './index.html';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
