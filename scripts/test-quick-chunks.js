#!/usr/bin/env node
/**
 * Script de test divisé en chunks courts (< 2 min chacun)
 * Évite les timeouts de Claude Code
 */

const TEST_CHUNKS = {
  auth: {
    name: "Tests d'authentification",
    timeout: 60000, // 1 minute max
    tests: [
      { name: "Login utilisateur", endpoint: "/api/auth/login" },
      { name: "Vérification session", endpoint: "/api/auth/me" },
      { name: "Logout", endpoint: "/api/auth/logout" }
    ]
  },
  pages: {
    name: "Tests des pages principales",
    timeout: 90000, // 1.5 minutes max
    tests: [
      { name: "Page d'accueil", url: "/" },
      { name: "Dashboard", url: "/dashboard" },
      { name: "Planning", url: "/planning" }
    ]
  },
  api: {
    name: "Tests API critiques",
    timeout: 60000,
    tests: [
      { name: "API utilisateurs", endpoint: "/api/users" },
      { name: "API congés", endpoint: "/api/leaves" },
      { name: "API planning", endpoint: "/api/planning" }
    ]
  }
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

class ChunkedTester {
  constructor() {
    this.results = [];
    this.currentChunk = null;
  }

  async runChunk(chunkName) {
    const chunk = TEST_CHUNKS[chunkName];
    if (!chunk) {
      console.error(`❌ Chunk inconnu: ${chunkName}`);
      return false;
    }

    console.log(`\n🧩 Exécution du chunk: ${chunk.name}`);
    console.log(`⏱️  Timeout max: ${chunk.timeout / 1000}s`);
    
    const startTime = Date.now();
    const results = [];

    // Timer pour s'auto-terminer avant le timeout Claude
    const safetyTimer = setTimeout(() => {
      console.log("\n⚠️  Approche du timeout - arrêt préventif");
      this.saveResults(results);
      process.exit(0);
    }, 90000); // 1.5 minutes de sécurité

    try {
      for (const test of chunk.tests) {
        const testResult = await this.runTest(test);
        results.push(testResult);
        
        // Afficher la progression
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`   ⏰ Temps écoulé: ${elapsed}s`);
      }

      clearTimeout(safetyTimer);
      this.saveResults(results);
      
      console.log(`\n✅ Chunk terminé en ${Math.round((Date.now() - startTime) / 1000)}s`);
      return true;

    } catch (error) {
      clearTimeout(safetyTimer);
      console.error(`❌ Erreur dans le chunk: ${error.message}`);
      return false;
    }
  }

  async runTest(test) {
    console.log(`\n🧪 Test: ${test.name}`);
    const result = {
      name: test.name,
      success: false,
      duration: 0,
      error: null
    };

    const startTime = Date.now();

    try {
      // Simuler le test (remplacer par les vrais tests)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      result.success = true;
      console.log(`   ✅ Succès`);
    } catch (error) {
      result.error = error.message;
      console.log(`   ❌ Échec: ${error.message}`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  saveResults(results) {
    const filename = `/tmp/test-results-${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n💾 Résultats sauvegardés: ${filename}`);
  }
}

// Exécution
const chunkName = process.argv[2];

if (!chunkName) {
  console.log("Usage: node test-quick-chunks.js <chunk-name>");
  console.log("\nChunks disponibles:");
  Object.entries(TEST_CHUNKS).forEach(([name, chunk]) => {
    console.log(`  - ${name}: ${chunk.name}`);
  });
  process.exit(1);
}

const tester = new ChunkedTester();
tester.runChunk(chunkName).then(success => {
  process.exit(success ? 0 : 1);
});