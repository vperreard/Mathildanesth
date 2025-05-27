// Service Worker sophistiqué pour MATHILDA
// Version 1.0.0

const CACHE_VERSION = 'mathilda-v1.0.0';
const CACHE_NAMES = {
    STATIC: `${CACHE_VERSION}-static`,
    DYNAMIC: `${CACHE_VERSION}-dynamic`,
    API_USER: `${CACHE_VERSION}-api-user`,
    API_STATIC: `${CACHE_VERSION}-api-static`,
    ASSETS: `${CACHE_VERSION}-assets`,
    PAGES: `${CACHE_VERSION}-pages`
};

// Configuration des stratégies de cache
const CACHE_STRATEGIES = {
    API_USER: { maxAge: 5 * 60 * 1000, strategy: 'network-first' }, // 5 minutes
    API_STATIC: { maxAge: 30 * 60 * 1000, strategy: 'cache-first' }, // 30 minutes
    ASSETS: { maxAge: 24 * 60 * 60 * 1000, strategy: 'cache-first' }, // 24 heures
    PAGES: { maxAge: 60 * 60 * 1000, strategy: 'network-first' }, // 1 heure
    FONTS: { maxAge: 7 * 24 * 60 * 60 * 1000, strategy: 'cache-first' } // 7 jours
};

// Ressources à précharger
const PRECACHE_RESOURCES = [
    '/',
    '/auth/login',
    '/manifest.json',
    '/offline.html',
    '/_next/static/css/app/layout.css',
    '/fonts/inter-var.woff2'
];

// Patterns d'URLs pour le cache
const URL_PATTERNS = {
    API_USER: /^\/api\/(auth|me|users|notifications)/,
    API_STATIC: /^\/api\/(sites|sectors|specialties|activity-types)/,
    ASSETS: /\.(js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
    PAGES: /^\/(?!api|_next\/static)/,
    FONTS: /\.(woff2?|ttf|eot)$/
};

// Installation du service worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installation en cours...');

    event.waitUntil(
        Promise.all([
            // Préchargement des ressources critiques
            caches.open(CACHE_NAMES.STATIC).then(cache => {
                return cache.addAll(PRECACHE_RESOURCES);
            }),
            // Création des autres caches
            ...Object.values(CACHE_NAMES).map(name => caches.open(name))
        ]).then(() => {
            console.log('[SW] Installation terminée');
            return self.skipWaiting();
        })
    );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activation en cours...');

    event.waitUntil(
        Promise.all([
            // Nettoyage des anciens caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (!Object.values(CACHE_NAMES).includes(cacheName)) {
                            console.log('[SW] Suppression du cache obsolète:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Prise de contrôle immédiate
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Activation terminée');
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-HTTP
    if (!request.url.startsWith('http')) return;

    // Ignorer les requêtes de mise à jour du SW
    if (url.pathname.includes('sw.js')) return;

    event.respondWith(handleRequest(request));
});

// Gestionnaire principal des requêtes
async function handleRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
        // API utilisateur (données dynamiques)
        if (URL_PATTERNS.API_USER.test(pathname)) {
            // Exclusion des routes d'authentification du cache
            if (pathname.includes('/auth/')) {
                return await fetch(request);
            }
            return await networkFirstStrategy(request, CACHE_NAMES.API_USER, CACHE_STRATEGIES.API_USER);
        }

        // API statique (données peu changeantes)
        if (URL_PATTERNS.API_STATIC.test(pathname)) {
            return await cacheFirstStrategy(request, CACHE_NAMES.API_STATIC, CACHE_STRATEGIES.API_STATIC);
        }

        // Assets statiques
        if (URL_PATTERNS.ASSETS.test(pathname) || URL_PATTERNS.FONTS.test(pathname)) {
            return await cacheFirstStrategy(request, CACHE_NAMES.ASSETS, CACHE_STRATEGIES.ASSETS);
        }

        // Pages
        if (URL_PATTERNS.PAGES.test(pathname)) {
            return await networkFirstStrategy(request, CACHE_NAMES.PAGES, CACHE_STRATEGIES.PAGES);
        }

        // Fallback réseau
        return await fetch(request);

    } catch (error) {
        console.error('[SW] Erreur lors du traitement de la requête:', error);
        return await handleOfflineFallback(request);
    }
}

// Stratégie Network First
async function networkFirstStrategy(request, cacheName, config) {
    const cache = await caches.open(cacheName);

    try {
        // Tentative réseau avec timeout
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Network timeout')), 3000)
            )
        ]);

        if (networkResponse.ok) {
            // Mise en cache de la réponse
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);

            // Nettoyage du cache si nécessaire
            await cleanupCache(cache, config.maxAge);
        }

        return networkResponse;

    } catch (error) {
        console.log('[SW] Réseau indisponible, utilisation du cache pour:', request.url);

        // Fallback cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        throw error;
    }
}

