import puppeteer from 'puppeteer';

async function testLogin() {
  console.log('🚀 Démarrage du test de connexion avec Puppeteer...\n');

  const browser = await puppeteer.launch({
    headless: false, // Pour voir ce qui se passe
    devtools: true,  // Ouvre les DevTools automatiquement
    args: ['--disable-blink-features=AutomationControlled']
  });

  try {
    const page = await browser.newPage();
    
    // Activer les logs de la console
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
    });

    // Capturer les erreurs
    page.on('pageerror', error => {
      console.error('[BROWSER ERROR]', error.message);
    });

    // Intercepter les requêtes réseau
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`[NETWORK] ${request.method()} ${request.url()}`);
      }
    });

    // Intercepter les réponses réseau
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`[NETWORK] Response ${response.status()} ${response.url()}`);
      }
    });

    console.log('📍 Navigation vers la page de connexion...');
    await page.goto('http://localhost:3000/auth/connexion', {
      waitUntil: 'networkidle2'
    });

    // Attendre un peu pour que React s'initialise
    await page.waitForTimeout(2000);

    // Vérifier si le formulaire est présent
    console.log('🔍 Recherche du formulaire de connexion...');
    const formExists = await page.$('#login') !== null;
    
    if (!formExists) {
      console.log('❌ Formulaire de connexion non trouvé');
      
      // Prendre une capture d'écran
      await page.screenshot({ path: 'login-page-error.png', fullPage: true });
      console.log('📸 Capture d\'écran sauvegardée : login-page-error.png');
      
      // Afficher le HTML de la page
      const html = await page.content();
      console.log('\n📄 HTML de la page (extrait) :');
      console.log(html.substring(0, 1000) + '...');
      
      return;
    }

    console.log('✅ Formulaire trouvé, remplissage des champs...');

    // Remplir le formulaire
    await page.type('#login', 'test.user');
    await page.type('#password', 'Test123!');

    // Prendre une capture avant soumission
    await page.screenshot({ path: 'login-form-filled.png' });
    console.log('📸 Formulaire rempli : login-form-filled.png');

    // Soumettre le formulaire
    console.log('📤 Soumission du formulaire...');
    
    // Capturer la réponse de l'API
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login'),
      { timeout: 10000 }
    );

    // Cliquer sur le bouton de connexion
    await page.click('button[type="submit"]');

    try {
      const response = await responsePromise;
      console.log(`\n📥 Réponse API reçue : ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Connexion réussie !');
        console.log('Données reçues :', JSON.stringify(data, null, 2));
        
        // Attendre la redirection
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('🔄 Redirigé vers :', page.url());
        
        // Capture de la page après connexion
        await page.screenshot({ path: 'after-login.png', fullPage: true });
        console.log('📸 Page après connexion : after-login.png');
      } else {
        console.log('❌ Échec de la connexion');
        const text = await response.text();
        console.log('Réponse :', text);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'attente de la réponse :', error);
      
      // Vérifier s'il y a un message d'erreur affiché
      const errorMessage = await page.$eval('[data-testid="login-error-message"]', el => el.textContent).catch(() => null);
      if (errorMessage) {
        console.log('Message d\'erreur affiché :', errorMessage);
      }
    }

    // Attendre un peu avant de fermer
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Erreur générale :', error);
  } finally {
    console.log('\n🏁 Test terminé. Fermeture du navigateur dans 5 secondes...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

// Désactiver le service worker avant le test
async function disableServiceWorker() {
  console.log('🔧 Désactivation du Service Worker...\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Désactiver le service worker
  await page.evaluateOnNewDocument(() => {
    delete navigator.serviceWorker;
  });
  
  // Désenregistrer tous les service workers existants
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  });
  
  await browser.close();
  console.log('✅ Service Worker désactivé\n');
}

// Exécuter les tests
async function runTests() {
  await disableServiceWorker();
  await testLogin();
}

runTests().catch(console.error);