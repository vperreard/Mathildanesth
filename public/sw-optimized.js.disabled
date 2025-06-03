// Service Worker optimisé pour performance maximale
// Version: 1.0.0

const CACHE_NAME = 'mathildanesth-v1';
const CACHE_VERSION = '20250529';

// Stratégies de cache
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    CACHE_ONLY: 'cache-only',
    NETWORK_ONLY: 'network-only',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Configuration des ressources à mettre en cache
const CACHE_CONFIG = {
    // Assets statiques - Cache First (performance max)
    static: {
        strategy: CACHE_STRATEGIES.CACHE_FIRST,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 an
        patterns: [
            /\/_next\/static\//,
            /\.(?:js|css|woff|woff2|eot|ttf|otf)$/,
            /\/icons\//,
            /\/images\//,
            /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/
        ]
    },
    
    // Pages - Stale While Revalidate (performance + fraîcheur)
    pages: {
        strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
        maxAge: 24 * 60 * 60 * 1000, // 24h
        patterns: [
            /^https?:\/\/localhost:3000\/$/,
            /^https?:\/\/localhost:3000\/auth/,
            /^https?:\/\/localhost:3000\/tableau-de-bord/,
            /^https?:\/\/localhost:3000\/planning/,
            /^https?:\/\/localhost:3000\/conges/
        ]
    },
    
    // APIs de données statiques - Cache First
    staticApi: {
        strategy: CACHE_STRATEGIES.CACHE_FIRST,
        maxAge: 60 * 60 * 1000, // 1h
        patterns: [
            /\/api\/sectors/,
            /\/api\/sites/,
            /\/api\/specialties/,
            /\/api\/health/
        ]
    },
    
    // APIs dynamiques - Network First
    dynamicApi: {
        strategy: CACHE_STRATEGIES.NETWORK_FIRST,
        maxAge: 5 * 60 * 1000, // 5 minutes
        patterns: [
            /\/api\/auth\/me/,
            /\/api\/planning/,
            /\/api\/conges/,
            /\/api\/utilisateurs/
        ]
    },
    
    // APIs temps réel - Network Only
    realtime: {
        strategy: CACHE_STRATEGIES.NETWORK_ONLY,
        patterns: [
            /\/api\/auth\/login/,
            /\/api\/auth\/logout/,
            /\/api\/notifications\/real-time/,
            /\/api\/websocket/
        ]
    }
};

// Ressources à précharger de manière critique
const CRITICAL_RESOURCES = [
    '/',
    '/auth/connexion',
    '/_next/static/chunks/framework.js',
    '/_next/static/chunks/main.js',
    '/_next/static/css/app.css'
];

// Install Event - Préchargement critique
self.addEventListener('install', (event) => {
    console.log('SW: Installing optimized service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('SW: Precaching critical resources...');
                
                // Précharger les ressources critiques
                const criticalPromises = CRITICAL_RESOURCES.map(async (url) => {
                    try {
                        await cache.add(url);
                        console.log(`SW: Precached ${url}`);
                    } catch (error) {
                        console.warn(`SW: Failed to precache ${url}:`, error);
                    }
                });
                
                await Promise.allSettled(criticalPromises);
                
                // Forcer l'activation immédiate
                self.skipWaiting();
            })
            .catch(error => {
                console.error('SW: Install failed:', error);
            })
    );
});

// Activate Event - Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    console.log('SW: Activating optimized service worker...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                const deletePromises = cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log(`SW: Deleting old cache: ${name}`);
                        return caches.delete(name);
                    });
                
                return Promise.all(deletePromises);
            })
            .then(() => {
                console.log('SW: Old caches cleaned up');
                // Prendre contrôle immédiatement
                return self.clients.claim();
            })
            .catch(error => {
                console.error('SW: Activation failed:', error);
            })
    );
});

// Fetch Event - Stratégies de cache intelligentes
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorer les requêtes non-GET sauf pour offline fallback
    if (request.method !== 'GET') {
        return;
    }
    
    // Ignorer les extensions de navigateur
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return;
    }
    
    // Déterminer la stratégie de cache
    const strategy = determineStrategy(url, request);
    
    if (strategy) {
        event.respondWith(
            handleRequest(request, strategy)
                .catch(error => {
                    console.error('SW: Request failed:', error);
                    return handleOfflineFallback(request);
                })
        );
    }
});

// Déterminer la stratégie de cache selon l'URL
function determineStrategy(url, request) {
    for (const [configName, config] of Object.entries(CACHE_CONFIG)) {
        for (const pattern of config.patterns) {
            if (pattern.test(url.href)) {
                return config;
            }
        }
    }
    
    // Stratégie par défaut pour les ressources locales
    if (url.origin === location.origin) {
        return CACHE_CONFIG.pages;
    }
    
    return null;
}

