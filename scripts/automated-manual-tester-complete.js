#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Tests Manuels Automatisés Complets - Mathildanesth
 *
 * Ce script navigue automatiquement dans l'application comme un utilisateur réel
 * et capture toutes les erreurs, problèmes de performance et d'accessibilité.
 *
 * Couverture cible : 100% des parcours utilisateur critiques
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '../results/screenshots');
const REPORTS_DIR = path.join(__dirname, '../results');

// Données de test
const TEST_USERS = {
  admin: { email: 'admin@hospital.com', password: 'Admin123!' },
  user: { email: 'user.test@hospital.com', password: 'User123!' },
  mar: { email: 'mar.test@hospital.com', password: 'Mar123!' },
  iade: { email: 'iade.test@hospital.com', password: 'Iade123!' },
};

// Classe principale pour les tests
class AutomatedManualTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalParcours: 0,
      parcoursReussis: 0,
      parcoursEchoues: 0,
      erreurs: [],
      avertissements: [],
      metriquesPerformance: [],
      couverture: {
        pages: new Set(),
        fonctionnalites: new Set(),
        formulaires: new Set(),
        apis: new Set(),
      },
      details: [],
    };
  }

  async initialize() {
    // Créer les répertoires nécessaires
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    await fs.mkdir(REPORTS_DIR, { recursive: true });

    // Lancer le navigateur
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
    });

    this.page = await this.browser.newPage();

    // Capturer les erreurs console
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.erreurs.push({
          type: 'console',
          message: msg.text(),
          url: this.page.url(),
          timestamp: new Date(),
        });
      } else if (msg.type() === 'warning') {
        this.results.avertissements.push({
          type: 'console',
          message: msg.text(),
          url: this.page.url(),
          timestamp: new Date(),
        });
      }
    });

    // Capturer les erreurs de page
    this.page.on('pageerror', error => {
      this.results.erreurs.push({
        type: 'page',
        message: error.message,
        stack: error.stack,
        url: this.page.url(),
        timestamp: new Date(),
      });
    });

    // Capturer les requêtes échouées
    this.page.on('requestfailed', request => {
      this.results.erreurs.push({
        type: 'network',
        url: request.url(),
        method: request.method(),
        errorText: request.failure()?.errorText,
        timestamp: new Date(),
      });
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  async mesurePerformance(name, fn) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      await fn();

      const endTime = Date.now();
      const endMemory = process.memoryUsage();

      this.results.metriquesPerformance.push({
        name,
        duree: endTime - startTime,
        memoireUtilisee: endMemory.heapUsed - startMemory.heapUsed,
        timestamp: new Date(),
      });
    } catch (error) {
      throw error;
    }
  }

  async testParcours(nom, testFn) {
    console.log(`\n🧪 Test: ${nom}`);
    this.results.totalParcours++;

    const parcoursResult = {
      nom,
      statut: 'success',
      duree: 0,
      erreurs: [],
      screenshots: [],
      etapes: [],
    };

    const startTime = Date.now();

    try {
      await testFn(parcoursResult);
      parcoursResult.statut = 'success';
      this.results.parcoursReussis++;
      console.log(`✅ ${nom} - Réussi`);
    } catch (error) {
      parcoursResult.statut = 'failed';
      parcoursResult.erreurs.push(error.message);
      this.results.parcoursEchoues++;
      console.log(`❌ ${nom} - Échoué: ${error.message}`);

      // Prendre une capture d'écran en cas d'erreur
      try {
        const screenshot = await this.takeScreenshot(`error-${nom.replace(/\s+/g, '-')}`);
        parcoursResult.screenshots.push(screenshot);
      } catch (screenshotError) {
        console.error("Impossible de prendre une capture d'écran:", screenshotError);
      }
    }

    parcoursResult.duree = Date.now() - startTime;
    this.results.details.push(parcoursResult);
  }

  // ========== PARCOURS UTILISATEUR ==========

  async testConnexion(userData, role) {
    await this.testParcours(`Connexion - ${role}`, async result => {
      await this.page.goto(`${BASE_URL}/auth/login`);
      this.results.couverture.pages.add('/auth/login');

      result.etapes.push('Navigation vers la page de connexion');

      // Attendre et remplir le formulaire
      await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await this.page.type('input[type="email"]', userData.email);
      await this.page.type('input[type="password"]', userData.password);

      result.etapes.push('Formulaire rempli');
      this.results.couverture.formulaires.add('login');

      // Se connecter
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);

      result.etapes.push('Connexion réussie');
      this.results.couverture.fonctionnalites.add('authentification');

      // Vérifier la redirection
      const currentUrl = this.page.url();
      if (currentUrl.includes('login')) {
        throw new Error('Échec de la connexion - toujours sur la page de login');
      }

      result.screenshots.push(await this.takeScreenshot(`connected-${role}`));
    });
  }

  async testCreationConges() {
    await this.testParcours('Création demande de congés', async result => {
      // Navigation vers les congés
      await this.page.goto(`${BASE_URL}/conges`);
      this.results.couverture.pages.add('/conges');

      result.etapes.push('Navigation vers la page des congés');

      // Cliquer sur nouveau congé
      await this.page.waitForSelector('button:has-text("Nouvelle demande")', { timeout: 5000 });
      await this.page.click('button:has-text("Nouvelle demande")');

      result.etapes.push('Modal de création ouvert');
      this.results.couverture.fonctionnalites.add('creation-conges');

      // Remplir le formulaire
      await this.page.waitForSelector('form', { timeout: 5000 });

      // Sélectionner le type de congé
      await this.page.select('select[name="type"]', 'CONGES_ANNUELS');

      // Dates
      await this.page.type('input[name="dateDebut"]', '2025-07-01');
      await this.page.type('input[name="dateFin"]', '2025-07-15');

      // Motif
      await this.page.type('textarea[name="motif"]', "Vacances d'été - Test automatisé");

      result.etapes.push('Formulaire de congé rempli');
      this.results.couverture.formulaires.add('creation-conges');

      // Soumettre
      await this.page.click('button[type="submit"]');

      // Attendre la confirmation
      await this.page.waitForSelector('[role="alert"]', { timeout: 5000 });

      result.etapes.push('Demande de congé créée avec succès');
      result.screenshots.push(await this.takeScreenshot('conges-created'));
    });
  }

  async testConsultationPlanning() {
    await this.testParcours('Consultation planning', async result => {
      // Navigation vers le planning
      await this.page.goto(`${BASE_URL}/planning`);
      this.results.couverture.pages.add('/planning');

      result.etapes.push('Navigation vers le planning');

      // Attendre le chargement du planning
      await this.page.waitForSelector('[data-testid="planning-calendar"]', { timeout: 10000 });

      result.etapes.push('Planning chargé');
      this.results.couverture.fonctionnalites.add('consultation-planning');

      // Tester la navigation mensuelle
      await this.page.click('button[aria-label="Mois suivant"]');
      await this.page.waitForTimeout(1000);

      result.etapes.push('Navigation mensuelle testée');

      // Tester le changement de vue
      if (await this.page.$('button:has-text("Semaine")')) {
        await this.page.click('button:has-text("Semaine")');
        await this.page.waitForTimeout(1000);
        result.etapes.push('Vue semaine testée');
      }

      result.screenshots.push(await this.takeScreenshot('planning-view'));
    });
  }

  async testBlocOperatoire() {
    await this.testParcours('Bloc opératoire', async result => {
      await this.page.goto(`${BASE_URL}/bloc-operatoire`);
      this.results.couverture.pages.add('/bloc-operatoire');

      result.etapes.push('Navigation vers le bloc opératoire');

      // Attendre le chargement
      await this.page.waitForSelector('[data-testid="bloc-planning"]', { timeout: 10000 });

      result.etapes.push('Planning bloc opératoire chargé');
      this.results.couverture.fonctionnalites.add('bloc-operatoire');

      // Tester le drag & drop si disponible
      const draggableElement = await this.page.$('[draggable="true"]');
      if (draggableElement) {
        const dropZone = await this.page.$('[data-testid="drop-zone"]');
        if (dropZone) {
          await draggableElement.dragAndDrop(dropZone);
          result.etapes.push('Drag & drop testé');
          this.results.couverture.fonctionnalites.add('drag-drop-planning');
        }
      }

      result.screenshots.push(await this.takeScreenshot('bloc-operatoire'));
    });
  }

  async testGestionUtilisateurs() {
    await this.testParcours('Gestion utilisateurs (Admin)', async result => {
      await this.page.goto(`${BASE_URL}/admin/utilisateurs`);
      this.results.couverture.pages.add('/admin/utilisateurs');

      result.etapes.push('Navigation vers la gestion des utilisateurs');

      // Attendre la liste des utilisateurs
      await this.page.waitForSelector('[data-testid="users-list"]', { timeout: 5000 });

      result.etapes.push('Liste des utilisateurs chargée');
      this.results.couverture.fonctionnalites.add('gestion-utilisateurs');

      // Tester la recherche
      const searchInput = await this.page.$('input[placeholder*="Rechercher"]');
      if (searchInput) {
        await searchInput.type('test');
        await this.page.waitForTimeout(1000);
        result.etapes.push("Recherche d'utilisateur testée");
        this.results.couverture.fonctionnalites.add('recherche-utilisateurs');
      }

      // Tester les filtres
      const filterButton = await this.page.$('button:has-text("Filtres")');
      if (filterButton) {
        await filterButton.click();
        await this.page.waitForTimeout(500);
        result.etapes.push('Filtres testés');
      }

      result.screenshots.push(await this.takeScreenshot('admin-users'));
    });
  }

  async testNotifications() {
    await this.testParcours('Système de notifications', async result => {
      // Vérifier la présence de l'icône de notifications
      const notifIcon = await this.page.$('[data-testid="notifications-icon"]');
      if (!notifIcon) {
        throw new Error('Icône de notifications non trouvée');
      }

      await notifIcon.click();
      result.etapes.push('Menu notifications ouvert');
      this.results.couverture.fonctionnalites.add('notifications');

      // Attendre le chargement des notifications
      await this.page.waitForSelector('[data-testid="notifications-list"]', { timeout: 5000 });

      result.etapes.push('Liste des notifications chargée');

      // Marquer comme lues si possible
      const markReadButton = await this.page.$('button:has-text("Marquer comme lues")');
      if (markReadButton) {
        await markReadButton.click();
        result.etapes.push('Notifications marquées comme lues');
        this.results.couverture.fonctionnalites.add('mark-notifications-read');
      }

      result.screenshots.push(await this.takeScreenshot('notifications'));
    });
  }

  async testExportDonnees() {
    await this.testParcours('Export de données', async result => {
      await this.page.goto(`${BASE_URL}/admin/export`);
      this.results.couverture.pages.add('/admin/export');

      result.etapes.push("Navigation vers la page d'export");

      // Sélectionner le type d'export
      await this.page.waitForSelector('select[name="exportType"]', { timeout: 5000 });
      await this.page.select('select[name="exportType"]', 'planning');

      result.etapes.push("Type d'export sélectionné");
      this.results.couverture.fonctionnalites.add('export-donnees');

      // Configurer la période
      await this.page.type('input[name="dateDebut"]', '2025-01-01');
      await this.page.type('input[name="dateFin"]', '2025-12-31');

      result.etapes.push('Période configurée');

      // Lancer l'export (sans télécharger réellement)
      const exportButton = await this.page.$('button:has-text("Exporter")');
      if (exportButton) {
        // Ne pas cliquer pour éviter le téléchargement en test
        result.etapes.push('Bouton export disponible');
        this.results.couverture.formulaires.add('export-configuration');
      }

      result.screenshots.push(await this.takeScreenshot('export-config'));
    });
  }

  async testStatistiques() {
    await this.testParcours('Consultation statistiques', async result => {
      await this.page.goto(`${BASE_URL}/admin/statistiques`);
      this.results.couverture.pages.add('/admin/statistiques');

      result.etapes.push('Navigation vers les statistiques');

      // Attendre le chargement des graphiques
      await this.page.waitForSelector('[data-testid="stats-dashboard"]', { timeout: 10000 });

      result.etapes.push('Dashboard statistiques chargé');
      this.results.couverture.fonctionnalites.add('statistiques');

      // Tester les filtres de période
      const periodSelector = await this.page.$('select[name="period"]');
      if (periodSelector) {
        await periodSelector.select('month');
        await this.page.waitForTimeout(1000);
        result.etapes.push('Filtre période testé');
        this.results.couverture.fonctionnalites.add('filtres-statistiques');
      }

      result.screenshots.push(await this.takeScreenshot('statistics'));
    });
  }

  async testPerformanceGlobale() {
    await this.testParcours('Tests de performance', async result => {
      // Test de performance sur la page d'accueil
      await this.mesurePerformance('Chargement page accueil', async () => {
        await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      });

      // Test de performance sur le planning
      await this.mesurePerformance('Chargement planning', async () => {
        await this.page.goto(`${BASE_URL}/planning`, { waitUntil: 'networkidle0' });
      });

      // Analyser les métriques
      const metrics = await this.page.metrics();
      result.etapes.push({
        description: 'Métriques collectées',
        metrics: {
          jsHeapUsed: Math.round(metrics.JSHeapUsedSize / 1024 / 1024) + ' MB',
          nodes: metrics.Nodes,
          listeners: metrics.JSEventListeners,
        },
      });

      this.results.couverture.fonctionnalites.add('performance-monitoring');
    });
  }

  async testAccessibilite() {
    await this.testParcours("Tests d'accessibilité", async result => {
      // Test de navigation au clavier
      await this.page.goto(BASE_URL);

      // Tester la navigation avec Tab
      await this.page.keyboard.press('Tab');
      await this.page.keyboard.press('Tab');
      await this.page.keyboard.press('Tab');

      const focusedElement = await this.page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      result.etapes.push(`Navigation clavier - Élément focus: ${focusedElement}`);
      this.results.couverture.fonctionnalites.add('keyboard-navigation');

      // Vérifier les attributs ARIA
      const ariaLabels = await this.page.evaluate(() => {
        return Array.from(document.querySelectorAll('[aria-label]')).length;
      });

      result.etapes.push(`${ariaLabels} éléments avec aria-label trouvés`);

      if (ariaLabels < 10) {
        this.results.avertissements.push({
          type: 'accessibility',
          message: "Peu d'éléments avec aria-label détectés",
          count: ariaLabels,
        });
      }

      this.results.couverture.fonctionnalites.add('accessibility-check');
    });
  }

  async testMobile() {
    await this.testParcours('Tests responsive mobile', async result => {
      // Configurer viewport mobile
      await this.page.setViewport({ width: 375, height: 667 });

      await this.page.goto(BASE_URL);
      result.etapes.push('Vue mobile configurée');

      // Vérifier le menu burger
      const burgerMenu = await this.page.$('[data-testid="mobile-menu"]');
      if (burgerMenu) {
        await burgerMenu.click();
        result.etapes.push('Menu mobile testé');
        this.results.couverture.fonctionnalites.add('responsive-mobile');
      }

      // Tester le scroll
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      result.etapes.push('Scroll mobile testé');

      result.screenshots.push(await this.takeScreenshot('mobile-view'));

      // Restaurer viewport desktop
      await this.page.setViewport({ width: 1920, height: 1080 });
    });
  }

  async testDeconnexion() {
    await this.testParcours('Déconnexion', async result => {
      // Trouver et cliquer sur le bouton de déconnexion
      const logoutButton = await this.page.$('button:has-text("Déconnexion")');
      if (!logoutButton) {
        // Essayer via le menu utilisateur
        const userMenu = await this.page.$('[data-testid="user-menu"]');
        if (userMenu) {
          await userMenu.click();
          await this.page.waitForTimeout(500);
          await this.page.click('button:has-text("Déconnexion")');
        }
      } else {
        await logoutButton.click();
      }

      result.etapes.push('Déconnexion initiée');

      // Attendre la redirection
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });

      const currentUrl = this.page.url();
      if (!currentUrl.includes('login')) {
        throw new Error('Échec de la déconnexion - pas redirigé vers login');
      }

      result.etapes.push('Déconnexion réussie');
      this.results.couverture.fonctionnalites.add('deconnexion');
    });
  }

  // ========== EXECUTION PRINCIPALE ==========

  async run() {
    console.log('🚀 Démarrage des tests manuels automatisés complets\n');

    try {
      await this.initialize();

      // Tests pour chaque rôle
      for (const [role, userData] of Object.entries(TEST_USERS)) {
        console.log(`\n📋 Tests pour le rôle: ${role.toUpperCase()}`);

        // Connexion
        await this.testConnexion(userData, role);

        // Tests communs à tous les rôles
        await this.testConsultationPlanning();
        await this.testNotifications();
        await this.testMobile();
        await this.testAccessibilite();

        // Tests spécifiques par rôle
        if (role === 'admin') {
          await this.testGestionUtilisateurs();
          await this.testStatistiques();
          await this.testExportDonnees();
        }

        if (role === 'user' || role === 'mar' || role === 'iade') {
          await this.testCreationConges();
        }

        if (role === 'mar' || role === 'iade') {
          await this.testBlocOperatoire();
        }

        // Tests de performance (une fois seulement)
        if (role === 'admin') {
          await this.testPerformanceGlobale();
        }

        // Déconnexion
        await this.testDeconnexion();
      }

      // Calculer les résultats finaux
      this.results.endTime = new Date();
      this.results.dureeTotal = this.results.endTime - this.results.startTime;

      // Générer le rapport
      await this.genererRapport();
    } catch (error) {
      console.error('❌ Erreur fatale:', error);
      this.results.erreurs.push({
        type: 'fatal',
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
      });
    } finally {
      await this.cleanup();
    }
  }

  async genererRapport() {
    const rapport = {
      ...this.results,
      resume: {
        tauxReussite: Math.round((this.results.parcoursReussis / this.results.totalParcours) * 100),
        nombreErreurs: this.results.erreurs.length,
        nombreAvertissements: this.results.avertissements.length,
        couverture: {
          pages: this.results.couverture.pages.size,
          fonctionnalites: this.results.couverture.fonctionnalites.size,
          formulaires: this.results.couverture.formulaires.size,
          apis: this.results.couverture.apis.size,
        },
        performanceMoyenne: this.calculerPerformanceMoyenne(),
      },
    };

    // Sauvegarder le rapport JSON
    const jsonPath = path.join(REPORTS_DIR, `manual-test-report-${Date.now()}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(rapport, null, 2));

    // Générer un rapport Markdown
    const markdown = this.genererRapportMarkdown(rapport);
    const mdPath = path.join(REPORTS_DIR, `manual-test-summary-${Date.now()}.md`);
    await fs.writeFile(mdPath, markdown);

    console.log(`\n📊 Rapports générés:`);
    console.log(`   - JSON: ${jsonPath}`);
    console.log(`   - Markdown: ${mdPath}`);

    // Afficher le résumé
    console.log('\n📈 RÉSUMÉ DES TESTS:');
    console.log(`   - Taux de réussite: ${rapport.resume.tauxReussite}%`);
    console.log(`   - Parcours testés: ${this.results.totalParcours}`);
    console.log(`   - Réussis: ${this.results.parcoursReussis}`);
    console.log(`   - Échoués: ${this.results.parcoursEchoues}`);
    console.log(`   - Erreurs trouvées: ${rapport.resume.nombreErreurs}`);
    console.log(`   - Couverture pages: ${rapport.resume.couverture.pages}`);
    console.log(`   - Couverture fonctionnalités: ${rapport.resume.couverture.fonctionnalites}`);
  }

  calculerPerformanceMoyenne() {
    if (this.results.metriquesPerformance.length === 0) return 0;
    const total = this.results.metriquesPerformance.reduce((acc, m) => acc + m.duree, 0);
    return Math.round(total / this.results.metriquesPerformance.length);
  }

  genererRapportMarkdown(rapport) {
    return `# Rapport de Tests Manuels Automatisés

## 📊 Résumé Exécutif

- **Date d'exécution**: ${rapport.startTime}
- **Durée totale**: ${Math.round(rapport.dureeTotal / 1000)}s
- **Taux de réussite**: ${rapport.resume.tauxReussite}%
- **Parcours testés**: ${rapport.totalParcours}
- **Réussis**: ${rapport.parcoursReussis}
- **Échoués**: ${rapport.parcoursEchoues}

## 📈 Couverture

- **Pages visitées**: ${rapport.resume.couverture.pages}
- **Fonctionnalités testées**: ${rapport.resume.couverture.fonctionnalites}
- **Formulaires testés**: ${rapport.resume.couverture.formulaires}
- **APIs appelées**: ${rapport.resume.couverture.apis}

## ⚠️ Problèmes Détectés

### Erreurs (${rapport.resume.nombreErreurs})
${rapport.erreurs.map(e => `- **${e.type}**: ${e.message} (${e.url || 'N/A'})`).join('\n')}

### Avertissements (${rapport.resume.nombreAvertissements})
${rapport.avertissements.map(a => `- ${a.message}`).join('\n')}

## 🎯 Détails des Parcours

${rapport.details
  .map(
    d => `
### ${d.nom}
- **Statut**: ${d.statut === 'success' ? '✅ Réussi' : '❌ Échoué'}
- **Durée**: ${d.duree}ms
- **Étapes**: ${d.etapes.length}
${d.erreurs.length > 0 ? `- **Erreurs**: ${d.erreurs.join(', ')}` : ''}
`
  )
  .join('\n')}

## 🚀 Performance

- **Performance moyenne**: ${rapport.resume.performanceMoyenne}ms
${rapport.metriquesPerformance.map(m => `- ${m.name}: ${m.duree}ms`).join('\n')}

## 📸 Captures d'écran

${rapport.details
  .flatMap(d => d.screenshots)
  .map(s => `- ${s}`)
  .join('\n')}
`;
  }
}

// Lancer les tests
if (require.main === module) {
  const tester = new AutomatedManualTester();
  tester.run().catch(console.error);
}

module.exports = AutomatedManualTester;
