
// Service Worker temporairement désactivé pour résoudre les problèmes d'authentification
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Laisse passer toutes les requêtes sans interception
  return;
});
