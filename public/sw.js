const CACHE_NAME = 'nimex-v1.0.0';
const STATIC_CACHE = 'nimex-static-v1.0.0';
const DYNAMIC_CACHE = 'nimex-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// API routes that should be cached
const API_CACHE_PATTERNS = [
    /\/api\/categories/,
    /\/api\/products/,
];

// Routes that should work offline
const OFFLINE_ROUTES = [
    '/',
    '/categories',
    '/products',
    '/profile',
    '/orders',
    '/cart'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing');

    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(STATIC_CACHE);
                await cache.addAll(STATIC_ASSETS);
                console.log('Service Worker: Static assets cached');
                await self.skipWaiting();
            } catch (error) {
                console.error('Service Worker install error:', error);
            }
        })()
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating');

    event.waitUntil(
        (async () => {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames
                        .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map(name => caches.delete(name))
                );
                await self.clients.claim();
                console.log('Service Worker: Activated');
            } catch (error) {
                console.error('Service Worker activate error:', error);
            }
        })()
    );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') return;

    // Handle API requests with network-first strategy
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Handle static assets with cache-first strategy
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // Default to network-first for other requests
    event.respondWith(networkFirstStrategy(request));
});

/**
 * Cache-first strategy
 */
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const url = new URL(request.url);
        if (OFFLINE_ROUTES.includes(url.pathname)) {
            return getOfflineResponse();
        }
        throw error;
    }
}

/**
 * Network-first strategy
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        const url = new URL(request.url);
        if (OFFLINE_ROUTES.includes(url.pathname)) {
            return getOfflineResponse();
        }
        throw error;
    }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Get offline response
 */
function getOfflineResponse() {
    const offlineHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NIMEX - Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 400px;
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #006400 0%, #008000 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
        }
        h1 {
          font-size: 24px;
          color: #1e293b;
          margin-bottom: 12px;
        }
        p {
          color: #64748b;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        button {
          background: linear-gradient(135deg, #006400 0%, #008000 100%);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,100,0,0.3);
        }
        button:active { transform: translateY(0); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again. Your data will be saved when you're back online.</p>
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
 * Push notification handler
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: data.url,
            vibrate: [100, 50, 100],
            actions: [
                { action: 'view', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'NIMEX', options)
        );
    } catch (error) {
        console.error('Push notification error:', error);
    }
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view' && event.notification.data) {
        event.waitUntil(
            self.clients.openWindow(event.notification.data)
        );
    }
});
