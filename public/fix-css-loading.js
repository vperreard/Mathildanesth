
// Script pour corriger le chargement des CSS avec timestamp
(function() {
  // Observer les mutations du DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Si c'est un script qui charge un CSS
        if (node.tagName === 'SCRIPT' && node.src && node.src.includes('.css')) {
          console.warn('Blocking CSS loaded as script:', node.src);
          node.remove();
          
          // Créer un link correct à la place
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = node.src.split('?')[0]; // Enlever le query param
          document.head.appendChild(link);
        }
      });
    });
  });

  // Observer le head et le body
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Nettoyer les scripts CSS existants
  document.querySelectorAll('script[src*=".css"]').forEach(script => {
    console.warn('Removing CSS script:', script.src);
    script.remove();
  });
})();
