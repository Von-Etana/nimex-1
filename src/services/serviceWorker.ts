/**
 * Service Worker for PWA functionality and offline capabilities
 * Handles caching, background sync, and push notifications
 */

import { errorTracking } from './errorTracking';

const CACHE_NAME = 'nimex-v1.0.0';
const STATIC_CACHE = 'nimex-static-v1.0.0';
const DYNAMIC_CACHE = 'nimex-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files here when available
];

// API routes that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/categories/,
  /\/api\/products/,
  /\/api\/market-locations/
];

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/',
  '/categories',
  '/products',
  '/profile',
  '/orders'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event: any) => {
  console.log('Service Worker: Installing');

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_ASSETS);
        console.log('Service Worker: Static assets cached');

        // Skip waiting to activate immediately
        await (self as any).skipWaiting();
      } catch (error) {
        errorTracking.captureError(error as Error, {
          component: 'ServiceWorker',
          action: 'install',
          metadata: { assets: STATIC_ASSETS }
        });
      }
    })()
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: any) => {
  console.log('Service Worker: Activating');

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map(name => caches.delete(name))
        );

        // Take control of all clients
        await (self as any).clients.claim();
        console.log('Service Worker: Activated and claimed clients');
      } catch (error) {
        errorTracking.captureError(error as Error, {
          component: 'ServiceWorker',
          action: 'activate'
        });
      }
    })()
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.includes(url.pathname) || isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default to network-first for other requests
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Cache-first strategy - try cache, fallback to network
 */
async function cacheFirstStrategy(request: Request): Promise<Response> {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    errorTracking.captureError(error as Error, {
      component: 'ServiceWorker',
      action: 'cacheFirstStrategy',
      metadata: { url: request.url }
    });

    // Return offline fallback for critical routes
    if (OFFLINE_ROUTES.includes(new URL(request.url).pathname)) {
      return getOfflineResponse();
    }

    throw error;
  }
}

/**
 * Network-first strategy - try network, fallback to cache
 */
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    errorTracking.captureError(error as Error, {
      component: 'ServiceWorker',
      action: 'networkFirstStrategy',
      metadata: { url: request.url }
    });

    // Return offline fallback for critical routes
    if (OFFLINE_ROUTES.includes(new URL(request.url).pathname)) {
      return getOfflineResponse();
    }

    throw error;
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname: string): boolean {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Get offline response for critical routes
 */
function getOfflineResponse(): Response {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NIMEX - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f8fafc;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          text-align: center;
          max-width: 400px;
        }
        .icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: #006400;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }
        p {
          color: #64748b;
          margin-bottom: 20px;
        }
        button {
          background: #006400;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background: #004d00;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;

  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html' },
    status: 200
  });
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Perform background synchronization
 */
async function doBackgroundSync(): Promise<void> {
  try {
    // Implement background sync logic here
    // This could sync pending orders, messages, etc.
    console.log('Service Worker: Performing background sync');

    // Example: Sync pending cart items
    const pendingCart = await getPendingCartItems();
    if (pendingCart.length > 0) {
      await syncCartItems(pendingCart);
    }

  } catch (error) {
    errorTracking.captureError(error as Error, {
      component: 'ServiceWorker',
      action: 'backgroundSync'
    });
  }
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event: any) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.url,
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      (self as any).registration.showNotification(data.title, options)
    );
  } catch (error) {
    errorTracking.captureError(error as Error, {
      component: 'ServiceWorker',
      action: 'pushNotification'
    });
  }
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  if (event.action === 'view' && event.notification.data) {
    event.waitUntil(
      (self as any).clients.openWindow(event.notification.data)
    );
  }
});

/**
 * Get pending cart items from IndexedDB or similar
 */
async function getPendingCartItems(): Promise<any[]> {
  // Implement logic to get pending cart items
  return [];
}

/**
 * Sync cart items to server
 */
async function syncCartItems(items: any[]): Promise<void> {
  // Implement logic to sync cart items
  console.log('Syncing cart items:', items);
}

/**
 * Register service worker from main thread
 */
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              showUpdateNotification();
            }
          });
        }
      });

    } catch (error) {
      errorTracking.captureError(error as Error, {
        component: 'ServiceWorker',
        action: 'registration'
      });
    }
  }
};

/**
 * Show update notification
 */
function showUpdateNotification(): void {
  // Create and show update notification
  const updateEvent = new CustomEvent('sw-update-available');
  window.dispatchEvent(updateEvent);
}

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('Service Worker unregistered');
    } catch (error) {
      console.error('Error unregistering service worker:', error);
    }
  }
};