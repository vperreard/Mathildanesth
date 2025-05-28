// Service Worker Médical Avancé - Mathildanesth PWA v3
// Cache intelligent + Sync hors ligne + Notifications médicales

const CACHE_NAME = 'mathildanesth-medical-v3';
const STATIC_CACHE = 'mathildanesth-static-v3';
const DYNAMIC_CACHE = 'mathildanesth-dynamic-v3';
const API_CACHE = 'mathildanesth-api-v3';
const OFFLINE_QUEUE = 'mathildanesth-offline-v3';

// Ressources statiques pour PWA médicale
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  // Pages médicales critiques hors ligne
  '/planning',
  '/conges',
  '/bloc-operatoire',
  '/notifications',
  '/profil',
  '/admin/command-center',
  '/admin/urgences'
];

// Patterns API médicales prioritaires
const CRITICAL_API_PATTERNS = [
  /^\/api\/planning\/.*/,
  /^\/api\/conges\/.*/,
  /^\/api\/auth\/me$/,
  /^\/api\/mon-planning\/.*/,
  /^\/api\/bloc-operatoire\/.*/,
  /^\/api\/notifications\/.*/,
  /^\/api\/admin\/urgences\/.*/
];

// Patterns routes médicales
const MEDICAL_ROUTE_PATTERNS = [
  /^\/planning\/.*/,
  /^\/conges\/.*/,
  /^\/bloc-operatoire\/.*/,
  /^\/admin\/.*/
];

// Stratégies de cache médical
const CACHE_STRATEGIES = {
  static: 24 * 60 * 60 * 1000,    // 24h - Assets statiques
  planning: 30 * 60 * 1000,       // 30min - Données planning
  medical: 10 * 60 * 1000,        // 10min - Données médicales critiques
  user: 5 * 60 * 1000,            // 5min - Données utilisateur
  emergency: 60 * 1000            // 1min - Données urgence
};

// Queue pour synchronisation différée
let offlineQueue = [];

// Support notifications push médicales
const MEDICAL_NOTIFICATION_TYPES = {
  EMERGENCY_REPLACEMENT: 'Remplacement Urgence',
  SCHEDULE_CONFLICT: 'Conflit Planning',
  LEAVE_APPROVAL: 'Validation Congé',
  SHIFT_REMINDER: 'Rappel Garde',
  SYSTEM_ALERT: 'Alerte Système'
};

self.addEventListener('install', function(event) {
  console.log('[SW] Installation démarrée - Version médicale');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache) {
        console.log('[SW] Cache statique ouvert');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { 
            cache: 'reload',
            credentials: 'same-origin'
          });
        }));
      })
      .then(() => {
        console.log('[SW] Toutes les ressources statiques sont cachées');
        // Force l'activation immédiate
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Erreur lors du cache des ressources statiques:', error);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activation démarrée');
  
  event.waitUntil(
    Promise.all([
      // Nettoie les anciens caches
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[SW] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prend le contrôle de tous les clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('[SW] Activation terminée - Service Worker actif');
    })
  );
});

self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignore les requêtes non-GET et les WebSockets
  if (request.method !== 'GET' || url.protocol.startsWith('ws')) {
    return;
  }
  
  // Stratégie de cache selon le type de ressource
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isApiRequest(request)) {
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isDynamicContent(request)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Fonction helper: détermine si c'est un asset statique
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
}

// Fonction helper: détermine si c'est une requête API
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Fonction helper: détermine si c'est du contenu dynamique
function isDynamicContent(request) {
  const url = new URL(request.url);
  return DYNAMIC_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Stratégie: Cache d'abord (pour les assets statiques)
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_DURATIONS.static)) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Erreur cacheFirst:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Ressource non disponible hors ligne', { status: 503 });
  }
}

// Stratégie: Réseau d'abord (pour les APIs)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && isApiRequest(request)) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Fallback au cache pour:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si c'est une page, retourne la page offline
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Stratégie: Stale While Revalidate (pour le contenu dynamique)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  
  // Retourne le cache immédiatement si disponible, sinon attend le réseau
  return cachedResponse || networkResponsePromise;
}

// Vérifie si une réponse cache est expirée
function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;
  
  const cacheDate = new Date(dateHeader).getTime();
  const now = Date.now();
  
  return (now - cacheDate) > maxAge;
}

// Gestion des notifications push médicales
self.addEventListener('push', function(event) {
  console.log('[SW] Notification push reçue');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle notification médicale',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: data.tag || 'medical-notification',
      requireInteraction: data.urgent || false,
      actions: [
        {
          action: 'view',
          title: 'Voir',
          icon: '/icons/icon-96x96.png'
        },
        {
          action: 'dismiss',
          title: 'Ignorer'
        }
      ],
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      }
    };
    
    // Couleur et icône selon le type
    if (data.type === 'guard') {
      options.badge = '🚨';
      options.requireInteraction = true;
    } else if (data.type === 'oncall') {
      options.badge = '🔔';
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Mathildanesth', options)
    );
  } catch (error) {
    console.error('[SW] Erreur traitement notification push:', error);
  }
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Clic sur notification:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Cherche une fenêtre déjà ouverte
        for (let client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Ouvre une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', function(event) {
  console.log('[SW] Synchronisation:', event.tag);
  
  if (event.tag === 'planning-sync') {
    event.waitUntil(syncPlanning());
  } else if (event.tag === 'leaves-sync') {
    event.waitUntil(syncLeaves());
  }
});

// Fonction de synchronisation du planning
async function syncPlanning() {
  try {
    console.log('[SW] Synchronisation planning en cours...');
    
    // Récupère les données de planning mises à jour
    const response = await fetch('http://localhost:3000/api/planning/sync', {
      method: 'GET',
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/planning/current', response.clone());
      console.log('[SW] Planning synchronisé');
      
      // Notifie les clients de la mise à jour
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PLANNING_UPDATED',
          timestamp: Date.now()
        });
      });
    }
  } catch (error) {
    console.error('[SW] Erreur synchronisation planning:', error);
  }
}

// Fonction de synchronisation des congés
async function syncLeaves() {
  try {
    console.log('[SW] Synchronisation congés en cours...');
    
    const response = await fetch('http://localhost:3000/api/leaves/sync', {
      method: 'GET', 
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/leaves/current', response.clone());
      console.log('[SW] Congés synchronisés');
    }
  } catch (error) {
    console.error('[SW] Erreur synchronisation congés:', error);
  }
}

// Nettoyage périodique du cache
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(cleanupCaches());
  }
});

async function cleanupCaches() {
  try {
    const cacheNames = [API_CACHE, DYNAMIC_CACHE];
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response && isExpired(response, CACHE_DURATIONS.api)) {
          await cache.delete(request);
        }
      }
    }
    
    console.log('[SW] Nettoyage des caches terminé');
  } catch (error) {
    console.error('[SW] Erreur nettoyage caches:', error);
  }
}

console.log('[SW] Service Worker médical chargé - Version v2');