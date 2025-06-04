#!/usr/bin/env node
/**
 * Claude Code Test Workers - Orchestrateur pour instances autonomes
 * Crée des prompts optimisés pour réparer les tests de façon autonome
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

class ClaudeTestOrchestrator {
    constructor() {
        this.workersConfig = {
            // BATCH 1 - CRITIQUE (Parallèle)
            'worker-auth': {
                focus: 'Authentication & Security Tests',
                patterns: ['**/auth/**/*.test.*', '**/hooks/**/useAuth*', '**/lib/auth*'],
                priority: 'CRITICAL',
                estimatedTime: '15-20 min',
                batch: 1
            },
            'worker-leaves-core': {
                focus: 'Leaves Core Services',
                patterns: ['**/leaves/services/**/*.test.*'],
                priority: 'CRITICAL', 
                estimatedTime: '20-25 min',
                batch: 1
            },
            'worker-leaves-hooks': {
                focus: 'Leaves Hooks & Components',
                patterns: ['**/leaves/hooks/**/*.test.*', '**/leaves/components/**/*.test.*'],
                priority: 'CRITICAL',
                estimatedTime: '15-20 min', 
                batch: 1
            },
            'worker-services-core': {
                focus: 'Core Services (Primary)',
                patterns: ['**/services/**/*Service.test.*', '**/services/**/audit*', '**/services/**/logger*'],
                priority: 'CRITICAL',
                estimatedTime: '15-20 min',
                batch: 1
            },
            
            // BATCH 2 - HAUTE (Parallèle après Batch 1)
            'worker-services-business': {
                focus: 'Business Services',
                patterns: ['**/services/**/planning*', '**/services/**/validation*', '**/services/**/business*'],
                priority: 'HIGH',
                estimatedTime: '15-20 min',
                batch: 2
            },
            'worker-components-ui': {
                focus: 'UI Components Core',
                patterns: ['**/components/**/*.test.*', '!**/components/**/bloc*', '!**/components/**/planning*'],
                priority: 'HIGH',
                estimatedTime: '10-15 min',
                batch: 2
            },
            'worker-components-planning': {
                focus: 'Planning Components',
                patterns: ['**/components/**/planning*', '**/components/**/bloc*', '**/components/**/calendar*'],
                priority: 'HIGH',
                estimatedTime: '15-20 min',
                batch: 2
            },
            'worker-hooks-core': {
                focus: 'Core Hooks (Non-Auth)',
                patterns: ['**/hooks/**/*.test.*', '!**/useAuth*', '!**/leaves/**'],
                priority: 'HIGH',
                estimatedTime: '10-15 min',
                batch: 2
            },
            
            // BATCH 3 - MOYENNE (Nettoyage)
            'worker-utils': {
                focus: 'Utils & Helpers',
                patterns: ['**/utils/**/*.test.*', '**/lib/**/*.test.*', '!**/auth/**'],
                priority: 'MEDIUM',
                estimatedTime: '10-15 min',
                batch: 3
            },
            'worker-types': {
                focus: 'Types & Validation',
                patterns: ['**/types/**/*.test.*', '**/validation/**/*.test.*'],
                priority: 'MEDIUM',
                estimatedTime: '5-10 min',
                batch: 3
            },
            'worker-integration': {
                focus: 'Integration & E2E Tests',
                patterns: ['**/integration/**', '**/e2e/**', '**/*.integration.*'],
                priority: 'LOW',
                estimatedTime: '25-30 min',
                batch: 3
            },
            'worker-cleanup': {
                focus: 'Miscellaneous & Edge Cases',
                patterns: ['**/*.test.*'],
                priority: 'LOW',
                estimatedTime: '15-20 min',
                batch: 3,
                isCleanup: true
            }
        };
    }

    analyzeFailingTests() {
        log('🔍 Analyse des tests en échec...', 'blue');
        
        try {
            // Exécuter les tests et capturer les échecs
            const result = execSync('npm test 2>&1', { encoding: 'utf8', timeout: 60000 });
            const parsed = this.parseTestResults(result);
            log(`Debug: Tests succeeded, found ${parsed.totalFailing} failing files`, 'yellow');
            return parsed;
        } catch (error) {
            const output = (error.stdout || '') + (error.stderr || '');
            const parsed = this.parseTestResults(output);
            log(`Debug: Tests failed with exit code, found ${parsed.totalFailing} failing files`, 'yellow');
            return parsed;
        }
    }

    parseTestResults(output) {
        const failingFiles = [];
        const lines = output.split('\n');
        
        // Debug: log lines that contain FAIL
        const failLines = lines.filter(line => line.includes('FAIL'));
        if (failLines.length > 0) {
            log(`Debug: Found ${failLines.length} FAIL lines:`, 'yellow');
            failLines.slice(0, 5).forEach(line => log(`  ${line}`, 'yellow'));
        }
        
        lines.forEach(line => {
            // Détecter les fichiers en échec
            if (line.includes('FAIL ') && line.includes('.test.')) {
                const match = line.match(/FAIL\s+(.+\.test\.[jt]sx?)/);
                if (match) {
                    failingFiles.push(match[1]);
                }
            }
        });

        return {
            totalFailing: failingFiles.length,
            failingFiles,
            rawOutput: output
        };
    }

    categorizeFailures(failingFiles) {
        const categorized = {};
        
        Object.entries(this.workersConfig).forEach(([workerName, config]) => {
            categorized[workerName] = {
                ...config,
                files: []
            };
        });

        failingFiles.forEach(file => {
            let assigned = false;
            
            Object.entries(this.workersConfig).forEach(([workerName, config]) => {
                config.patterns.forEach(pattern => {
                    const isNegative = pattern.startsWith('!');
                    const cleanPattern = isNegative ? pattern.slice(1) : pattern;
                    const regex = new RegExp(cleanPattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                    
                    if (regex.test(file)) {
                        if (!isNegative && !assigned) {
                            categorized[workerName].files.push(file);
                            assigned = true;
                        } else if (isNegative) {
                            // Retirer des fichiers précédemment assignés
                            categorized[workerName].files = categorized[workerName].files.filter(f => f !== file);
                        }
                    }
                });
            });

            // Fichier non catégorisé = worker-services par défaut
            if (!assigned) {
                categorized['worker-services'].files.push(file);
            }
        });

        return categorized;
    }

    generateWorkerPrompts(categorizedFailures) {
        const prompts = {};

        Object.entries(categorizedFailures).forEach(([workerName, config]) => {
            if (config.files.length === 0) return;

            prompts[workerName] = this.createWorkerPrompt(workerName, config);
        });

        return prompts;
    }

    createWorkerPrompt(workerName, config) {
        const priority = config.priority === 'CRITICAL' ? '🚨 CRITIQUE' : 
                        config.priority === 'HIGH' ? '🔥 HAUTE' : 
                        config.priority === 'MEDIUM' ? '⚡ MOYENNE' : '📝 BASSE';

        return `# CLAUDE CODE WORKER: ${workerName.toUpperCase()}

## 🎯 MISSION AUTONOME
**Spécialité**: ${config.focus}
**Priorité**: ${priority}
**Temps estimé**: ${config.estimatedTime}
**Fichiers à réparer**: ${config.files.length}

## 📋 FICHIERS EN ÉCHEC
${config.files.map(file => `- ${file}`).join('\n')}

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic
\`\`\`bash
npm run test:fast -- --testPathPattern="${config.files[0].replace(/\//g, '\\/')}"
\`\`\`

### Étape 2: Analyse des Erreurs
1. **Lire chaque fichier de test en échec**
2. **Identifier les patterns d'erreur**:
   - Import/Export errors
   - Mock configuration issues  
   - Async/await problems
   - TypeScript type errors
   - Test setup/teardown issues

### Étape 3: Réparation Systématique
Pour chaque fichier:
1. **Fixer les imports** (utiliser @/ aliases corrects)
2. **Corriger les mocks** (suivre les patterns dans jest.setup.js)
3. **Réparer les types TypeScript** 
4. **Ajuster les timeouts** si nécessaire
5. **Valider avec test isolation**

### Étape 4: Patterns Spécifiques à ${config.focus}

${this.getSpecificInstructions(workerName)}

### Étape 5: Validation
\`\`\`bash
# Tester le fichier réparé individuellement
npm test -- --testPathPattern="FICHIER_RÉPARÉ"

# Valider avec les autres tests du module  
npm run test:fast -- --testPathPattern="${config.focus.toLowerCase()}"

# Validation finale bulletproof
npm run test:bulletproof
\`\`\`

## 🎯 CRITÈRES DE SUCCÈS
- ✅ Tous les tests passent individuellement
- ✅ Pas de régression sur les autres tests
- ✅ Temps d'exécution < 30 secondes
- ✅ Coverage maintenue
- ✅ TypeScript compile sans erreur

## 🚨 RÈGLES CRITIQUES
- **JAMAIS ignorer un test avec .skip()** sans justification
- **TOUJOURS préserver la logique métier** 
- **UTILISER les mocks existants** dans jest.setup.js
- **RESPECTER les patterns** du projet
- **DOCUMENTER les changements** importants

## 📊 REPORTING
À la fin, créer un rapport:
\`\`\`
WORKER: ${workerName}
STATUS: ✅ SUCCÈS / ❌ ÉCHEC
FICHIERS RÉPARÉS: X/${config.files.length}
TEMPS RÉEL: XX minutes
PROBLÈMES RÉSOLUS:
- Problem 1: Description + Solution
- Problem 2: Description + Solution
PROCHAINES ÉTAPES: [si applicable]
\`\`\`

## 🔄 WORKFLOW AUTONOME
1. Lancer le diagnostic
2. Réparer un fichier à la fois
3. Valider immédiatement
4. Passer au suivant
5. Rapport final

GO! 🚀`;
    }

    getSpecificInstructions(workerName) {
        const instructions = {
            'worker-auth': `
**Patterns Auth/Security**:
- Mock JWT tokens: \`getClientAuthToken.mockReturnValue('valid-token')\`
- Mock axios responses avec types complets
- Vérifier les interceptors axios
- Tester les flux login/logout
- Validation des permissions
`,
            'worker-leaves': `
**Patterns Leaves Module**:
- Mock Prisma avec leave records réalistes
- Utiliser LeaveType, LeaveStatus enums
- Mock leaveService functions
- Tester les calculs de quotas
- Vérifier les dates et périodes
`,
            'worker-services': `
**Patterns Services**:
- Mock les dépendances externes (DB, APIs)
- Utiliser les factory functions
- Tester les error handlers
- Mock les services de notification
- Vérifier les validations business
`,
            'worker-components': `
**Patterns Components**:
- renderWithProviders pour contexts
- Mock les props complexes
- Tester les événements utilisateur
- Vérifier l'accessibilité
- Mock les hooks customs
`,
            'worker-hooks': `
**Patterns Hooks**:
- renderHook avec wrapper approprié
- Mock les dépendances externes
- Tester les cas d'erreur
- Vérifier les cleanups
- Tester les re-renders
`,
            'worker-integration': `
**Patterns Integration**:
- Setup/teardown complets
- Mock des services externes
- Tests de bout en bout
- Vérifier les workflows complets
- Performance et timeouts
`
        };

        return instructions[workerName] || '';
    }

    savePrompts(prompts) {
        const outputDir = './claude-workers-prompts';
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        Object.entries(prompts).forEach(([workerName, prompt]) => {
            const filename = `${workerName}-prompt.md`;
            const filepath = path.join(outputDir, filename);
            fs.writeFileSync(filepath, prompt, 'utf8');
            log(`📝 Prompt sauvé: ${filepath}`, 'green');
        });

        // Créer un index avec toutes les missions
        this.createWorkerIndex(prompts, outputDir);
    }

    createWorkerIndex(prompts, outputDir) {
        const index = `# CLAUDE CODE WORKERS - CENTRE DE COMMANDE

## 🚀 WORKERS DISPONIBLES

${Object.keys(prompts).map((workerName, i) => {
    const config = this.workersConfig[workerName];
    return `### ${i + 1}. ${workerName.toUpperCase()}
- **Focus**: ${config.focus}
- **Priorité**: ${config.priority}
- **Temps**: ${config.estimatedTime}
- **Prompt**: [${workerName}-prompt.md](./${workerName}-prompt.md)`;
}).join('\n\n')}

## 📋 WORKFLOW RECOMMANDÉ

### Parallélisation Optimale
1. **Démarrer en premier**: worker-auth (CRITIQUE)
2. **En parallèle**: worker-leaves + worker-services  
3. **Ensuite**: worker-components + worker-hooks
4. **En dernier**: worker-integration

### Commandes de Suivi
\`\`\`bash
# Surveiller les progrès
npm run test:bulletproof

# Tests par module
npm test -- --testPathPattern="auth"
npm test -- --testPathPattern="leaves" 
npm test -- --testPathPattern="services"

# Validation finale
npm run test:validate
\`\`\`

## 🎯 OBJECTIF GLOBAL
- **100% des tests réparés**
- **< 30 secondes d'exécution**
- **Infrastructure bulletproof**
- **Documentation à jour**

Bon courage aux workers! 🤖⚡`;

        fs.writeFileSync(path.join(outputDir, 'README.md'), index, 'utf8');
        log(`📋 Index créé: ${path.join(outputDir, 'README.md')}`, 'cyan');
    }

    generateMissionSummary(analysis, categorized) {
        log('\n🎯 MISSION CLAUDE WORKERS - RÉSUMÉ INDUSTRIEL', 'magenta');
        log('═══════════════════════════════════════════════', 'magenta');
        
        log(`📊 Tests en échec: ${analysis.totalFailing}`, 'red');
        
        // Organiser par batches
        const batches = {};
        Object.entries(categorized).forEach(([workerName, config]) => {
            if (config.files.length > 0) {
                const batch = config.batch || 1;
                if (!batches[batch]) batches[batch] = [];
                batches[batch].push({workerName, config});
            }
        });

        // Afficher par batches
        Object.keys(batches).sort().forEach(batch => {
            log(`\n🔄 BATCH ${batch} (Parallèle - ${batches[batch].length} workers)`, 'cyan');
            
            batches[batch].forEach(({workerName, config}) => {
                const priority = config.priority === 'CRITICAL' ? '🚨' : 
                               config.priority === 'HIGH' ? '🔥' : 
                               config.priority === 'MEDIUM' ? '⚡' : '📝';
                
                log(`   ${priority} ${workerName}: ${config.files.length} fichiers (${config.estimatedTime})`, 'yellow');
            });
        });

        // Calcul timeline
        const maxTimePerBatch = Math.max(...Object.values(batches).map(batch => 
            Math.max(...batch.map(w => parseInt(w.config.estimatedTime.split('-')[1]) || 20))
        ));
        const totalTime = Object.keys(batches).length * maxTimePerBatch;

        log(`\n⏱️  TIMELINE ESTIMÉE: ${totalTime} minutes (${Math.ceil(totalTime/60)}h) avec parallélisation`, 'green');
        log(`🚀 Prompts générés dans ./claude-workers-prompts/`, 'green');
        log(`📋 Ouvrir README.md pour workflow par batches`, 'blue');
    }

    run() {
        log('🤖 CLAUDE CODE WORKERS - ORCHESTRATEUR', 'cyan');
        log('════════════════════════════════════════════', 'cyan');

        // 1. Analyser les échecs
        const analysis = this.analyzeFailingTests();
        
        if (analysis.totalFailing === 0) {
            log('✅ Aucun test en échec! Infrastructure déjà bulletproof!', 'green');
            return;
        }

        // 2. Catégoriser par worker
        const categorized = this.categorizeFailures(analysis.failingFiles);
        
        // 3. Générer les prompts
        const prompts = this.generateWorkerPrompts(categorized);
        
        // 4. Sauvegarder
        this.savePrompts(prompts);
        
        // 5. Résumé
        this.generateMissionSummary(analysis, categorized);
    }
}

// Exécution
if (require.main === module) {
    const orchestrator = new ClaudeTestOrchestrator();
    orchestrator.run();
}

module.exports = ClaudeTestOrchestrator;