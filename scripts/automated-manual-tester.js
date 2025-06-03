#!/usr/bin/env node

/**
 * Navigation Automatique pour Tests Manuels
 * 
 * Ce script navigue dans l'application de manière automatique
 * pour identifier les erreurs runtime sans modifier le code.
 * 
 * IMPORTANT: Script READ-ONLY - Aucune action destructrice
 */

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS === 'true';
const SLOW_MO = parseInt(process.env.SLOW_MO || '100'); // Ralentir pour voir les actions

// Stockage des erreurs
const errors = [];
const warnings = [];
const networksErrors = [];

// Helper pour attendre (remplace waitForTimeout déprécié)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parcours critiques à tester (phase 1 : sans connexion)
const CRITICAL_PATHS_NO_AUTH = [
  {
    name: 'Page d\'accueil',
    path: '/',
    actions: async (page) => {
      // Vérifier que la page charge
      await wait(2000);
      // Vérifier présence éléments clés
      const hasLoginButton = await page.$('[data-cy="login-button"], a[href*="/auth/login"], a[href*="/auth/connexion"]');
      if (hasLoginButton) {
        console.log('   ✓ Bouton de connexion trouvé');
      }
    }
  },
  {
    name: 'Page de connexion',
    path: '/auth/connexion',
    actions: async (page) => {
      // Vérifier présence formulaire
      await wait(1000);
      const hasForm = await page.$('form');
      const hasLoginField = await page.$('input[name="login"], input#login');
      const hasPasswordField = await page.$('input[type="password"]');
      
      if (hasForm && hasLoginField && hasPasswordField) {
        console.log('   ✓ Formulaire de connexion complet');
      } else {
        console.log('   ⚠ Formulaire incomplet');
      }
    }
  },
  {
    name: 'Planning (non connecté)',
    path: '/planning',
    actions: async (page) => {
      // Devrait rediriger vers login
      await wait(2000);
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/connexion') || currentUrl.includes('/auth/login')) {
        console.log('   ✓ Redirection sécurisée vers login');
      } else {
        console.log('   ⚠ Page accessible sans auth?');
      }
    }
  },
  {
    name: 'Congés (non connecté)',
    path: '/conges',
    actions: async (page) => {
      await wait(2000);
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/connexion') || currentUrl.includes('/auth/login')) {
        console.log('   ✓ Redirection sécurisée vers login');
      }
    }
  },
  {
    name: 'Admin (non connecté)',
    path: '/admin',
    actions: async (page) => {
      await wait(2000);
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/connexion') || currentUrl.includes('/auth/login')) {
        console.log('   ✓ Redirection sécurisée vers login');
      }
    }
  },
  {
    name: 'API Health Check',
    path: '/api/health',
    actions: async (page) => {
      await wait(1000);
      // Vérifier si l'API répond
      const content = await page.content();
      if (content.includes('ok') || content.includes('healthy')) {
        console.log('   ✓ API répond correctement');
      }
    }
  }
];

// Configuration pour test avec connexion (optionnel)
const TEST_USER = {
  login: process.env.TEST_USER_LOGIN || 'admin',
  password: process.env.TEST_USER_PASSWORD || 'password123'
};

