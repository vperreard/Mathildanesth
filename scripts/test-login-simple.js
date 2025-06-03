#!/usr/bin/env node

/**
 * Test de connexion simple avec Puppeteer
 * Teste uniquement le formulaire de connexion sans Service Worker
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_LOGIN = process.env.TEST_USER_LOGIN || 'admin';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';

if (!TEST_PASSWORD) {
  console.error('❌ TEST_USER_PASSWORD non défini dans .env.local');
  console.log('Ajoutez dans .env.local:');
  console.log('TEST_USER_LOGIN=admin');
  console.log('TEST_USER_PASSWORD=votre_mot_de_passe');
  process.exit(1);
}

async function testLogin() {
  console.log('🚀 Test de connexion simple');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`👤 Login: ${TEST_LOGIN}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=ServiceWorker'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Bloquer complètement les Service Workers
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('sw.js') || request.url().includes('service-worker')) {
        console.log('🚫 Bloqué:', request.url());
        request.abort();
      } else {
        request.continue();
      }
    });

    // Aller à la page de connexion
    console.log('\n📄 Navigation vers la page de connexion...');
    await page.goto(`${BASE_URL}/auth/connexion`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Attendre que le formulaire soit chargé
    await page.waitForSelector('input[name="login"], input#login', { timeout: 5000 });
    console.log('✅ Page de connexion chargée');

    // Chercher les champs du formulaire principal
    const loginInput = await page.$('main input[name="login"], main input#login, input[name="login"], input#login');
    const passwordInput = await page.$('main input[type="password"]');
    
    if (!loginInput || !passwordInput) {
      throw new Error('Champs de connexion non trouvés');
    }

    // Remplir le formulaire
    console.log('\n📝 Remplissage du formulaire...');
    await loginInput.click({ clickCount: 3 }); // Triple click pour tout sélectionner
    await loginInput.type(TEST_LOGIN);
    
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(TEST_PASSWORD);
    console.log('✅ Formulaire rempli');

    // Chercher et cliquer sur le bouton
    console.log('\n🖱️ Recherche du bouton de connexion...');
    const submitButton = await page.evaluateHandle(() => {
      // Chercher le bouton dans le formulaire principal
      const buttons = Array.from(document.querySelectorAll('button[type="submit"], button'));
      return buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('connecter') && btn.closest('main');
      }) || buttons.find(btn => btn.textContent?.toLowerCase().includes('connecter'));
    });

    if (!submitButton || !submitButton.asElement()) {
      throw new Error('Bouton de connexion non trouvé');
    }

    console.log('✅ Bouton trouvé, clic...');
    
    // Cliquer et attendre la navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      submitButton.asElement().click()
    ]);

    // Vérifier le résultat
    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s
    const currentUrl = page.url();
    
    console.log('\n📊 Résultat:');
    console.log(`   URL actuelle: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ CONNEXION RÉUSSIE! Redirigé vers le dashboard');
      
      // Vérifier le contenu du dashboard
      const userName = await page.$eval('h2', el => el.textContent).catch(() => null);
      if (userName) {
        console.log(`   👤 Utilisateur connecté: ${userName}`);
      }
    } else if (currentUrl.includes('/auth/connexion')) {
      console.log('   ❌ CONNEXION ÉCHOUÉE - Toujours sur la page de login');
      
      // Chercher un message d'erreur
      const errorMessage = await page.evaluate(() => {
        const selectors = [
          '[data-cy="error-message"]',
          '.text-red-700',
          '.error-message',
          '.alert-danger',
          '[role="alert"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            return element.textContent?.trim();
          }
        }
        return null;
      });
      
      if (errorMessage) {
        console.log(`   ⚠️ Message d'erreur: ${errorMessage}`);
      }
    } else {
      console.log(`   ❓ Redirection inattendue vers: ${currentUrl}`);
    }

    // Attendre un peu pour voir le résultat
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n✅ Test terminé');
  }
}

testLogin().catch(console.error);