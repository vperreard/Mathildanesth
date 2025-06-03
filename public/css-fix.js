// Fix temporaire pour l'erreur CSS MIME type
(function() {
  // Désactiver temporairement le service worker qui cause le problème
  if ('serviceWorker' in navigator && window.location.hostname === 'localhost') {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
        console.log('Service Worker désactivé temporairement');
      }
    });
  }
  
  // Observer et bloquer les scripts qui tentent de charger des CSS
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT' && node.src && node.src.includes('.css')) {
          console.warn('Blocked CSS loaded as script:', node.src);
          node.remove();
        }
      });
    });
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();