// Parcours avec connexion (désactivé par défaut)
const AUTHENTICATED_PATHS = [
  {
    name: 'Connexion utilisateur test',
    path: '/auth/connexion',
    actions: async (page) => {
      console.log('   🔐 Tentative connexion avec utilisateur test');
      console.log(`   📝 Login: ${TEST_USER.login || 'NON DÉFINI'}`);
      console.log(`   📝 Password: ${TEST_USER.password ? '***' : 'NON DÉFINI'}`);
      
      if (!TEST_USER.login || !TEST_USER.password) {
        console.log('   ⚠️ Identifiants de test non définis dans .env.local');
        console.log('   💡 Ajoutez TEST_USER_LOGIN et TEST_USER_PASSWORD dans .env.local');
        return;
      }
      
      try {
        // Remplir le formulaire de connexion PRINCIPAL (pas celui du header)
        const mainLoginField = await page.$('main input[name="login"], #login');
        const mainPasswordField = await page.$('main input[type="password"], #password');
        
        if (mainLoginField && mainPasswordField) {
          await mainLoginField.type(TEST_USER.login);
          await mainPasswordField.type(TEST_USER.password);
          
          // Cliquer sur le bouton "Se connecter" du formulaire principal
          // Chercher spécifiquement le bouton dans le main ou avec le texte "Se connecter"
          const submitButton = await page.evaluateHandle(() => {
            // Trouver tous les boutons
            const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
            // Filtrer pour trouver celui avec "Se connecter" dans le contenu principal
            return buttons.find(btn => 
              btn.textContent.includes('Se connecter') && 
              btn.closest('main') !== null
            ) || buttons.find(btn => btn.textContent.includes('Se connecter'));
          });
          
          if (submitButton && submitButton.asElement) {
            console.log('   ✓ Bouton "Se connecter" trouvé, clic...');
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
              submitButton.asElement().click()
            ]);
            
            // Vérifier si connecté
            await wait(2000); // Attendre un peu
            const currentUrl = page.url();
            if (!currentUrl.includes('/auth/connexion')) {
              console.log('   ✓ Connexion réussie! Redirigé vers:', currentUrl);
              
              // Si redirection vers une page 404, aller au dashboard
              const is404 = await page.$('h1:contains("404"), .error-404, *:contains("Page non trouvée")').catch(() => null);
              if (is404 || currentUrl.includes('tableau-de-bord')) {
                console.log('   📍 Redirection vers /dashboard...');
                await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
              }
            } else {
              console.log('   ❌ Connexion échouée, toujours sur la page de login');
              // Vérifier s'il y a un message d'erreur
              const errorMsg = await page.$eval('[data-cy="error-message"], .text-red-700, .error-message, .alert-danger', el => el.textContent).catch(() => null);
              if (errorMsg) {
                console.log('   Message d\'erreur:', errorMsg);
              }
            }
          } else {
            console.log('   ⚠ Bouton "Se connecter" non trouvé');
          }
        } else {
          console.log('   ⚠ Champs du formulaire principal non trouvés');
        }
      } catch (error) {
        console.log('   ❌ Erreur lors de la connexion:', error.message);
      }
    }
  },
  {
    name: 'Planning (connecté)',
    path: '/planning',
    requiresAuth: true,
    actions: async (page) => {
      await wait(2000);
      const hasCalendar = await page.$('.calendar, [data-cy="planning-calendar"]');
      if (hasCalendar) {
        console.log('   ✓ Calendrier planning affiché');
      }
    }
  },
  {
    name: 'Mes congés',
    path: '/conges',
    requiresAuth: true,
    actions: async (page) => {
      await wait(2000);
      const hasLeavesList = await page.$('[data-cy="leaves-list"], .leaves-container, h1');
      if (hasLeavesList) {
        console.log('   ✓ Page des congés affichée');
      }
    }
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    requiresAuth: true,
    actions: async (page) => {
      await wait(2000);
      const hasDashboard = await page.$('[data-cy="dashboard"], .dashboard-container, h1');
      if (hasDashboard) {
        console.log('   ✓ Dashboard affiché');
      }
    }
  }
];

