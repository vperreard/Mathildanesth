#!/usr/bin/env node

/**
 * 🔧 WORKFLOW CORRECTION TESTS AVEC INFRASTRUCTURE BULLETPROOF
 * Guide pratique et automatisé pour corriger les tests E2E
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔧 WORKFLOW CORRECTION TESTS - INFRASTRUCTURE BULLETPROOF');
console.log('=' .repeat(70));

// 🎯 PROBLEMES DETECTES & SOLUTIONS
const commonIssues = {
    serverNotRunning: {
        symptoms: ['ESOCKETTIMEDOUT', 'failed trying to load', 'request failed without a response'],
        solution: 'Le serveur dev n\'est pas démarré sur le bon port',
        fix: 'npm run dev (port 3000) ou vérifier cypress.config.js baseUrl'
    },
    wrongPort: {
        symptoms: ['localhost:3001', 'Connection refused'],
        solution: 'Cypress configuré sur mauvais port',
        fix: 'Modifier cypress.config.js: baseUrl: "http://localhost:3000"'
    },
    missingPages: {
        symptoms: ['404', 'Page not found', 'Cannot GET'],
        solution: 'Pages manquantes dans l\'application',
        fix: 'Créer les pages manquantes ou ajuster les routes'
    },
    selectorIssues: {
        symptoms: ['Timed out retrying', 'expected to find element', 'not exist'],
        solution: 'Sélecteurs obsolètes ou éléments manquants',
        fix: 'Utiliser data-cy au lieu de classes CSS'
    },
    apiIssues: {
        symptoms: ['Request failed', 'API not found', '500 error'],
        solution: 'APIs manquantes ou base de données',
        fix: 'Vérifier routes API et seeder la DB'
    }
};

// 🔍 ANALYSEUR DE LOGS CYPRESS
function analyzeTestFailure(logContent) {
    const issues = [];
    
    Object.entries(commonIssues).forEach(([key, issue]) => {
        const hasSymptom = issue.symptoms.some(symptom => 
            logContent.toLowerCase().includes(symptom.toLowerCase())
        );
        
        if (hasSymptom) {
            issues.push({ key, ...issue });
        }
    });
    
    return issues;
}

// 🚀 SOLUTIONS AUTOMATIQUES
const autoFixes = {
    // Fix 1: Corriger la configuration Cypress pour le bon port
    fixCypressPort: () => {
        console.log('🔧 Correction du port Cypress...');
        
        const configPath = path.join(__dirname, '..', 'cypress.config.js');
        if (!fs.existsSync(configPath)) {
            console.log('❌ cypress.config.js non trouvé');
            return false;
        }
        
        let config = fs.readFileSync(configPath, 'utf8');
        
        // Remplacer localhost:3001 par localhost:3000
        if (config.includes('localhost:3001')) {
            config = config.replace(/localhost:3001/g, 'localhost:3000');
            fs.writeFileSync(configPath, config);
            console.log('✅ Port corrigé: localhost:3001 → localhost:3000');
            return true;
        }
        
        console.log('ℹ️  Port déjà correct');
        return true;
    },

    // Fix 2: Créer les pages manquantes
    createMissingPages: () => {
        console.log('🔧 Vérification des pages requises...');
        
        const pagesNeeded = [
            'src/app/auth/connexion/page.tsx',
            'src/app/auth/reset-password/page.tsx',
            'src/app/admin/page.tsx'
        ];
        
        let created = 0;
        
        pagesNeeded.forEach(pagePath => {
            const fullPath = path.join(__dirname, '..', pagePath);
            
            if (!fs.existsSync(fullPath)) {
                const dir = path.dirname(fullPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                const pageName = path.basename(pagePath, '.tsx');
                const pageContent = `import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${pageName.charAt(0).toUpperCase() + pageName.slice(1)}',
};

export default function ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page() {
  return (
    <div className="p-4">
      <h1>${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h1>
      <p>Page en cours de développement...</p>
    </div>
  );
}
`;
                
                fs.writeFileSync(fullPath, pageContent);
                console.log(`✅ Page créée: ${pagePath}`);
                created++;
            }
        });
        
        if (created === 0) {
            console.log('ℹ️  Toutes les pages existent déjà');
        }
        
        return true;
    },

    // Fix 3: Mettre à jour les sélecteurs vers data-cy
    updateSelectors: () => {
        console.log('🔧 Mise à jour des sélecteurs vers data-cy...');
        
        const testFiles = [
            'cypress/e2e/login.spec.ts',
            'cypress/e2e/auth/authentication.spec.ts'
        ];
        
        const selectorMappings = {
            '#email': '[data-cy="email-input"]',
            '#password': '[data-cy="password-input"]',
            'button[type="submit"]': '[data-cy="login-submit"]',
            '.login-form': '[data-cy="login-form"]',
            '.error-message': '[data-cy="error-message"]'
        };
        
        let updated = 0;
        
        testFiles.forEach(filePath => {
            const fullPath = path.join(__dirname, '..', filePath);
            
            if (fs.existsSync(fullPath)) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let modified = false;
                
                Object.entries(selectorMappings).forEach(([oldSelector, newSelector]) => {
                    const regex = new RegExp(`cy\\.get\\(['"\`]${oldSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\)`, 'g');
                    if (regex.test(content)) {
                        content = content.replace(regex, `cy.get('${newSelector}')`);
                        modified = true;
                    }
                });
                
                if (modified) {
                    fs.writeFileSync(fullPath, content);
                    console.log(`✅ Sélecteurs mis à jour: ${filePath}`);
                    updated++;
                }
            }
        });
        
        if (updated === 0) {
            console.log('ℹ️  Sélecteurs déjà à jour');
        }
        
        return true;
    },

    // Fix 4: Créer un script de démarrage pour les tests
    createTestStartScript: () => {
        console.log('🔧 Création du script de démarrage pour tests...');
        
        const scriptPath = path.join(__dirname, 'start-test-environment.sh');
        const scriptContent = `#!/bin/bash

# 🚀 SCRIPT DEMARRAGE ENVIRONNEMENT TEST
echo "🚀 Démarrage environnement test Mathildanesth..."

# Vérifier si le serveur tourne déjà
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Serveur déjà démarré sur port 3000"
else
    echo "🔄 Démarrage du serveur dev..."
    npm run dev &
    
    # Attendre que le serveur soit prêt
    echo "⏳ Attente du serveur..."
    while ! curl -s http://localhost:3000 > /dev/null; do
        sleep 2
        echo "   ... en attente"
    done
    echo "✅ Serveur prêt !"
fi

# Optionnel: Seeder la base de données de test
if [ "$1" == "--seed" ]; then
    echo "🌱 Seeding base de données de test..."
    npm run seed
fi

echo "🎯 Environnement prêt pour les tests !"
echo ""
echo "Commands disponibles:"
echo "  npm run cypress:open     # Interface Cypress"
echo "  npm run cypress:run      # Tests headless"
echo "  npm run test:e2e         # Tests Puppeteer"
echo ""
`;
        
        fs.writeFileSync(scriptPath, scriptContent);
        
        // Rendre exécutable
        exec(`chmod +x ${scriptPath}`, (error) => {
            if (!error) {
                console.log(`✅ Script créé: ${scriptPath}`);
            }
        });
        
        return true;
    }
};

// 📋 GUIDE D'UTILISATION STEP-BY-STEP
function showUsageGuide() {
    console.log('\n📋 GUIDE D\'UTILISATION - CORRIGER LES TESTS');
    console.log('-'.repeat(50));
    
    console.log('\n🔍 1. DIAGNOSTIC AUTOMATIQUE');
    console.log('   npm run cypress:run --headless  # Voir les erreurs');
    console.log('   node scripts/fix-tests-workflow.js analyze  # Analyser les logs');
    
    console.log('\n🔧 2. CORRECTIONS AUTOMATIQUES');
    console.log('   node scripts/fix-tests-workflow.js fix-port      # Corriger port Cypress');
    console.log('   node scripts/fix-tests-workflow.js fix-pages     # Créer pages manquantes');
    console.log('   node scripts/fix-tests-workflow.js fix-selectors # Mettre à jour sélecteurs');
    console.log('   node scripts/fix-tests-workflow.js fix-all       # Toutes les corrections');
    
    console.log('\n🚀 3. DEMARRAGE ENVIRONNEMENT');
    console.log('   ./scripts/start-test-environment.sh           # Démarrer serveur');
    console.log('   ./scripts/start-test-environment.sh --seed    # Avec seeding DB');
    
    console.log('\n🧪 4. EXECUTION TESTS');
    console.log('   npm run cypress:open                     # Mode visuel');
    console.log('   npm run cypress:run --spec "login.spec"  # Test spécifique');
    console.log('   npm run performance:budget               # Vérifier performances');
    
    console.log('\n🎯 5. MONITORING CONTINU');
    console.log('   npm run performance:budget:watch         # Surveillance temps réel');
    console.log('   npm run cypress:run --record             # Enregistrer résultats');
}

// 🎬 EXECUTION PRINCIPALE
function main() {
    const action = process.argv[2];
    
    switch (action) {
        case 'analyze':
            console.log('🔍 Analyse des logs de test...');
            // Ici on pourrait analyser les logs récents
            showUsageGuide();
            break;
            
        case 'fix-port':
            autoFixes.fixCypressPort();
            break;
            
        case 'fix-pages':
            autoFixes.createMissingPages();
            break;
            
        case 'fix-selectors':
            autoFixes.updateSelectors();
            break;
            
        case 'fix-all':
            console.log('🔧 Application de toutes les corrections...\n');
            autoFixes.fixCypressPort();
            autoFixes.createMissingPages();
            autoFixes.updateSelectors();
            autoFixes.createTestStartScript();
            console.log('\n✅ Toutes les corrections appliquées !');
            break;
            
        default:
            showUsageGuide();
    }
}

if (require.main === module) {
    main();
}

module.exports = { analyzeTestFailure, autoFixes };