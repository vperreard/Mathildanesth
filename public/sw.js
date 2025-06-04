// Minimal service worker that unregisters itself
self.addEventListener('install', () => {
    console.log('[SW] Installing self-unregistering service worker...');
    self.skipWaiting();
});

self.addEventListener('activate', async () => {
    console.log('[SW] Activating and unregistering...');
    
    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Unregister this service worker
    await self.registration.unregister();
    
    console.log('[SW] Service worker unregistered successfully');
    
    // Take control of all clients to ensure cleanup
    return self.clients.claim();
});

// Don't intercept any requests
self.addEventListener('fetch', () => {
    // Do nothing - let requests pass through normally
});