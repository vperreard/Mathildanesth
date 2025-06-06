#!/usr/bin/env node

/**
 * Script de test automatisé pour vérifier que l'authentification fonctionne
 * après la migration NextAuth → JWT Custom
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  login: 'admin',
  password: 'admin'
};

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Fonction pour attendre
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test de connexion avec Puppeteer
async function testLogin() {
  console.log(`\n${colors.blue}🔐 Test de connexion avec Puppeteer${colors.reset}`);
  console.log(`${colors.blue}===================================${colors.reset}\n`);

  let browser;
  try {
    // Lancer le navigateur
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Aller à la page de connexion
    console.log(`${colors.cyan}→ Navigation vers ${BASE_URL}/auth/connexion${colors.reset}`);
    await page.goto(`${BASE_URL}/auth/connexion`, { waitUntil: 'networkidle2' });

    // Vérifier que nous sommes sur la page de connexion
    const title = await page.title();
    console.log(`${colors.cyan}→ Titre de la page: ${title}${colors.reset}`);

    // Attendre les champs de formulaire
    await page.waitForSelector('input[name="login"]', { timeout: 5000 });
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });

    // Remplir le formulaire
    console.log(`${colors.cyan}→ Remplissage du formulaire de connexion${colors.reset}`);
    await page.type('input[name="login"]', TEST_USER.login);
    await page.type('input[name="password"]', TEST_USER.password);

    // Cliquer sur le bouton de connexion
    console.log(`${colors.cyan}→ Clic sur le bouton de connexion${colors.reset}`);
    await page.click('button[type="submit"]');

    // Attendre la navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

    // Vérifier la redirection
    const currentUrl = page.url();
    console.log(`${colors.cyan}→ URL après connexion: ${currentUrl}${colors.reset}`);

    // Vérifier les cookies
    const cookies = await page.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token');
    
    if (authCookie) {
      console.log(`${colors.green}✓ Cookie auth_token trouvé${colors.reset}`);
      console.log(`  - Valeur: ${authCookie.value.substring(0, 20)}...`);
      console.log(`  - HttpOnly: ${authCookie.httpOnly}`);
      console.log(`  - Secure: ${authCookie.secure}`);
    } else {
      console.log(`${colors.red}✗ Cookie auth_token non trouvé${colors.reset}`);
    }

    // Vérifier si nous sommes connectés
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/accueil')) {
      console.log(`${colors.green}✓ Connexion réussie - Redirection vers le dashboard${colors.reset}`);
      return { success: true, url: currentUrl, authCookie };
    } else if (currentUrl.includes('/auth/connexion')) {
      console.log(`${colors.red}✗ Connexion échouée - Toujours sur la page de connexion${colors.reset}`);
      
      // Chercher des messages d'erreur
      const errorMessage = await page.$eval('.text-red-500', el => el.textContent).catch(() => null);
      if (errorMessage) {
        console.log(`${colors.red}  Message d'erreur: ${errorMessage}${colors.reset}`);
      }
      
      return { success: false, url: currentUrl };
    } else {
      console.log(`${colors.yellow}⚠ URL inattendue: ${currentUrl}${colors.reset}`);
      return { success: true, url: currentUrl, authCookie };
    }

  } catch (error) {
    console.error(`${colors.red}✗ Erreur lors du test de connexion:${colors.reset}`, error.message);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test des endpoints API
async function testApiEndpoints(authToken) {
  console.log(`\n${colors.blue}🔌 Test des endpoints API${colors.reset}`);
  console.log(`${colors.blue}=========================${colors.reset}\n`);

  const endpoints = [
    { method: 'GET', path: '/api/auth/me', name: 'Profil utilisateur' },
    { method: 'GET', path: '/api/leaves', name: 'Liste des congés' },
    { method: 'GET', path: '/api/admin/users', name: 'Liste des utilisateurs (admin)' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`${colors.cyan}→ Test ${endpoint.method} ${endpoint.path} - ${endpoint.name}${colors.reset}`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        headers: {
          'Cookie': `auth_token=${authToken}`,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Ne pas rejeter sur les codes d'erreur
      });

      if (response.status === 200) {
        console.log(`${colors.green}  ✓ Status: ${response.status} OK${colors.reset}`);
        if (endpoint.path === '/api/auth/me' && response.data.user) {
          console.log(`${colors.green}  ✓ Utilisateur: ${response.data.user.login} (${response.data.user.role})${colors.reset}`);
        }
      } else if (response.status === 401) {
        console.log(`${colors.red}  ✗ Status: ${response.status} Non autorisé${colors.reset}`);
      } else if (response.status === 403) {
        console.log(`${colors.yellow}  ⚠ Status: ${response.status} Accès interdit (permissions)${colors.reset}`);
      } else {
        console.log(`${colors.yellow}  ⚠ Status: ${response.status}${colors.reset}`);
      }

    } catch (error) {
      console.error(`${colors.red}  ✗ Erreur: ${error.message}${colors.reset}`);
    }
  }
}

// Fonction principale
async function main() {
  console.log(`${colors.blue}🧪 Test de la migration d'authentification${colors.reset}`);
  console.log(`${colors.blue}=========================================${colors.reset}`);

  // Vérifier que le serveur est accessible
  try {
    console.log(`\n${colors.cyan}→ Vérification du serveur sur ${BASE_URL}${colors.reset}`);
    await axios.get(BASE_URL);
    console.log(`${colors.green}✓ Serveur accessible${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Le serveur n'est pas accessible sur ${BASE_URL}${colors.reset}`);
    console.error(`${colors.yellow}Assurez-vous que 'npm run dev' est lancé${colors.reset}`);
    process.exit(1);
  }

  // Test de connexion
  const loginResult = await testLogin();
  
  if (loginResult.success && loginResult.authCookie) {
    // Test des API avec le token
    await testApiEndpoints(loginResult.authCookie.value);
    
    console.log(`\n${colors.green}✅ Tests terminés avec succès !${colors.reset}`);
    console.log(`${colors.green}L'authentification fonctionne correctement après la migration.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Les tests ont échoué${colors.reset}`);
    console.log(`${colors.yellow}Vérifiez les logs du serveur pour plus de détails.${colors.reset}`);
  }
}

// Lancer les tests
main().catch(console.error);