// Stratégie Cache First
async function cacheFirstStrategy(request, cacheName, config) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        // Vérifier si le cache est proche de l'expiration
        const cacheDate = new Date(cachedResponse.headers.get('date') || Date.now());
        const isNearExpiry = (Date.now() - cacheDate.getTime()) > (config.maxAge * 0.8);

        if (isNearExpiry) {
            // Refresh en arrière-plan
            fetch(request).then(response => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }
            }).catch(() => {
                // Ignorer les erreurs de refresh en arrière-plan
            });
        }

        return cachedResponse;
    }

    // Pas en cache, aller chercher sur le réseau
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
            await cleanupCache(cache, config.maxAge);
        }

        return networkResponse;

    } catch (error) {
        console.error('[SW] Impossible de récupérer la ressource:', request.url);
        throw error;
    }
}

// Nettoyage du cache
async function cleanupCache(cache, maxAge) {
    const requests = await cache.keys();
    const now = Date.now();

    for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
            const cacheDate = new Date(response.headers.get('date') || 0);
            if (now - cacheDate.getTime() > maxAge) {
                await cache.delete(request);
            }
        }
    }
}

// Gestion des fallbacks offline
async function handleOfflineFallback(request) {
    const url = new URL(request.url);

    // Page offline pour les navigations
    if (request.mode === 'navigate') {
        const offlineResponse = await caches.match('/offline.html');
        if (offlineResponse) {
            return offlineResponse;
        }
    }

    // Réponse JSON pour les APIs
    if (url.pathname.startsWith('/api/')) {
        return new Response(
            JSON.stringify({
                error: 'Service indisponible',
                offline: true,
                timestamp: Date.now()
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Fallback générique
    return new Response('Service indisponible', { status: 503 });
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'GET_CACHE_STATS':
            getCacheStats().then(stats => {
                event.ports[0].postMessage({ type: 'CACHE_STATS', payload: stats });
            });
            break;

        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;

        case 'PREFETCH_ROUTES':
            prefetchRoutes(payload.routes);
            break;
    }
});

// Statistiques du cache
async function getCacheStats() {
    const stats = {};

    for (const [name, cacheName] of Object.entries(CACHE_NAMES)) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats[name] = {
            count: keys.length,
            size: await getCacheSize(cache)
        };
    }

    return stats;
}

// Taille du cache
async function getCacheSize(cache) {
    const keys = await cache.keys();
    let size = 0;

    for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
            const blob = await response.blob();
            size += blob.size;
        }
    }

    return size;
}

// Nettoyage complet des caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Préchargement de routes
async function prefetchRoutes(routes) {
    const cache = await caches.open(CACHE_NAMES.PAGES);

    for (const route of routes) {
        try {
            const response = await fetch(route);
            if (response.ok) {
                await cache.put(route, response);
            }
        } catch (error) {
            console.warn('[SW] Impossible de précharger:', route);
        }
    }
}

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Synchroniser les données en attente
    console.log('[SW] Synchronisation en arrière-plan');
}

console.log('[SW] Service Worker MATHILDA chargé'); 