// Gestionnaire de requêtes selon la stratégie
async function handleRequest(request, strategy) {
    const cache = await caches.open(CACHE_NAME);
    
    switch (strategy.strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return handleCacheFirst(request, cache, strategy);
            
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return handleNetworkFirst(request, cache, strategy);
            
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return handleStaleWhileRevalidate(request, cache, strategy);
            
        case CACHE_STRATEGIES.CACHE_ONLY:
            return cache.match(request);
            
        case CACHE_STRATEGIES.NETWORK_ONLY:
            return fetch(request);
            
        default:
            return fetch(request);
    }
}

// Cache First - Performance maximale
async function handleCacheFirst(request, cache, strategy) {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cloner avant de mettre en cache
            const responseToCache = networkResponse.clone();
            await cache.put(request, responseToCache);
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback vers cache même expiré
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Network First - Données fraîches prioritaires
async function handleNetworkFirst(request, cache, strategy) {
    try {
        const networkResponse = await fetchWithTimeout(request, 3000);
        
        if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            await cache.put(request, responseToCache);
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('SW: Network failed, trying cache:', error);
        
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale While Revalidate - Équilibre performance/fraîcheur
async function handleStaleWhileRevalidate(request, cache, strategy) {
    const cachedResponse = await cache.match(request);
    
    // Promesse de mise à jour en arrière-plan
    const updatePromise = fetch(request)
        .then(response => {
            if (response.ok) {
                const responseToCache = response.clone();
                cache.put(request, responseToCache);
            }
            return response;
        })
        .catch(error => {
            console.warn('SW: Background update failed:', error);
        });
    
    // Retourner immédiatement le cache si disponible
    if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
        // Mise à jour en arrière-plan
        updatePromise;
        return cachedResponse;
    }
    
    // Sinon attendre la réponse réseau
    return updatePromise;
}

// Fetch avec timeout
function fetchWithTimeout(request, timeout = 5000) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), timeout)
        )
    ]);
}

// Vérifier si la réponse est expirée
function isExpired(response, maxAge) {
    if (!maxAge) return false;
    
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return false;
    
    const responseTime = new Date(dateHeader).getTime();
    const now = Date.now();
    
    return (now - responseTime) > maxAge;
}

// Fallback offline
async function handleOfflineFallback(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Essayer de trouver une réponse cachée
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Fallback vers page d'accueil pour navigation
    if (request.mode === 'navigate') {
        const homePage = await cache.match('/');
        if (homePage) {
            return homePage;
        }
    }
    
    // Dernière option : réponse d'erreur personnalisée
    return new Response(
        JSON.stringify({
            error: 'Contenu non disponible hors ligne',
            offline: true,
            timestamp: Date.now()
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        }
    );
}

// Message handler pour communication avec l'app
self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};
    
    switch (type) {
        case 'CACHE_STATS':
            handleCacheStats(event);
            break;
            
        case 'CLEAR_CACHE':
            handleClearCache(event);
            break;
            
        case 'PRELOAD_ROUTE':
            handlePreloadRoute(event, payload);
            break;
            
        default:
            console.warn('SW: Unknown message type:', type);
    }
});

// Statistiques du cache
async function handleCacheStats(event) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        
        const stats = {
            cacheSize: keys.length,
            cacheName: CACHE_NAME,
            version: CACHE_VERSION,
            strategies: Object.keys(CACHE_CONFIG)
        };
        
        event.ports[0]?.postMessage({ type: 'CACHE_STATS_RESPONSE', payload: stats });
    } catch (error) {
        event.ports[0]?.postMessage({ type: 'CACHE_STATS_ERROR', error: error.message });
    }
}

// Vider le cache
async function handleClearCache(event) {
    try {
        await caches.delete(CACHE_NAME);
        console.log('SW: Cache cleared');
        event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' });
    } catch (error) {
        event.ports[0]?.postMessage({ type: 'CACHE_CLEAR_ERROR', error: error.message });
    }
}

// Précharger une route
async function handlePreloadRoute(event, payload) {
    try {
        const { url } = payload;
        const cache = await caches.open(CACHE_NAME);
        
        await cache.add(url);
        console.log(`SW: Preloaded route: ${url}`);
        
        event.ports[0]?.postMessage({ type: 'ROUTE_PRELOADED', url });
    } catch (error) {
        event.ports[0]?.postMessage({ type: 'ROUTE_PRELOAD_ERROR', error: error.message, url: payload.url });
    }
}

console.log('SW: Optimized Service Worker loaded successfully!');