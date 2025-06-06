#!/usr/bin/env node

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';

async function testLoginDetailed() {
  const browser = await puppeteer.launch({
    headless: false, // Afficher le navigateur pour debug
    slowMo: 50,     // Ralentir les actions
    devtools: true   // Ouvrir les devtools
  });

  try {
    const page = await browser.newPage();
    
    // Activer les logs de console
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url()));

    console.log('1. Navigation vers la page de connexion...');
    await page.goto(`${BASE_URL}/auth/connexion`, { waitUntil: 'networkidle2' });
    
    // Prendre une capture d'écran
    await page.screenshot({ path: '/tmp/login-page.png' });
    console.log('   Screenshot: /tmp/login-page.png');

    // Vérifier les sélecteurs
    console.log('2. Recherche des éléments du formulaire...');
    
    const selectors = [
      'input[name="login"]',
      'input[name="password"]',
      'button[type="submit"]',
      'input#login',
      'input#password',
      '[data-testid="login-input"]',
      '[data-testid="password-input"]',
      '[data-testid="submit-button"]'
    ];

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        console.log(`   ✓ Trouvé: ${selector}`);
      }
    }

    // Essayer de remplir le formulaire avec différents sélecteurs
    console.log('3. Tentative de connexion...');
    
    // Méthode 1: Par name
    try {
      await page.type('input[name="login"]', 'admin');
      await page.type('input[name="password"]', 'admin');
      console.log('   ✓ Formulaire rempli (méthode name)');
    } catch (e) {
      console.log('   ✗ Échec méthode name, essai méthode id...');
      await page.type('input#login', 'admin');
      await page.type('input#password', 'admin');
    }

    // Intercepter la requête de login
    page.on('response', response => {
      if (response.url().includes('/api/auth/login')) {
        console.log(`4. Réponse login: ${response.status()} ${response.statusText()}`);
        response.json().then(data => {
          console.log('   Data:', JSON.stringify(data, null, 2));
        }).catch(() => {});
      }
    });

    // Cliquer sur submit
    await page.click('button[type="submit"]');
    
    // Attendre un peu
    await page.waitForTimeout(5000);
    
    // Vérifier l'URL finale
    console.log('5. URL finale:', page.url());
    
    // Capture finale
    await page.screenshot({ path: '/tmp/after-login.png' });
    console.log('   Screenshot: /tmp/after-login.png');

    // Vérifier les cookies
    const cookies = await page.cookies();
    console.log('6. Cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));

  } catch (error) {
    console.error('ERREUR:', error);
  } finally {
    console.log('\nAppuyez sur Ctrl+C pour fermer le navigateur...');
    // Garder le navigateur ouvert pour debug
    await new Promise(() => {});
  }
}

testLoginDetailed();