// BeOut App - Service Worker for Push Notifications
const CACHE_NAME = 'beout-sw-v1';

// Install event
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(self.clients.claim());
});

// Push notification event
self.addEventListener('push', event => {
    console.log('[ServiceWorker] Push received', event);

    let notificationData = {
        title: 'BeOut',
        body: 'Nouvelle notification',
        icon: '/be-out_icon_512.svg',
        badge: '/be-out_icon_512.svg',
        tag: 'beout-notification',
        requireInteraction: false,
        data: {}
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = {
                ...notificationData,
                ...payload
            };
        } catch (err) {
            console.error('[ServiceWorker] Error parsing push payload:', err);
            notificationData.body = event.data.text() || notificationData.body;
        }
    }

    const promiseChain = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            data: notificationData.data,
            actions: notificationData.actions || []
        }
    );

    event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('[ServiceWorker] Notification click received');

    event.notification.close();

    if (event.action) {
        console.log('[ServiceWorker] Action clicked:', event.action);
        // Handle action clicks here
        switch (event.action) {
            case 'view':
                // Open the app to a specific view
                break;
            case 'ok':
                // Just close the notification
                break;
            default:
                console.log('[ServiceWorker] Unknown action:', event.action);
        }
    }

    // Open or focus the app
    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clientList => {
            // If there's already a window open, focus it
            if (clientList.length > 0) {
                const client = clientList[0];
                return client.focus();
            }

            // Otherwise, open a new window
            return self.clients.openWindow('/');
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
    console.log('[ServiceWorker] Notification closed:', event.notification.tag);
    // Track notification dismissal if needed
});

// Background sync (for future use)
self.addEventListener('sync', event => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    // Handle background sync events
});

// Message event for communication with the main app
self.addEventListener('message', event => {
    console.log('[ServiceWorker] Message received:', event.data);

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});
