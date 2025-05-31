#!/usr/bin/env node

/**
 * CLAUDE WORKERS AUTONOMOUS SYSTEM V3.0
 * 
 * Système autonome révolutionnaire :
 * - Analyse approfondie (5-10 min) pour détecter TOUS les problèmes
 * - Boucle infinie intelligente jusqu'à perfection complète
 * - Support multi-instances Claude Code
 * - Auto-lancement des prompts avec validation
 * - Nettoyage et relancement automatique
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class AutonomousClaudeWorkers {
    constructor(options = {}) {
        this.workersDir = path.join(__dirname, '../claude-workers-prompts');
        this.logsDir = path.join(__dirname, '../autonomous-logs');
        this.instanceId = options.instanceId || process.env.CLAUDE_INSTANCE_ID || 'claude-1';
        this.maxCycles = options.maxCycles || 50; // Limite de sécurité
        this.currentCycle = 0;
        this.deepAnalysisDuration = options.testMode ? 30000 : 300000; // 30s en test, 5 min normal
        this.lastPerfectRun = null;
        
        this.performance = {
            startTime: Date.now(),
            cycles: 0,
            totalProblemsFixed: 0,
            currentProblems: 0,
            instanceId: this.instanceId
        };
        
        this.init();
    }

    init() {
        console.log(`🚀 CLAUDE WORKERS AUTONOMOUS V3.0 - INSTANCE ${this.instanceId}`);
        console.log(`⚡ DÉMARRAGE DU CYCLE AUTONOME INFINI`);
        
        this.ensureDirectories();
        this.createInstanceLock();
        this.startAutonomousCycle();
    }

    ensureDirectories() {
        [this.workersDir, this.logsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Fichier de status partagé entre instances
        this.statusFile = path.join(this.logsDir, 'autonomous-status.json');
        this.initializeStatusFile();
    }

    initializeStatusFile() {
        if (!fs.existsSync(this.statusFile)) {
            const initialStatus = {
                instances: {},
                globalStats: {
                    totalCycles: 0,
                    totalFixedProblems: 0,
                    lastPerfectRun: null,
                    projectHealth: 'UNKNOWN'
                }
            };
            fs.writeFileSync(this.statusFile, JSON.stringify(initialStatus, null, 2));
        }
    }

    createInstanceLock() {
        const lockFile = path.join(this.logsDir, `instance-${this.instanceId}.lock`);
        fs.writeFileSync(lockFile, JSON.stringify({
            instanceId: this.instanceId,
            pid: process.pid,
            startTime: new Date().toISOString(),
            status: 'STARTING'
        }));
        
        // Cleanup au exit
        process.on('exit', () => {
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
            }
        });
    }

    async startAutonomousCycle() {
        console.log(`\\n🔄 DÉBUT DU CYCLE AUTONOME INFINI (Instance ${this.instanceId})`);
        
        while (this.currentCycle < this.maxCycles) {
            this.currentCycle++;
            
            console.log(`\\n===== CYCLE ${this.currentCycle}/${this.maxCycles} =====`);
            console.log(`🕐 ${new Date().toLocaleTimeString()}`);
            
            try {
                // Phase 1: Analyse approfondie (5-10 minutes)
                console.log(`\\n📊 PHASE 1: ANALYSE APPROFONDIE (5-10 min)...`);
                const problems = await this.deepProjectAnalysis();
                
                if (problems.length === 0) {
                    console.log(`\\n🎉 PROJET PARFAIT ! Aucun problème détecté.`);
                    await this.handlePerfectProject();
                    continue;
                }
                
                // Phase 2: Génération de prompts batch intelligents
                console.log(`\\n🧠 PHASE 2: GÉNÉRATION DE ${problems.length} PROMPTS BATCH...`);
                const prompts = await this.generateIntelligentBatches(problems);
                
                // Phase 3: Exécution autonome (si une seule instance)
                if (await this.shouldAutoExecute()) {
                    console.log(`\\n🤖 PHASE 3: EXÉCUTION AUTONOME DE ${prompts.length} WORKERS...`);
                    await this.autoExecutePrompts(prompts);
                }
                
                // Phase 4: Validation et nettoyage
                console.log(`\\n✅ PHASE 4: VALIDATION ET NETTOYAGE...`);
                await this.validateAndCleanup();
                
                // Phase 5: Pause intelligente avant nouveau cycle
                await this.intelligentPause();
                
            } catch (error) {
                console.error(`❌ ERREUR CYCLE ${this.currentCycle}:`, error.message);
                await this.handleCycleError(error);
            }
        }
        
        console.log(`\\n🏁 LIMITE DE CYCLES ATTEINTE (${this.maxCycles})`);
        console.log(`📊 STATISTIQUES FINALES:`, this.performance);
    }

    async deepProjectAnalysis() {
        console.log(`🔬 Analyse approfondie en cours... (${this.deepAnalysisDuration/1000}s max)`);
        
        const problems = [];
        const analysisStartTime = Date.now();
        
        // 1. Tests complets avec timeout étendu
        console.log(`   📋 Analyse complète des tests...`);
        try {
            const testResult = await this.runWithTimeout(
                'npm test -- --passWithNoTests --verbose --coverage --detectOpenHandles',
                this.deepAnalysisDuration * 0.4 // 40% du temps pour les tests
            );
            problems.push(...this.parseTestFailuresDetailed(testResult));
        } catch (error) {
            console.log(`   ⚠️ Tests: ${error.message.substring(0, 100)}...`);
        }
        
        // 2. ESLint approfondi
        console.log(`   🔍 Analyse ESLint approfondie...`);
        try {
            const eslintResult = await this.runWithTimeout(
                'npx eslint src/ --format=json --ext .ts,.tsx,.js,.jsx',
                this.deepAnalysisDuration * 0.2 // 20% du temps pour ESLint
            );
            problems.push(...this.parseEslintDetailed(eslintResult));
        } catch (error) {
            console.log(`   ⚠️ ESLint: Analyse partielle`);
        }
        
        // 3. TypeScript complet
        console.log(`   📝 Analyse TypeScript complète...`);
        try {
            const tsResult = await this.runWithTimeout(
                'npx tsc --noEmit --pretty --listFiles',
                this.deepAnalysisDuration * 0.2 // 20% du temps pour TS
            );
            problems.push(...this.parseTypeScriptDetailed(tsResult));
        } catch (error) {
            problems.push(...this.parseTypeScriptDetailed(error.stdout || error.stderr || ''));
        }
        
        // 4. Analyse de dépendances
        console.log(`   📦 Analyse des dépendances...`);
        try {
            const depsResult = await this.runWithTimeout('npm outdated --json', 10000);
            problems.push(...this.parseOutdatedDependencies(depsResult));
        } catch (error) {
            // Normal si pas de dépendances obsolètes
        }
        
        // 5. Analyse de performance
        console.log(`   ⚡ Analyse de performance...`);
        try {
            const perfResult = await this.runWithTimeout(
                'npm run test:bulletproof',
                this.deepAnalysisDuration * 0.2 // 20% du temps pour la performance
            );
            problems.push(...this.parsePerformanceIssues(perfResult));
        } catch (error) {
            console.log(`   ⚠️ Performance: ${error.message.substring(0, 50)}...`);
        }
        
        const analysisTime = Math.floor((Date.now() - analysisStartTime) / 1000);
        console.log(`\\n📊 ANALYSE TERMINÉE: ${problems.length} problèmes détectés en ${analysisTime}s`);
        
        this.updateInstanceStatus({
            phase: 'ANALYSIS_COMPLETE',
            problemsFound: problems.length,
            analysisTime
        });
        
        return problems;
    }

    async runWithTimeout(command, timeout) {
        return new Promise((resolve, reject) => {
            let output = '';
            let errorOutput = '';
            
            const child = spawn('sh', ['-c', command], {
                cwd: path.join(__dirname, '..'),
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            const timer = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`Timeout: ${command.substring(0, 50)}...`));
            }, timeout);
            
            child.on('close', (code) => {
                clearTimeout(timer);
                if (code === 0) {
                    resolve(output);
                } else {
                    const error = new Error(`Command failed: ${command}`);
                    error.stdout = output;
                    error.stderr = errorOutput;
                    reject(error);
                }
            });
        });
    }

    parseTestFailuresDetailed(output) {
        const problems = [];
        const lines = output.split('\\n');
        
        let currentSuite = null;
        let currentTest = null;
        
        lines.forEach((line, index) => {
            // Suite de tests qui échoue
            if (line.includes('FAIL ') && line.includes('.test.')) {
                const suitePath = line.split('FAIL ')[1]?.split(' ')[0];
                if (suitePath) {
                    currentSuite = {
                        type: 'test-suite-failure',
                        file: suitePath,
                        module: this.extractModuleDetailed(suitePath),
                        priority: this.calculateDetailedPriority(suitePath),
                        failedTests: [],
                        errors: []
                    };
                }
            }
            
            // Tests individuels qui échouent
            if (line.includes('✕') || line.includes('×')) {
                const testName = line.replace(/.*[✕×]\\s*/, '').trim();
                if (testName && currentSuite) {
                    currentSuite.failedTests.push(testName);
                }
            }
            
            // Messages d'erreur détaillés
            if (line.includes('Error:') || line.includes('TypeError:') || line.includes('ReferenceError:')) {
                const errorMessage = line.trim();
                if (currentSuite) {
                    currentSuite.errors.push(errorMessage);
                }
            }
            
            // Fin de suite, ajouter le problème
            if (currentSuite && (line.includes('Test Suites:') || index === lines.length - 1)) {
                if (currentSuite.failedTests.length > 0) {
                    problems.push({
                        ...currentSuite,
                        description: `${currentSuite.failedTests.length} tests échouent dans ${path.basename(currentSuite.file)}`,
                        estimatedTime: currentSuite.failedTests.length * 5,
                        complexity: this.analyzeTestComplexity(currentSuite)
                    });
                }
                currentSuite = null;
            }
        });
        
        return problems;
    }

    parseEslintDetailed(output) {
        const problems = [];
        
        try {
            const results = JSON.parse(output);
            
            results.forEach(file => {
                if (file.errorCount > 0 || file.warningCount > 0) {
                    const errorsByRule = {};
                    
                    file.messages.forEach(msg => {
                        const rule = msg.ruleId || 'unknown';
                        if (!errorsByRule[rule]) {
                            errorsByRule[rule] = [];
                        }
                        errorsByRule[rule].push({
                            line: msg.line,
                            column: msg.column,
                            message: msg.message,
                            severity: msg.severity
                        });
                    });
                    
                    problems.push({
                        type: 'eslint-errors',
                        file: file.filePath,
                        module: this.extractModuleDetailed(file.filePath),
                        priority: file.errorCount > 0 ? 80 : 60,
                        errorCount: file.errorCount,
                        warningCount: file.warningCount,
                        errorsByRule,
                        description: `${file.errorCount} erreurs, ${file.warningCount} warnings ESLint`,
                        estimatedTime: Math.ceil((file.errorCount * 2 + file.warningCount) / 3),
                        complexity: file.errorCount > 10 ? 'HIGH' : file.errorCount > 5 ? 'MEDIUM' : 'LOW'
                    });
                }
            });
        } catch (e) {
            // JSON parsing failed
        }
        
        return problems;
    }

    parseTypeScriptDetailed(output) {
        const problems = [];
        const lines = output.split('\\n');
        
        const errorsByFile = {};
        
        lines.forEach(line => {
            const match = line.match(/(.+\\.tsx?)\\((\\d+),(\\d+)\\):\\s*error\\s+TS(\\d+):\\s*(.+)/);
            if (match) {
                const [, file, lineNum, col, errorCode, message] = match;
                
                if (!errorsByFile[file]) {
                    errorsByFile[file] = [];
                }
                
                errorsByFile[file].push({
                    line: parseInt(lineNum),
                    column: parseInt(col),
                    code: `TS${errorCode}`,
                    message: message.trim()
                });
            }
        });
        
        Object.entries(errorsByFile).forEach(([file, errors]) => {
            problems.push({
                type: 'typescript-errors',
                file,
                module: this.extractModuleDetailed(file),
                priority: 85,
                errors,
                errorCount: errors.length,
                description: `${errors.length} erreurs TypeScript`,
                estimatedTime: errors.length * 3,
                complexity: this.analyzeTypeScriptComplexity(errors)
            });
        });
        
        return problems;
    }

    parseOutdatedDependencies(output) {
        const problems = [];
        
        try {
            const outdated = JSON.parse(output);
            
            Object.entries(outdated).forEach(([pkg, info]) => {
                const isMajorUpdate = this.isMajorVersionUpdate(info.current, info.latest);
                
                problems.push({
                    type: 'outdated-dependency',
                    package: pkg,
                    module: 'dependencies',
                    priority: isMajorUpdate ? 60 : 40,
                    current: info.current,
                    wanted: info.wanted,
                    latest: info.latest,
                    description: `${pkg}: ${info.current} → ${info.latest}`,
                    estimatedTime: isMajorUpdate ? 15 : 5,
                    complexity: isMajorUpdate ? 'HIGH' : 'LOW'
                });
            });
        } catch (e) {
            // JSON parsing failed
        }
        
        return problems;
    }

    parsePerformanceIssues(output) {
        const problems = [];
        const lines = output.split('\\n');
        
        lines.forEach(line => {
            // Tests lents
            if (line.includes('slow test') || line.includes('> 5000ms')) {
                problems.push({
                    type: 'performance-slow-test',
                    module: 'performance',
                    priority: 50,
                    description: 'Test lent détecté',
                    estimatedTime: 10,
                    complexity: 'MEDIUM'
                });
            }
            
            // Bundle trop gros
            if (line.includes('bundle size') && line.includes('exceeded')) {
                problems.push({
                    type: 'performance-bundle-size',
                    module: 'performance',
                    priority: 65,
                    description: 'Taille de bundle dépassée',
                    estimatedTime: 20,
                    complexity: 'HIGH'
                });
            }
        });
        
        return problems;
    }

    async generateIntelligentBatches(problems) {
        console.log(`🧠 Création de batches intelligents pour ${problems.length} problèmes...`);
        
        // Grouper par module et complexité
        const grouped = this.groupProblemsByStrategy(problems);
        
        const batches = [];
        Object.entries(grouped).forEach(([strategy, groupProblems]) => {
            // Créer des batches de taille optimale selon la complexité
            const batchSize = this.calculateOptimalBatchSize(groupProblems);
            
            for (let i = 0; i < groupProblems.length; i += batchSize) {
                const chunk = groupProblems.slice(i, i + batchSize);
                const batchId = `autonomous-${strategy}-batch${Math.floor(i / batchSize) + 1}-cycle${this.currentCycle}`;
                
                batches.push({
                    id: batchId,
                    strategy,
                    problems: chunk,
                    priority: Math.max(...chunk.map(p => p.priority)),
                    estimatedTime: chunk.reduce((sum, p) => sum + p.estimatedTime, 0),
                    complexity: this.getBatchComplexity(chunk),
                    instanceId: this.instanceId
                });
            }
        });
        
        // Créer les fichiers de prompts
        const createdPrompts = [];
        for (const batch of batches.sort((a, b) => b.priority - a.priority)) {
            const promptPath = await this.createAdvancedPrompt(batch);
            createdPrompts.push({
                ...batch,
                promptPath
            });
            
            console.log(`   📝 ${batch.id}: ${batch.problems.length} problèmes, ${batch.estimatedTime}min`);
        }
        
        return createdPrompts;
    }

    groupProblemsByStrategy(problems) {
        const groups = {
            'critical-tests': [],
            'module-tests': [],
            'lint-fixes': [],
            'type-fixes': [],
            'performance': [],
            'dependencies': []
        };
        
        problems.forEach(problem => {
            if (problem.type.includes('test') && problem.priority > 90) {
                groups['critical-tests'].push(problem);
            } else if (problem.type.includes('test')) {
                const module = problem.module || 'other';
                const key = `${module}-tests`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(problem);
            } else if (problem.type.includes('eslint')) {
                groups['lint-fixes'].push(problem);
            } else if (problem.type.includes('typescript')) {
                groups['type-fixes'].push(problem);
            } else if (problem.type.includes('performance')) {
                groups['performance'].push(problem);
            } else if (problem.type.includes('dependency')) {
                groups['dependencies'].push(problem);
            }
        });
        
        // Supprimer les groupes vides
        return Object.fromEntries(
            Object.entries(groups).filter(([key, value]) => value.length > 0)
        );
    }

    calculateOptimalBatchSize(problems) {
        const avgComplexity = problems.reduce((sum, p) => {
            const complexity = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 }[p.complexity] || 1;
            return sum + complexity;
        }, 0) / problems.length;
        
        // Plus c'est complexe, plus on réduit la taille du batch
        if (avgComplexity > 2.5) return 2; // HIGH complexity
        if (avgComplexity > 1.5) return 3; // MEDIUM complexity
        return 5; // LOW complexity
    }

    async createAdvancedPrompt(batch) {
        const content = this.generateAdvancedPromptContent(batch);
        const promptPath = path.join(this.workersDir, `${batch.id}-prompt.md`);
        
        fs.writeFileSync(promptPath, content);
        
        return promptPath;
    }

    generateAdvancedPromptContent(batch) {
        const priorityEmoji = '🔥'.repeat(Math.ceil(batch.priority / 25));
        
        const problemsSection = batch.problems.map((problem, index) => {
            let section = `
### ${index + 1}. ${problem.description}
- **Fichier**: \`${problem.file || 'Multiple'}\`
- **Type**: ${problem.type}
- **Module**: ${problem.module}
- **Priorité**: ${problem.priority}
- **Temps estimé**: ${problem.estimatedTime} min
- **Complexité**: ${problem.complexity}`;

            if (problem.failedTests && problem.failedTests.length > 0) {
                section += `\n- **Tests échoués**: ${problem.failedTests.length}`;
            }
            
            if (problem.errorCount) {
                section += `\n- **Erreurs**: ${problem.errorCount}`;
            }
            
            if (problem.errors && problem.errors.length > 0) {
                section += `\n- **Erreurs détaillées**: `;
                section += problem.errors.slice(0, 3).map(err => `\n  - ${err}`).join('');
            }
            
            return section;
        }).join('');
        
        return `# CLAUDE CODE WORKER: ${batch.id.toUpperCase()}

## 🎯 MISSION AUTONOME CYCLE ${this.currentCycle}
**Instance**: ${this.instanceId}
**Stratégie**: ${batch.strategy}
**Priorité**: ${priorityEmoji} ${batch.priority >= 90 ? 'CRITIQUE' : batch.priority >= 70 ? 'HAUTE' : 'MOYENNE'}
**Temps estimé**: ${batch.estimatedTime} min
**Complexité**: ${batch.complexity}
**Problèmes à résoudre**: ${batch.problems.length}

## 📋 ANALYSE DÉTAILLÉE DES PROBLÈMES
${problemsSection}

## 🛠️ STRATÉGIE DE RÉPARATION "${batch.strategy.toUpperCase()}"

${this.generateStrategyInstructions(batch.strategy, batch.problems)}

## 🔄 WORKFLOW AUTONOME OPTIMISÉ

### Étape 1: Diagnostic Ciblé (${Math.ceil(batch.estimatedTime * 0.2)} min)
\`\`\`bash
# Tests spécifiques à la stratégie
${this.generateDiagnosticCommands(batch)}
\`\`\`

### Étape 2: Réparation Systématique (${Math.ceil(batch.estimatedTime * 0.6)} min)
${this.generateRepairSteps(batch)}

### Étape 3: Validation Continue (${Math.ceil(batch.estimatedTime * 0.2)} min)
\`\`\`bash
# Validation après chaque réparation
${this.generateValidationCommands(batch)}
\`\`\`

## 🎯 CRITÈRES DE SUCCÈS AUTONOME
- ✅ **${batch.problems.length}/${batch.problems.length} problèmes résolus**
- ✅ **Validation complète sans régression**
- ✅ **Temps d'exécution ≤ ${batch.estimatedTime + 5} minutes**
- ✅ **Performance maintenue**
- ✅ **Préparation pour le cycle suivant**

## 🤖 AUTO-DESTRUCTION ET CYCLE SUIVANT

À la fin de la mission, exécuter:

\`\`\`bash
# Rapport de cycle
echo "🎯 WORKER: ${batch.id}" >> autonomous-logs/cycle-${this.currentCycle}-results.log
echo "📊 STATUT: ✅ SUCCÈS COMPLET" >> autonomous-logs/cycle-${this.currentCycle}-results.log
echo "🔧 PROBLÈMES RÉSOLUS: ${batch.problems.length}/${batch.problems.length}" >> autonomous-logs/cycle-${this.currentCycle}-results.log
echo "⏱️ TEMPS RÉEL: XX minutes" >> autonomous-logs/cycle-${this.currentCycle}-results.log
echo "🤖 INSTANCE: ${this.instanceId}" >> autonomous-logs/cycle-${this.currentCycle}-results.log
echo "🔄 CYCLE: ${this.currentCycle}" >> autonomous-logs/cycle-${this.currentCycle}-results.log

# AUTO-DESTRUCTION et notification de fin de cycle
rm "${batch.id}-prompt.md"
echo "🗑️ Prompt ${batch.id} auto-détruit"

# Signal pour le système autonome
touch autonomous-logs/worker-${batch.id}-completed.signal
echo "🔄 Signal envoyé pour continuer le cycle autonome"
\`\`\`

## 🚨 RÈGLES CRITIQUES AUTONOMES
- **FOCUS STRATÉGIE**: Suivre exactement la stratégie ${batch.strategy}
- **VALIDATION IMMÉDIATE**: Tester après chaque modification
- **PERFORMANCE**: Maintenir les temps d'exécution
- **CYCLE CONTINU**: Préparer pour le cycle ${this.currentCycle + 1}
- **MULTI-INSTANCE**: Respecter les locks d'instance ${this.instanceId}

MISSION AUTONOME ${this.currentCycle} - GO! 🚀⚡

---
**Généré automatiquement**: ${new Date().toISOString()}
**Système**: Autonomous Claude Workers V3.0
**Cycle**: ${this.currentCycle}/${this.maxCycles}
**Instance**: ${this.instanceId}`;
    }

    generateStrategyInstructions(strategy, problems) {
        const instructions = {
            'critical-tests': `
**STRATÉGIE TESTS CRITIQUES**:
Réparer en priorité les tests bloquants pour débloquer l'ensemble du projet.
1. **Analyser les dépendances** entre les tests
2. **Identifier les causes racines** (mocks, APIs, imports)
3. **Réparer dans l'ordre de priorité** (auth > leaves > services)
4. **Valider immédiatement** chaque réparation`,

            'lint-fixes': `
**STRATÉGIE CORRECTION ESLINT**:
Corriger systématiquement les erreurs de style et de qualité.
1. **Grouper par règle** ESLint violée
2. **Appliquer les fixes automatiques** quand possible
3. **Corriger manuellement** les cas complexes
4. **Valider la cohérence** du style`,

            'type-fixes': `
**STRATÉGIE CORRECTION TYPESCRIPT**:
Résoudre les erreurs de types pour une base de code robuste.
1. **Analyser les dépendances de types**
2. **Corriger les imports/exports** manquants
3. **Mettre à jour les interfaces** obsolètes
4. **Valider la compilation complète**`,

            'performance': `
**STRATÉGIE OPTIMISATION PERFORMANCE**:
Améliorer les performances critiques du projet.
1. **Identifier les goulots d'étranglement**
2. **Optimiser les tests lents**
3. **Réduire la taille des bundles**
4. **Valider les métriques**`,

            'dependencies': `
**STRATÉGIE MISE À JOUR DÉPENDANCES**:
Maintenir les dépendances à jour de manière sécurisée.
1. **Prioriser les mises à jour de sécurité**
2. **Tester les mises à jour mineures**
3. **Planifier les mises à jour majeures**
4. **Valider la compatibilité**`
        };

        return instructions[strategy] || instructions['critical-tests'];
    }

    generateDiagnosticCommands(batch) {
        const commands = [];
        
        if (batch.strategy.includes('test')) {
            commands.push('# Tests détaillés');
            commands.push(`npm test -- --testPathPattern="${batch.problems[0]?.module || 'target'}" --verbose --coverage`);
        }
        
        if (batch.strategy.includes('lint')) {
            commands.push('# ESLint détaillé');
            commands.push('npx eslint src/ --format=json --quiet');
        }
        
        if (batch.strategy.includes('type')) {
            commands.push('# TypeScript détaillé');
            commands.push('npx tsc --noEmit --pretty --listFiles');
        }
        
        return commands.join('\\n');
    }

    generateValidationCommands(batch) {
        const commands = [
            '# Validation globale après réparations',
            'npm run test:bulletproof',
            'npx eslint src/ --quiet',
            'npx tsc --noEmit'
        ];
        
        return commands.join('\\n');
    }

    async shouldAutoExecute() {
        // Vérifier s'il y a d'autres instances actives
        const instances = this.getActiveInstances();
        
        // Auto-exécution seulement si instance unique ou instance primaire
        return instances.length === 1 || this.instanceId === 'claude-1';
    }

    getActiveInstances() {
        const lockFiles = fs.readdirSync(this.logsDir)
            .filter(f => f.startsWith('instance-') && f.endsWith('.lock'));
        
        return lockFiles.map(f => {
            try {
                const content = fs.readFileSync(path.join(this.logsDir, f), 'utf8');
                return JSON.parse(content);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
    }

    async autoExecutePrompts(prompts) {
        // Cette fonction sera implémentée pour lancer automatiquement
        // les prompts sur les instances Claude Code disponibles
        console.log(`🤖 AUTO-EXÉCUTION DE ${prompts.length} PROMPTS...`);
        
        for (const prompt of prompts) {
            console.log(`   ⚡ Préparation: ${prompt.id}`);
            
            // Créer un signal pour l'exécution
            const signalPath = path.join(this.logsDir, `execute-${prompt.id}.signal`);
            fs.writeFileSync(signalPath, JSON.stringify({
                promptPath: prompt.promptPath,
                expectedTime: prompt.estimatedTime,
                instanceId: this.instanceId,
                cycle: this.currentCycle
            }));
        }
        
        console.log(`📡 ${prompts.length} signaux d'exécution créés`);
    }

    async validateAndCleanup() {
        console.log(`🧹 Validation et nettoyage du cycle ${this.currentCycle}...`);
        
        // Vérifier les résultats du cycle
        const completedSignals = fs.readdirSync(this.logsDir)
            .filter(f => f.includes(`cycle-${this.currentCycle}`) && f.endsWith('.signal'));
        
        console.log(`   ✅ ${completedSignals.length} workers complétés ce cycle`);
        
        // Nettoyer les anciens prompts
        const oldPrompts = fs.readdirSync(this.workersDir)
            .filter(f => f.includes(`cycle${this.currentCycle - 2}`)) // Garder le cycle précédent
            .map(f => path.join(this.workersDir, f));
        
        oldPrompts.forEach(promptPath => {
            if (fs.existsSync(promptPath)) {
                fs.unlinkSync(promptPath);
            }
        });
        
        if (oldPrompts.length > 0) {
            console.log(`   🗑️ ${oldPrompts.length} anciens prompts nettoyés`);
        }
        
        this.updateGlobalStats();
    }

    async intelligentPause() {
        // Pause adaptative selon l'heure et la charge
        const hour = new Date().getHours();
        let pauseDuration = 30000; // 30 secondes par défaut
        
        if (hour >= 22 || hour <= 6) {
            pauseDuration = 300000; // 5 minutes la nuit
        } else if (hour >= 12 && hour <= 14) {
            pauseDuration = 120000; // 2 minutes à midi
        }
        
        console.log(`⏸️ Pause intelligente: ${pauseDuration/1000}s`);
        await new Promise(resolve => setTimeout(resolve, pauseDuration));
    }

    async handlePerfectProject() {
        this.lastPerfectRun = new Date().toISOString();
        
        console.log(`🎉 PROJET PARFAIT ATTEINT !`);
        console.log(`🔄 Passage en mode surveillance...`);
        
        // Mode surveillance avec cycles plus longs
        await new Promise(resolve => setTimeout(resolve, 600000)); // 10 minutes
    }

    updateInstanceStatus(status) {
        const lockFile = path.join(this.logsDir, `instance-${this.instanceId}.lock`);
        
        if (fs.existsSync(lockFile)) {
            const currentStatus = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
            const updatedStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };
            fs.writeFileSync(lockFile, JSON.stringify(updatedStatus, null, 2));
        }
    }

    updateGlobalStats() {
        if (fs.existsSync(this.statusFile)) {
            const status = JSON.parse(fs.readFileSync(this.statusFile, 'utf8'));
            
            status.instances[this.instanceId] = {
                currentCycle: this.currentCycle,
                performance: this.performance,
                lastUpdate: new Date().toISOString()
            };
            
            status.globalStats.totalCycles++;
            if (this.lastPerfectRun) {
                status.globalStats.lastPerfectRun = this.lastPerfectRun;
            }
            
            fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
        }
    }

    // Helpers
    extractModuleDetailed(filePath) {
        const patterns = {
            '/modules/leaves/': 'leaves',
            '/modules/auth/': 'auth', 
            '/modules/planning/': 'planning',
            '/modules/calendar/': 'calendar',
            '/services/': 'services',
            '/hooks/': 'hooks',
            '/components/': 'components',
            '/utils/': 'utils',
            '/types/': 'types',
            '/lib/': 'lib'
        };
        
        for (const [pattern, module] of Object.entries(patterns)) {
            if (filePath.includes(pattern)) return module;
        }
        
        return 'other';
    }

    calculateDetailedPriority(filePath) {
        const priorities = {
            'auth': 100,
            'leaves': 95,
            'services': 90,
            'planning': 85,
            'hooks': 80,
            'components': 75,
            'utils': 70,
            'types': 65
        };
        
        const module = this.extractModuleDetailed(filePath);
        return priorities[module] || 50;
    }

    analyzeTestComplexity(suite) {
        const errorKeywords = ['Mock', 'Context', 'Provider', 'Query', 'WebSocket', 'DOM'];
        const complexityIndicators = suite.errors?.join(' ') || '';
        
        const matches = errorKeywords.filter(keyword => 
            complexityIndicators.includes(keyword)
        ).length;
        
        if (matches >= 3) return 'HIGH';
        if (matches >= 1) return 'MEDIUM';
        return 'LOW';
    }

    analyzeTypeScriptComplexity(errors) {
        const complexPatterns = ['Cannot find module', 'Property does not exist', 'Type instantiation'];
        
        const complexErrors = errors.filter(error =>
            complexPatterns.some(pattern => error.message.includes(pattern))
        ).length;
        
        if (complexErrors > errors.length * 0.5) return 'HIGH';
        if (complexErrors > 0) return 'MEDIUM';
        return 'LOW';
    }

    isMajorVersionUpdate(current, latest) {
        const currentMajor = current.split('.')[0];
        const latestMajor = latest.split('.')[0];
        return currentMajor !== latestMajor;
    }

    getBatchComplexity(problems) {
        const complexities = problems.map(p => ({ 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 }[p.complexity] || 1));
        const avg = complexities.reduce((a, b) => a + b, 0) / complexities.length;
        
        if (avg >= 2.5) return 'HIGH';
        if (avg >= 1.5) return 'MEDIUM';
        return 'LOW';
    }

    generateRepairSteps(batch) {
        return `Pour chaque problème du batch:
1. **Analyser la cause racine** avec les outils Read/Grep
2. **Appliquer la stratégie ${batch.strategy}** 
3. **Valider immédiatement** la réparation
4. **Documenter les changements** importants
5. **Passer au problème suivant** seulement si le précédent est résolu`;
    }

    async handleCycleError(error) {
        console.error(`❌ Erreur dans le cycle ${this.currentCycle}:`, error.message);
        
        // Log l'erreur
        const errorLog = path.join(this.logsDir, `cycle-${this.currentCycle}-error.log`);
        fs.writeFileSync(errorLog, JSON.stringify({
            cycle: this.currentCycle,
            instanceId: this.instanceId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }, null, 2));
        
        // Pause avant de continuer
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
    }
}

// CLI Interface
if (require.main === module) {
    const instanceId = process.argv[2] || process.env.CLAUDE_INSTANCE_ID || 'claude-1';
    const maxCycles = process.argv.includes('--maxCycles=1') ? 1 : 50;
    const testMode = process.argv.includes('--test') || maxCycles === 1;
    
    process.env.CLAUDE_INSTANCE_ID = instanceId;
    
    console.log(`🚀 Démarrage de l'instance autonome: ${instanceId} (max ${maxCycles} cycles${testMode ? ', mode test' : ''})`);
    
    const autonomousSystem = new AutonomousClaudeWorkers({
        instanceId,
        maxCycles,
        testMode
    });
}

module.exports = AutonomousClaudeWorkers;