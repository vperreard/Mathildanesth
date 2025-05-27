// Service Worker for Mathildanesth
const CACHE_NAME = 'mathildanesth-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/_next/static/css/*.css',
  '/fonts/*.woff2',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS.filter(asset => !asset.includes('*')));
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API routes - always fetch fresh
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Cache strategy for static assets
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;

          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
    );
    return;
  }

  // Network first, cache fallback for HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;

          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Default: cache first for other assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leaves') {
    event.waitUntil(syncLeaveRequests());
  }
});

async function syncLeaveRequests() {
  const cache = await caches.open('leave-requests');
  const requests = await cache.keys();

  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}