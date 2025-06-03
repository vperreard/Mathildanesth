#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fonction pour supprimer le timestamp des URLs CSS
function removeTimestampFromCSS() {
  // Créer un script client-side pour nettoyer les URLs CSS
  const clientScript = `
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
`;

  // Sauvegarder le script
  const scriptPath = path.join(__dirname, '..', 'public', 'fix-css-loading.js');
  fs.writeFileSync(scriptPath, clientScript);
  console.log('✅ Script de correction CSS créé:', scriptPath);
}

// Créer un middleware Next.js pour enlever les timestamps
function createMiddlewareFix() {
  const middlewareFix = `
// Ajouter dans src/middleware.ts pour nettoyer les CSS timestamps

export function cleanCSSUrls(request: Request) {
  const url = new URL(request.url);
  
  // Si c'est une requête CSS avec timestamp
  if (url.pathname.includes('.css') && url.search.includes('v=')) {
    // Rediriger sans le timestamp
    url.search = '';
    return Response.redirect(url);
  }
  
  return null;
}
`;
  
  console.log('\n📝 Ajouter ce code dans src/middleware.ts:');
  console.log(middlewareFix);
}

// Vérifier le service worker
function checkServiceWorker() {
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    if (swContent.includes('?v=') || swContent.includes('timestamp')) {
      console.log('\n⚠️  Le service worker ajoute peut-être des timestamps');
      console.log('Vérifier public/sw.js pour les modifications d\'URL');
    }
  }
}

// Exécuter les corrections
console.log('🔧 Analyse et correction du problème CSS/MIME type\n');

removeTimestampFromCSS();
createMiddlewareFix();
checkServiceWorker();

console.log('\n✅ Solutions proposées générées!');