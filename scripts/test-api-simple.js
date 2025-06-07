#!/usr/bin/env node

/**
 * Script de test API simple pour contourner les problèmes d'architecture Puppeteer/Cypress
 * Teste les fonctionnalités critiques via des appels API directs
 */

const path = require('path');
const fs = require('fs').promises;

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const REPORTS_DIR = path.join(__dirname, '../results');

// Utilisateurs de test
const TEST_USERS = {
  user: {
    email: 'john.smith@test.com',
    password: 'test123'
  },
  admin: {
    email: 'admin@test.com',
    password: 'test123'
  }
};

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class APITester {
  constructor() {
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      tests: []
    };
    this.cookies = {};
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async initialize() {
    // Créer le dossier des rapports
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    this.log('\n🚀 Démarrage des tests API simples', 'bright');
    this.log(`   📌 URL de base: ${BASE_URL}`, 'cyan');
    this.log(`   📌 Messages de progression pour éviter les timeouts\n`, 'cyan');
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.cookies.token && { 'Cookie': `token=${this.cookies.token}` }),
          ...options.headers
        }
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return { response, data };
    } catch (error) {
      throw new Error(`Erreur réseau: ${error.message}`);
    }
  }

  async runTest(name, testFn) {
    this.results.total++;
    const startTime = Date.now();
    const test = {
      name,
      status: 'pending',
      duration: 0,
      error: null
    };

    this.log(`\n📋 Test: ${name}`, 'blue');
    
    try {
      await testFn();
      test.status = 'success';
      this.results.success++;
      this.log(`   ✅ Succès (${Date.now() - startTime}ms)`, 'green');
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      this.results.failed++;
      this.log(`   ❌ Échec: ${error.message}`, 'red');
    }

    test.duration = Date.now() - startTime;
    this.results.tests.push(test);
  }

  async testHealthCheck() {
    await this.runTest('Vérification santé serveur', async () => {
      const { response } = await this.makeRequest('/');
      if (response.status !== 200) {
        throw new Error(`Status ${response.status}`);
      }
    });
  }

  async testLogin(userData, role) {
    await this.runTest(`Connexion ${role}`, async () => {
      const { response, data } = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password
        })
      });

      if (response.status !== 200) {
        throw new Error(`Login échoué: ${response.status} - ${JSON.stringify(data)}`);
      }

      // Extraire le token des cookies
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const tokenMatch = setCookie.match(/token=([^;]+)/);
        if (tokenMatch) {
          this.cookies.token = tokenMatch[1];
          this.log(`   🔑 Token reçu`, 'cyan');
        }
      }

      if (!data.user) {
        throw new Error('Pas de données utilisateur');
      }

      this.log(`   👤 Utilisateur: ${data.user.email}`, 'cyan');
      this.log(`   🎭 Rôle: ${data.user.role}`, 'cyan');
    });
  }

  async testAuthenticatedRoute(route, name) {
    await this.runTest(name, async () => {
      const { response, data } = await this.makeRequest(route);
      
      if (response.status === 401) {
        throw new Error('Non authentifié');
      }
      
      if (response.status !== 200) {
        throw new Error(`Status ${response.status}: ${JSON.stringify(data)}`);
      }
    });
  }

  async testPublicPages() {
    const publicPages = [
      { url: '/', name: 'Page d\'accueil' },
      { url: '/api/health', name: 'API Health Check' }
    ];

    for (const page of publicPages) {
      await this.runTest(`Page publique: ${page.name}`, async () => {
        const { response } = await this.makeRequest(page.url);
        if (response.status !== 200 && response.status !== 404) {
          throw new Error(`Status inattendu: ${response.status}`);
        }
      });
    }
  }

  async testProtectedAPIs() {
    const apis = [
      { url: '/api/auth/me', name: 'Profil utilisateur' },
      { url: '/api/conges', name: 'Liste des congés' },
      { url: '/api/planning', name: 'Planning' }
    ];

    for (const api of apis) {
      await this.testAuthenticatedRoute(api.url, `API protégée: ${api.name}`);
    }
  }

  async generateReport() {
    this.log('\n\n📊 RAPPORT FINAL', 'bright');
    this.log('═══════════════', 'bright');
    
    const successRate = Math.round((this.results.success / this.results.total) * 100);
    
    this.log(`\nTotal: ${this.results.total} tests`, 'cyan');
    this.log(`✅ Réussis: ${this.results.success}`, 'green');
    this.log(`❌ Échoués: ${this.results.failed}`, 'red');
    this.log(`📈 Taux de réussite: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

    if (this.results.failed > 0) {
      this.log('\n\n🔍 Tests échoués:', 'red');
      this.results.tests
        .filter(t => t.status === 'failed')
        .forEach(t => {
          this.log(`   - ${t.name}: ${t.error}`, 'red');
        });
    }

    // Sauvegarder le rapport
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      url: BASE_URL,
      results: this.results,
      summary: {
        successRate: `${successRate}%`,
        totalDuration: this.results.tests.reduce((sum, t) => sum + t.duration, 0)
      }
    };

    const reportPath = path.join(REPORTS_DIR, `api-test-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n📄 Rapport sauvegardé: ${reportPath}`, 'green');
  }

  async run() {
    const startTime = Date.now();
    let progressInterval;

    try {
      await this.initialize();

      // Messages de progression
      progressInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        this.log(`\n💓 Script toujours actif - ${elapsed}s écoulées`, 'magenta');
      }, 30000);

      // Tests publics
      this.log('\n🌐 Tests des pages publiques', 'bright');
      await this.testHealthCheck();
      await this.testPublicPages();

      // Tests pour chaque rôle
      for (const [role, userData] of Object.entries(TEST_USERS)) {
        this.log(`\n\n👤 Tests pour le rôle: ${role.toUpperCase()}`, 'bright');
        
        // Réinitialiser les cookies
        this.cookies = {};
        
        // Connexion
        await this.testLogin(userData, role);
        
        // APIs protégées
        if (this.cookies.token) {
          await this.testProtectedAPIs();
        }
      }

      await this.generateReport();

    } catch (error) {
      this.log(`\n\n❌ Erreur fatale: ${error.message}`, 'red');
      console.error(error);
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      this.log('\n\n🏁 Tests terminés', 'bright');
    }
  }
}

// Lancer les tests
if (require.main === module) {
  const tester = new APITester();
  tester.run().catch(console.error);
}

module.exports = APITester;