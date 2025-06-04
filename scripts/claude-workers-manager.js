#!/usr/bin/env node

/**
 * CLAUDE WORKERS MANAGER V2.0
 * 
 * Système de gestion automatisé des workers Claude Code:
 * - Génération automatique de prompts en batch
 * - Auto-destruction des prompts exécutés
 * - Priorisation intelligente
 * - Tracking des performances
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ClaudeWorkersManager {
    constructor() {
        this.workersDir = path.join(__dirname, '../claude-workers-prompts');
        this.activePrompts = new Map();
        this.completedWork = new Map();
        this.performance = {
            startTime: Date.now(),
            totalWorkers: 0,
            completedWorkers: 0,
            failedWorkers: 0
        };
        
        this.init();
    }

    init() {
        console.log('🚀 CLAUDE WORKERS MANAGER V2.0 - INITIALISATION');
        this.ensureWorkersDirectory();
        this.scanExistingPrompts();
        this.generateNewPrompts();
    }

    ensureWorkersDirectory() {
        if (!fs.existsSync(this.workersDir)) {
            fs.mkdirSync(this.workersDir, { recursive: true });
            console.log('📁 Répertoire workers créé:', this.workersDir);
        }
    }

    scanExistingPrompts() {
        const files = fs.readdirSync(this.workersDir)
            .filter(f => f.endsWith('-prompt.md') && f !== 'README.md');
        
        console.log(`📋 ${files.length} prompts existants trouvés`);
        files.forEach(file => {
            const workerId = file.replace('-prompt.md', '');
            this.activePrompts.set(workerId, {
                file: path.join(this.workersDir, file),
                created: fs.statSync(path.join(this.workersDir, file)).mtime,
                priority: this.calculatePriority(workerId)
            });
        });
    }

    calculatePriority(workerId) {
        const priorities = {
            'worker-auth': 100,
            'worker-leaves-core': 95,
            'worker-services-core': 90,
            'worker-hooks-core': 85,
            'worker-components-ui': 80,
            'worker-integration': 70,
            'worker-cleanup': 60
        };
        return priorities[workerId] || 50;
    }

    generateNewPrompts() {
        console.log('🔄 Génération de nouveaux prompts...');
        
        // Analyse de l'état actuel du projet
        const projectState = this.analyzeProjectState();
        
        // Génération intelligente basée sur les besoins
        const neededWorkers = this.identifyNeededWorkers(projectState);
        
        neededWorkers.forEach(workerSpec => {
            this.generateWorkerPrompt(workerSpec);
        });
        
        console.log(`✨ ${neededWorkers.length} nouveaux prompts générés`);
    }

    analyzeProjectState() {
        const state = {
            testFailures: this.getFailingTests(),
            eslintErrors: this.getEslintErrors(),
            typeErrors: this.getTypeErrors(),
            coverage: this.getCoverage()
        };
        
        console.log('📊 État du projet analysé:', {
            tests: `${state.testFailures.length} échecs`,
            eslint: `${state.eslintErrors.length} erreurs`,
            types: `${state.typeErrors.length} erreurs`,
            coverage: `${state.coverage.percentage}%`
        });
        
        return state;
    }

    getFailingTests() {
        try {
            const result = execSync('npm test -- --passWithNoTests --silent 2>&1', { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '..')
            });
            
            // Parse les résultats pour identifier les tests qui échouent
            const failures = [];
            const lines = result.split('\n');
            
            lines.forEach((line, index) => {
                if (line.includes('FAIL ') && line.includes('.test.')) {
                    const testFile = line.split('FAIL ')[1]?.split(' ')[0];
                    if (testFile) {
                        failures.push({
                            file: testFile,
                            module: this.getModuleFromPath(testFile),
                            priority: this.getTestPriority(testFile)
                        });
                    }
                }
            });
            
            return failures;
        } catch (error) {
            console.log('⚠️ Erreur lors de l\'analyse des tests:', error.message);
            return [];
        }
    }

    getModuleFromPath(testPath) {
        if (testPath.includes('/leaves/')) return 'leaves';
        if (testPath.includes('/auth/')) return 'auth';
        if (testPath.includes('/services/')) return 'services';
        if (testPath.includes('/hooks/')) return 'hooks';
        if (testPath.includes('/components/')) return 'components';
        return 'other';
    }

    getTestPriority(testPath) {
        if (testPath.includes('auth')) return 100;
        if (testPath.includes('leaves')) return 95;
        if (testPath.includes('services')) return 90;
        if (testPath.includes('hooks')) return 85;
        return 70;
    }

    getEslintErrors() {
        try {
            execSync('npx eslint src/ --format=json > /tmp/eslint-results.json 2>/dev/null', {
                cwd: path.join(__dirname, '..')
            });
            
            const results = JSON.parse(fs.readFileSync('/tmp/eslint-results.json', 'utf8'));
            return results.filter(r => r.errorCount > 0);
        } catch (error) {
            return [];
        }
    }

    getTypeErrors() {
        try {
            const result = execSync('npx tsc --noEmit --listFiles 2>&1', {
                encoding: 'utf8',
                cwd: path.join(__dirname, '..')
            });
            
            return result.split('\n').filter(line => line.includes('error TS'));
        } catch (error) {
            return [];
        }
    }

    getCoverage() {
        try {
            const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');
            if (fs.existsSync(coverageFile)) {
                const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
                return {
                    percentage: coverage.total?.statements?.pct || 0,
                    details: coverage
                };
            }
        } catch (error) {
            // Silence
        }
        return { percentage: 0 };
    }

    identifyNeededWorkers(projectState) {
        const workers = [];
        
        // Grouper les échecs de tests par module
        const moduleFailures = projectState.testFailures.reduce((acc, failure) => {
            const module = failure.module;
            if (!acc[module]) acc[module] = [];
            acc[module].push(failure);
            return acc;
        }, {});
        
        // Créer des workers spécialisés
        Object.entries(moduleFailures).forEach(([module, failures]) => {
            if (failures.length >= 3) { // Seuil pour créer un worker
                workers.push({
                    id: `worker-${module}-emergency`,
                    type: 'test-repair',
                    priority: Math.max(...failures.map(f => f.priority)),
                    scope: failures,
                    estimatedTime: failures.length * 5, // 5 min par test
                    description: `Réparation urgente de ${failures.length} tests du module ${module}`
                });
            }
        });
        
        // Worker de nettoyage ESLint si beaucoup d'erreurs
        if (projectState.eslintErrors.length > 10) {
            workers.push({
                id: 'worker-eslint-cleanup',
                type: 'lint-repair',
                priority: 85,
                scope: projectState.eslintErrors,
                estimatedTime: 15,
                description: `Nettoyage de ${projectState.eslintErrors.length} erreurs ESLint`
            });
        }
        
        // Worker d'optimisation de coverage si trop bas
        if (projectState.coverage.percentage < 70) {
            workers.push({
                id: 'worker-coverage-boost',
                type: 'coverage-improvement',
                priority: 75,
                scope: ['low-coverage-files'],
                estimatedTime: 25,
                description: `Amélioration du coverage de ${projectState.coverage.percentage}% vers 80%`
            });
        }
        
        return workers.sort((a, b) => b.priority - a.priority);
    }

    generateWorkerPrompt(workerSpec) {
        const promptContent = this.createPromptContent(workerSpec);
        const promptFile = path.join(this.workersDir, `${workerSpec.id}-prompt.md`);
        
        fs.writeFileSync(promptFile, promptContent);
        
        this.activePrompts.set(workerSpec.id, {
            file: promptFile,
            created: new Date(),
            priority: workerSpec.priority,
            spec: workerSpec
        });
        
        console.log(`📝 Prompt généré: ${workerSpec.id} (Priorité: ${workerSpec.priority})`);
    }

    createPromptContent(spec) {
        const template = `# CLAUDE CODE WORKER: ${spec.id.toUpperCase()}

## 🎯 MISSION AUTONOME
**Spécialité**: ${spec.type}
**Priorité**: ${'🔥'.repeat(Math.ceil(spec.priority / 20))} ${spec.priority >= 90 ? 'CRITIQUE' : spec.priority >= 70 ? 'HAUTE' : 'MOYENNE'}
**Temps estimé**: ${spec.estimatedTime} min
**Fichiers concernés**: ${spec.scope.length}

## 📋 DESCRIPTION
${spec.description}

## 🛠️ INSTRUCTIONS PRÉCISES

### Étape 1: Diagnostic Rapide
\`\`\`bash
# Tests à vérifier spécifiquement
${this.generateTestCommands(spec)}
\`\`\`

### Étape 2: Analyse et Réparation
${this.generateRepairInstructions(spec)}

### Étape 3: Validation Bullet-Proof
\`\`\`bash
# Validation isolée
${this.generateValidationCommands(spec)}

# Validation globale
npm run test:bulletproof
\`\`\`

## 🎯 CRITÈRES DE SUCCÈS
${this.generateSuccessCriteria(spec)}

## 🚨 RÈGLES CRITIQUES
${this.generateCriticalRules(spec)}

## 📊 REPORTING AUTO-DESTRUCTEUR
À la fin, créer ce rapport et **DÉTRUIRE ce prompt**:
\`\`\`bash
echo "WORKER: ${spec.id}" >> WORKERS_COMPLETED.log
echo "STATUS: ✅ SUCCÈS / ❌ ÉCHEC" >> WORKERS_COMPLETED.log
echo "FICHIERS RÉPARÉS: X/${spec.scope.length}" >> WORKERS_COMPLETED.log
echo "TEMPS RÉEL: XX minutes" >> WORKERS_COMPLETED.log

# AUTO-DESTRUCTION DU PROMPT
rm "${spec.id}-prompt.md"
echo "🗑️ Prompt ${spec.id} auto-détruit après exécution réussie"
\`\`\`

## 🔄 WORKFLOW AUTONOME
1. Diagnostic
2. Réparation ciblée
3. Validation immédiate
4. Rapport + Auto-destruction

GO! 🚀

---
**Généré automatiquement**: ${new Date().toISOString()}
**Auto-destruction**: Après exécution réussie
**Manager**: claude-workers-manager v2.0`;

        return template;
    }

    generateTestCommands(spec) {
        if (spec.type === 'test-repair') {
            return spec.scope.map(test => 
                `npm test -- --testPathPattern="${test.file.replace('.test.', '').replace(/.*\//, '')}"`
            ).join('\n');
        }
        return 'npm test -- --passWithNoTests';
    }

    generateRepairInstructions(spec) {
        const instructions = {
            'test-repair': `Pour chaque test en échec:
1. **Analyser l'erreur** avec Read tool sur le fichier de test
2. **Identifier le pattern** (imports, mocks, API changes)
3. **Appliquer la solution** appropriée:
   - Fix imports (utiliser @/ aliases)
   - Corriger les mocks (suivre patterns jest.setup.js)
   - Adapter aux nouvelles APIs
   - Simplifier si trop complexe
4. **Valider immédiatement** le test réparé`,
            
            'lint-repair': `Réparation systématique ESLint:
1. **Lister les erreurs** avec npx eslint src/ --format=json
2. **Grouper par type** (imports, types, syntax)
3. **Appliquer les fixes automatiques** avec --fix quand possible
4. **Réparer manuellement** les erreurs complexes
5. **Valider** avec npx eslint src/ --quiet`,
            
            'coverage-improvement': `Amélioration ciblée du coverage:
1. **Identifier les fichiers** avec coverage < 70%
2. **Analyser les branches** non couvertes
3. **Ajouter des tests ciblés** pour les cas manqués
4. **Optimiser les tests existants** si redondants
5. **Valider l'amélioration** du coverage`
        };
        
        return instructions[spec.type] || 'Instructions génériques de réparation';
    }

    generateValidationCommands(spec) {
        const commands = [];
        
        if (spec.type === 'test-repair') {
            commands.push('# Tests du module spécifique');
            commands.push(`npm test -- --testPathPattern="${spec.scope[0]?.module || 'target'}" --verbose`);
        }
        
        if (spec.type === 'lint-repair') {
            commands.push('# Validation ESLint');
            commands.push('npx eslint src/ --quiet');
        }
        
        if (spec.type === 'coverage-improvement') {
            commands.push('# Validation coverage');
            commands.push('npm run test:coverage');
        }
        
        return commands.join('\n');
    }

    generateSuccessCriteria(spec) {
        const criteria = [];
        
        if (spec.type === 'test-repair') {
            criteria.push(`- ✅ ${spec.scope.length}/${spec.scope.length} tests réparés et passants`);
            criteria.push('- ✅ Pas de régression sur les autres tests');
            criteria.push('- ✅ Temps d\'exécution < 30 secondes');
        }
        
        if (spec.type === 'lint-repair') {
            criteria.push('- ✅ 0 erreur ESLint restante');
            criteria.push('- ✅ Code formatté correctement');
        }
        
        if (spec.type === 'coverage-improvement') {
            criteria.push('- ✅ Coverage > 80% sur les fichiers ciblés');
            criteria.push('- ✅ Tests ajoutés de qualité');
        }
        
        criteria.push('- ✅ TypeScript compile sans erreur');
        
        return criteria.join('\n');
    }

    generateCriticalRules(spec) {
        return `- **JAMAIS ignorer** un test avec .skip() sans justification
- **TOUJOURS préserver** la logique métier existante
- **UTILISER les mocks** centralisés dans test-utils/
- **RESPECTER les patterns** TypeScript du projet
- **DOCUMENTER** les changements importants
- **AUTO-DÉTRUIRE** ce prompt après succès complet`;
    }

    // API publique pour interaction
    listActivePrompts() {
        console.log('\\n📋 PROMPTS ACTIFS:');
        const sorted = Array.from(this.activePrompts.entries())
            .sort(([,a], [,b]) => b.priority - a.priority);
        
        sorted.forEach(([id, info]) => {
            const age = Math.floor((Date.now() - info.created) / 1000 / 60);
            console.log(`  ${info.priority >= 90 ? '🔥' : '📝'} ${id} (P:${info.priority}, ${age}min)`);
        });
    }

    markPromptCompleted(workerId, success = true) {
        if (this.activePrompts.has(workerId)) {
            const prompt = this.activePrompts.get(workerId);
            
            // Marquer comme complété
            this.completedWork.set(workerId, {
                ...prompt,
                completed: new Date(),
                success
            });
            
            // Auto-destruction si succès
            if (success && fs.existsSync(prompt.file)) {
                fs.unlinkSync(prompt.file);
                console.log(`🗑️ Prompt ${workerId} auto-détruit après succès`);
            }
            
            // Retirer des actifs
            this.activePrompts.delete(workerId);
            
            // Mettre à jour les stats
            if (success) {
                this.performance.completedWorkers++;
            } else {
                this.performance.failedWorkers++;
            }
            
            console.log(`✅ Worker ${workerId} marqué comme ${success ? 'réussi' : 'échoué'}`);
        }
    }

    getPerformanceStats() {
        const runtime = Math.floor((Date.now() - this.performance.startTime) / 1000 / 60);
        
        return {
            runtime: `${runtime} minutes`,
            active: this.activePrompts.size,
            completed: this.performance.completedWorkers,
            failed: this.performance.failedWorkers,
            total: this.activePrompts.size + this.performance.completedWorkers + this.performance.failedWorkers,
            successRate: this.performance.completedWorkers / Math.max(1, this.performance.completedWorkers + this.performance.failedWorkers) * 100
        };
    }

    cleanupOldPrompts(maxAgeMinutes = 60) {
        const cutoff = Date.now() - (maxAgeMinutes * 60 * 1000);
        let cleaned = 0;
        
        this.activePrompts.forEach((info, id) => {
            if (info.created < cutoff) {
                if (fs.existsSync(info.file)) {
                    fs.unlinkSync(info.file);
                    cleaned++;
                }
                this.activePrompts.delete(id);
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} prompts anciens nettoyés`);
        }
    }
}

// CLI Interface
if (require.main === module) {
    const manager = new ClaudeWorkersManager();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'list':
            manager.listActivePrompts();
            break;
            
        case 'complete':
            const workerId = process.argv[3];
            const success = process.argv[4] !== 'false';
            manager.markPromptCompleted(workerId, success);
            break;
            
        case 'stats':
            console.log('📊 PERFORMANCE STATS:', manager.getPerformanceStats());
            break;
            
        case 'cleanup':
            const maxAge = parseInt(process.argv[3]) || 60;
            manager.cleanupOldPrompts(maxAge);
            break;
            
        case 'generate':
            console.log('🔄 Régénération des prompts...');
            manager.generateNewPrompts();
            break;
            
        default:
            console.log(`
🚀 CLAUDE WORKERS MANAGER V2.0

Usage:
  node claude-workers-manager.js list              # Lister les prompts actifs
  node claude-workers-manager.js complete <id>     # Marquer un worker comme complété
  node claude-workers-manager.js stats             # Afficher les statistiques
  node claude-workers-manager.js cleanup [minutes] # Nettoyer les anciens prompts
  node claude-workers-manager.js generate          # Générer de nouveaux prompts

Exemples:
  node claude-workers-manager.js complete worker-auth-emergency true
  node claude-workers-manager.js cleanup 30
            `);
    }
}

module.exports = ClaudeWorkersManager;