async function testPath(browser, pathConfig) {
  const page = await browser.newPage();
  const pathErrors = [];
  const pathWarnings = [];
  const pathNetworkErrors = [];

  // Injecter le script de nettoyage SW sur chaque page
  await page.evaluateOnNewDocument(() => {
    // Bloquer l'enregistrement de Service Worker
    if ('serviceWorker' in navigator) {
      Object.defineProperty(navigator, 'serviceWorker', {
        get: () => ({
          register: () => Promise.reject(new Error('SW blocked')),
          getRegistrations: () => Promise.resolve([])
        })
      });
    }
    
    // Intercepter et corriger les CSS mal chargés
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT' && node.src && node.src.includes('.css')) {
            const cleanUrl = node.src.split('?')[0];
            console.log(`[SW-BLOCKER] Fixing CSS: ${node.src}`);
            node.remove();
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cleanUrl;
            document.head.appendChild(link);
          }
        });
      });
    });
    
    // Observer dès que le DOM est prêt
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  });

  // Intercepter les erreurs console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      pathErrors.push({
        path: pathConfig.path,
        message: text,
        timestamp: new Date().toISOString()
      });
    } else if (type === 'warning') {
      pathWarnings.push({
        path: pathConfig.path,
        message: text,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Intercepter les erreurs de page
  page.on('pageerror', error => {
    pathErrors.push({
      path: pathConfig.path,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Intercepter les erreurs réseau
  page.on('requestfailed', request => {
    pathNetworkErrors.push({
      path: pathConfig.path,
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log(`\n📍 Test: ${pathConfig.name} (${pathConfig.path})`);
    
    // Navigation
    const response = await page.goto(`${BASE_URL}${pathConfig.path}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log(`   Status: ${response.status()}`);

    // Exécuter les actions spécifiques
    if (pathConfig.actions) {
      await pathConfig.actions(page);
    }

    // Capture d'écran si erreur
    if (pathErrors.length > 0) {
      const screenshotPath = `tests/e2e/screenshots/error-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Screenshot sauvegardée: ${screenshotPath}`);
    }

  } catch (error) {
    console.error(`   ❌ Erreur lors du test: ${error.message}`);
    pathErrors.push({
      path: pathConfig.path,
      message: `Navigation error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  } finally {
    await page.close();
  }

  // Ajouter aux erreurs globales
  errors.push(...pathErrors);
  warnings.push(...pathWarnings);
  networksErrors.push(...pathNetworkErrors);

  // Résumé pour ce path
  console.log(`   Erreurs: ${pathErrors.length}`);
  console.log(`   Warnings: ${pathWarnings.length}`);
  console.log(`   Erreurs réseau: ${pathNetworkErrors.length}`);
}

async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalNetworkErrors: networksErrors.length,
      pathsTested: CRITICAL_PATHS_NO_AUTH.length + AUTHENTICATED_PATHS.length
    },
    errors,
    warnings,
    networksErrors
  };

  // Sauvegarder le rapport
  const reportPath = path.join('results', 'manual-test-report.json');
  await fs.mkdir('results', { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // Générer un résumé markdown
  const summaryPath = path.join('results', 'manual-test-summary.md');
  const summary = `# Rapport de Test Manuel Automatisé

## 📅 Date: ${new Date().toLocaleString('fr-FR')}

## 📊 Résumé
- **Erreurs totales**: ${errors.length}
- **Warnings totaux**: ${warnings.length}
- **Erreurs réseau**: ${networksErrors.length}
- **Parcours testés**: ${CRITICAL_PATHS_NO_AUTH.length + AUTHENTICATED_PATHS.length}

## ❌ Erreurs Critiques
${errors.slice(0, 10).map(e => `- **${e.path}**: ${e.message}`).join('\n') || 'Aucune erreur critique'}

## ⚠️ Warnings Principaux
${warnings.slice(0, 5).map(w => `- **${w.path}**: ${w.message}`).join('\n') || 'Aucun warning'}

## 🌐 Erreurs Réseau
${networksErrors.slice(0, 5).map(n => `- **${n.path}**: ${n.url} - ${n.failure?.errorText}`).join('\n') || 'Aucune erreur réseau'}

## 🎯 Prochaines Actions
1. Corriger les erreurs critiques en priorité
2. Investiguer les erreurs réseau
3. Réduire les warnings console

---
*Rapport généré automatiquement - Ne modifie aucun code source*
`;

  await fs.writeFile(summaryPath, summary);

  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
  console.log(`📄 Résumé sauvegardé: ${summaryPath}`);
}

async function main() {
  console.log('🤖 Démarrage du Test Manuel Automatisé');
  console.log(`📍 URL de base: ${BASE_URL}`);
  console.log(`👁️  Mode: ${HEADLESS ? 'Headless' : 'Visible'}`);
  console.log('');

  // D'abord nettoyer le service worker
  console.log('🧹 Nettoyage du Service Worker...');
  const cleanupBrowser = await puppeteer.launch({ headless: true });
  const cleanupPage = await cleanupBrowser.newPage();
  await cleanupPage.goto(`${BASE_URL}/unregister-sw.html`);
  await wait(2000);
  await cleanupPage.close();
  await cleanupBrowser.close();
  console.log('✅ Service Worker nettoyé\n');

  // Vérifier que le serveur est accessible
  try {
    const testBrowser = await puppeteer.launch();
    const testPage = await testBrowser.newPage();
    await testPage.goto(BASE_URL, { timeout: 10000 });
    await testPage.close();
    await testBrowser.close();
  } catch (error) {
    console.error('❌ Le serveur n\'est pas accessible. Lancez "npm run dev" d\'abord.');
    process.exit(1);
  }

  // Lancer le navigateur principal
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    slowMo: SLOW_MO,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Phase 1 : Tester sans connexion
    console.log('\n=== PHASE 1: TESTS SANS CONNEXION ===\n');
    for (const pathConfig of CRITICAL_PATHS_NO_AUTH) {
      await testPath(browser, pathConfig);
    }
    
    // Phase 2 : Tester avec connexion
    console.log('\n=== PHASE 2: TESTS AVEC CONNEXION ===\n');
    
    // D'abord se connecter
    const loginPath = AUTHENTICATED_PATHS.find(p => p.name.includes('Connexion'));
    if (loginPath) {
      await testPath(browser, loginPath);
      
      // Si connexion réussie, tester les autres parcours authentifiés
      const authenticatedPaths = AUTHENTICATED_PATHS.filter(p => p.requiresAuth);
      for (const pathConfig of authenticatedPaths) {
        await testPath(browser, pathConfig);
      }
    }

    // Générer le rapport
    await generateReport();

    // Résumé final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(50));
    console.log(`✅ Parcours testés: ${CRITICAL_PATHS_NO_AUTH.length + AUTHENTICATED_PATHS.length}`);
    console.log(`❌ Erreurs totales: ${errors.length}`);
    console.log(`⚠️  Warnings totaux: ${warnings.length}`);
    console.log(`🌐 Erreurs réseau: ${networksErrors.length}`);

    // Code de sortie basé sur les erreurs
    process.exit(errors.length > 0 ? 1 : 0);

  } finally {
    await browser.close();
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});

// Lancer le script
main().catch(console.error);