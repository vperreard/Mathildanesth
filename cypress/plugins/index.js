const performanceMonitoring = require('./performance-monitoring');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // Implémenter les tâches personnalisées
  on('task', {
    /**
     * Réinitialise la base de données de test
     * @returns {null}
     */
    resetTestDatabase() {
      console.log('🔄 Réinitialisation de la base de données de test...');
      
      // En mode test, on simule simplement la réinitialisation
      // Dans un environnement réel, on pourrait exécuter des scripts de reset
      if (process.env.NODE_ENV === 'test' || process.env.CYPRESS_TEST_MODE) {
        console.log('✅ Base de données réinitialisée (mode simulation)');
        return null;
      }
      
      // Pour un environnement de test réel, vous pourriez faire quelque chose comme :
      // const { execSync } = require('child_process');
      // execSync('npm run db:reset:test');
      
      return null;
    },

    /**
     * Charge des données de test depuis les fixtures
     * @param {Object} options - Options contenant les fixtures à charger
     * @returns {null}
     */
    seedTestData({ fixtures }) {
      console.log(`🌱 Chargement des fixtures: ${fixtures.join(', ')}`);
      
      // En mode test, on simule le chargement
      fixtures.forEach(fixture => {
        console.log(`  ✅ Fixture '${fixture}' chargée`);
      });
      
      // Dans un environnement réel, vous pourriez :
      // 1. Lire les fichiers de fixtures
      // 2. Insérer les données dans la base de données de test
      // 3. Retourner un statut de succès
      
      return null;
    },

    /**
     * Enregistre les métriques de performance
     * @param {Object} metrics - Métriques à enregistrer
     * @returns {null}
     */
    logPerformance(metrics) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        ...metrics
      };
      
      console.log('📊 Performance:', JSON.stringify(logEntry, null, 2));
      
      // Optionnel : sauvegarder dans un fichier
      const fs = require('fs');
      const path = require('path');
      const logFile = path.join(__dirname, '..', '..', 'cypress', 'performance-logs.json');
      
      try {
        let logs = [];
        if (fs.existsSync(logFile)) {
          const content = fs.readFileSync(logFile, 'utf8');
          logs = JSON.parse(content);
        }
        logs.push(logEntry);
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement des métriques:', error);
      }
      
      return null;
    },

    /**
     * Nettoie les fichiers temporaires de test
     * @returns {null}
     */
    cleanupTestFiles() {
      console.log('🧹 Nettoyage des fichiers temporaires...');
      
      const fs = require('fs');
      const path = require('path');
      const downloadsDir = path.join(__dirname, '..', 'downloads');
      
      try {
        if (fs.existsSync(downloadsDir)) {
          fs.readdirSync(downloadsDir).forEach(file => {
            if (file !== '.gitkeep') {
              fs.unlinkSync(path.join(downloadsDir, file));
              console.log(`  🗑️  Supprimé: ${file}`);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
      }
      
      return null;
    },

    /**
     * Vérifie l'état de l'API
     * @returns {boolean}
     */
    checkApiStatus() {
      console.log('🔍 Vérification de l\'état de l\'API...');
      
      // Simuler une vérification d'API
      const apiUrl = config.baseUrl || 'http://localhost:3000';
      console.log(`  📡 API URL: ${apiUrl}`);
      
      // Dans un environnement réel, vous pourriez faire un appel HTTP
      // pour vérifier que l'API est accessible
      
      return true; // API disponible
    },

    /**
     * Génère un rapport de test
     * @param {Object} results - Résultats des tests
     * @returns {string} - Chemin du rapport généré
     */
    generateTestReport(results) {
      console.log('📝 Génération du rapport de test...');
      
      const fs = require('fs');
      const path = require('path');
      const reportFile = path.join(
        __dirname, 
        '..', 
        '..', 
        'cypress', 
        'reports', 
        `test-report-${Date.now()}.json`
      );
      
      try {
        // Créer le dossier reports s'il n'existe pas
        const reportsDir = path.dirname(reportFile);
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
        console.log(`  ✅ Rapport généré: ${reportFile}`);
        return reportFile;
      } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        return null;
      }
    },

    // Tâches de monitoring de performance avancé
    logAdvancedPerformance: performanceMonitoring.logAdvancedPerformance,
    logRUMMetric: performanceMonitoring.logRUMMetric,
    logRUMSessionSummary: performanceMonitoring.logRUMSessionSummary,
    logAccessibilityViolation: performanceMonitoring.logAccessibilityViolation,
    logMobileTest: performanceMonitoring.logMobileTest,
    logMobilePerformance: performanceMonitoring.logMobilePerformance,
    
    // Génération de rapports automatisés
    generatePerformanceReport: performanceMonitoring.generatePerformanceReport,
    generateRUMReport: performanceMonitoring.generateRUMReport,
    generateAccessibilityReport: performanceMonitoring.generateAccessibilityReport,
    generateMobileTestReport: performanceMonitoring.generateMobileTestReport,
    generateConsolidatedReport: performanceMonitoring.generateConsolidatedReport,
    generateConsolidatedAccessibilityReport: performanceMonitoring.generateConsolidatedAccessibilityReport,
    
    // Export de métriques
    exportPerformanceMetrics: performanceMonitoring.exportPerformanceMetrics
  });

  // Configuration pour le viewport
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.name === 'chrome' && browser.isHeadless) {
      // Désactiver les animations en mode headless pour des tests plus rapides
      launchOptions.args.push('--disable-gpu');
      launchOptions.args.push('--disable-dev-shm-usage');
      launchOptions.args.push('--disable-web-security');
      launchOptions.args.push('--no-sandbox');
    }
    return launchOptions;
  });

  // Configuration de l'environnement
  config.env = {
    ...config.env,
    testMode: 'cypress',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    testApiKey: process.env.TEST_API_KEY || 'test-key-for-cypress'
  };

  return config;
};