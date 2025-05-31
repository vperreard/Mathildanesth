#!/usr/bin/env node

/**
 * AUTO PROMPT GENERATOR V2.0
 * 
 * Générateur intelligent de prompts Claude Code avec:
 * - Analyse en temps réel des échecs
 * - Prompts batch optimisés 
 * - Auto-destruction après succès
 * - Tracking de performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoPromptGenerator {
    constructor() {
        this.workersDir = path.join(__dirname, '../claude-workers-prompts');
        this.maxPrompts = 5; // Limite pour éviter l'overflow
        this.batchSize = 3; // Nombre de problèmes par prompt
    }

    async generateIntelligentPrompts() {
        console.log('🧠 ANALYSE INTELLIGENTE DU PROJET...');
        
        // 1. Analyse rapide des problèmes critiques
        const issues = await this.detectCriticalIssues();
        
        // 2. Groupage intelligent des problèmes
        const batches = this.createOptimalBatches(issues);
        
        // 3. Génération de prompts ciblés
        const prompts = this.generateBatchPrompts(batches);
        
        console.log(`✨ ${prompts.length} prompts intelligents générés`);
        
        return prompts;
    }

    async detectCriticalIssues() {
        const issues = [];
        
        console.log('🔍 Détection des problèmes critiques...');
        
        // Tests en échec (rapide)
        try {
            const testResult = execSync('npm test -- --passWithNoTests --silent --maxWorkers=1 2>&1', { 
                encoding: 'utf8',
                timeout: 30000,
                cwd: path.join(__dirname, '..')
            });
            
            const testIssues = this.parseTestFailures(testResult);
            issues.push(...testIssues);
            
        } catch (error) {
            console.log('⚠️ Analyse des tests interrompue (timeout/erreur)');
        }

        // ESLint errors (rapide)
        try {
            const eslintResult = execSync('npx eslint src/ --format=json --quiet 2>/dev/null', {
                encoding: 'utf8',
                timeout: 15000,
                cwd: path.join(__dirname, '..')
            });
            
            const eslintIssues = this.parseEslintErrors(eslintResult);
            issues.push(...eslintIssues);
            
        } catch (error) {
            // Silence, ESLint peut échouer
        }

        // TypeScript errors (rapide)
        try {
            const tsResult = execSync('npx tsc --noEmit --skipLibCheck 2>&1', {
                encoding: 'utf8',
                timeout: 20000,
                cwd: path.join(__dirname, '..')
            });
            
            const tsIssues = this.parseTypeScriptErrors(tsResult);
            issues.push(...tsIssues);
            
        } catch (error) {
            // TypeScript errors sont dans stderr, c'est normal
            const tsIssues = this.parseTypeScriptErrors(error.stdout || error.message);
            issues.push(...tsIssues);
        }

        console.log(`📊 ${issues.length} problèmes détectés`);
        return issues;
    }

    parseTestFailures(output) {
        const issues = [];
        const lines = output.split('\n');
        
        lines.forEach(line => {
            if (line.includes('FAIL ') && line.includes('.test.')) {
                const match = line.match(/FAIL\\s+(.+\\.test\\.[jt]sx?)/);
                if (match) {
                    issues.push({
                        type: 'test-failure',
                        file: match[1],
                        module: this.extractModule(match[1]),
                        priority: this.calculateTestPriority(match[1]),
                        description: `Test en échec: ${path.basename(match[1])}`
                    });
                }
            }
        });
        
        return issues;
    }

    parseEslintErrors(output) {
        const issues = [];
        
        try {
            const results = JSON.parse(output);
            
            results.forEach(file => {
                if (file.errorCount > 0) {
                    issues.push({
                        type: 'eslint-error',
                        file: file.filePath,
                        module: this.extractModule(file.filePath),
                        priority: 70,
                        count: file.errorCount,
                        description: `${file.errorCount} erreurs ESLint dans ${path.basename(file.filePath)}`
                    });
                }
            });
        } catch (e) {
            // JSON parsing failed, ignore
        }
        
        return issues;
    }

    parseTypeScriptErrors(output) {
        const issues = [];
        const lines = output.split('\n');
        
        const errorFiles = new Set();
        
        lines.forEach(line => {
            const match = line.match(/(.+\\.tsx?)\\(\\d+,\\d+\\): error TS\\d+:/);
            if (match) {
                const file = match[1];
                if (!errorFiles.has(file)) {
                    errorFiles.add(file);
                    issues.push({
                        type: 'typescript-error',
                        file,
                        module: this.extractModule(file),
                        priority: 80,
                        description: `Erreur TypeScript dans ${path.basename(file)}`
                    });
                }
            }
        });
        
        return issues;
    }

    extractModule(filePath) {
        if (filePath.includes('/leaves/')) return 'leaves';
        if (filePath.includes('/auth/')) return 'auth';
        if (filePath.includes('/services/')) return 'services';
        if (filePath.includes('/hooks/')) return 'hooks';
        if (filePath.includes('/components/')) return 'components';
        if (filePath.includes('/utils/')) return 'utils';
        if (filePath.includes('/types/')) return 'types';
        return 'other';
    }

    calculateTestPriority(testFile) {
        if (testFile.includes('auth')) return 100;
        if (testFile.includes('leaves')) return 95;
        if (testFile.includes('services')) return 90;
        if (testFile.includes('hooks')) return 85;
        if (testFile.includes('components')) return 80;
        return 70;
    }

    createOptimalBatches(issues) {
        // Grouper par module et type
        const grouped = issues.reduce((acc, issue) => {
            const key = `${issue.module}-${issue.type}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(issue);
            return acc;
        }, {});

        // Créer des batches optimaux
        const batches = [];
        
        Object.entries(grouped).forEach(([key, groupIssues]) => {
            const [module, type] = key.split('-');
            
            // Diviser en chunks de taille optimale
            for (let i = 0; i < groupIssues.length; i += this.batchSize) {
                const chunk = groupIssues.slice(i, i + this.batchSize);
                
                batches.push({
                    id: `worker-${module}-${type}-batch${Math.floor(i / this.batchSize) + 1}`,
                    module,
                    type,
                    issues: chunk,
                    priority: Math.max(...chunk.map(issue => issue.priority)),
                    estimatedTime: this.estimateTime(chunk)
                });
            }
        });

        // Trier par priorité et limiter
        return batches
            .sort((a, b) => b.priority - a.priority)
            .slice(0, this.maxPrompts);
    }

    estimateTime(issues) {
        const timeByType = {
            'test-failure': 8,
            'eslint-error': 3,
            'typescript-error': 5
        };
        
        return issues.reduce((total, issue) => {
            return total + (timeByType[issue.type] || 5);
        }, 0);
    }

    generateBatchPrompts(batches) {
        const prompts = [];
        
        batches.forEach(batch => {
            const promptContent = this.createIntelligentPrompt(batch);
            const promptFile = path.join(this.workersDir, `${batch.id}-prompt.md`);
            
            fs.writeFileSync(promptFile, promptContent);
            
            prompts.push({
                id: batch.id,
                file: promptFile,
                batch,
                priority: batch.priority
            });
            
            console.log(`📝 Prompt généré: ${batch.id} (${batch.issues.length} problèmes, ${batch.estimatedTime}min)`);
        });
        
        return prompts;
    }

    createIntelligentPrompt(batch) {
        const priorityEmoji = batch.priority >= 90 ? '🔥🔥🔥' : batch.priority >= 80 ? '🔥🔥' : '🔥';
        const typeDescription = {
            'test-failure': 'Réparation de Tests',
            'eslint-error': 'Correction ESLint',
            'typescript-error': 'Correction TypeScript'
        }[batch.type] || 'Réparation Générale';

        return `# CLAUDE CODE WORKER: ${batch.id.toUpperCase()}

## 🎯 MISSION BATCH INTELLIGENTE
**Spécialité**: ${typeDescription} - Module ${batch.module}
**Priorité**: ${priorityEmoji} ${batch.priority >= 90 ? 'CRITIQUE' : batch.priority >= 80 ? 'HAUTE' : 'MOYENNE'}
**Temps estimé**: ${batch.estimatedTime} min
**Problèmes à résoudre**: ${batch.issues.length}

## 📋 LISTE DES PROBLÈMES À RÉSOUDRE

${batch.issues.map((issue, index) => `
### ${index + 1}. ${issue.description}
- **Fichier**: \`${issue.file}\`
- **Type**: ${issue.type}
- **Module**: ${issue.module}
${issue.count ? `- **Nombre d'erreurs**: ${issue.count}` : ''}
`).join('')}

## 🛠️ WORKFLOW BATCH OPTIMISÉ

### Étape 1: Diagnostic en Lot
\`\`\`bash
# Tests spécifiques au module ${batch.module}
npm test -- --testPathPattern="${batch.module}" --verbose

# ESLint spécifique au module
npx eslint src/modules/${batch.module}/ src/services/*${batch.module}* src/hooks/*${batch.module}* --format=compact

# TypeScript check ciblé
npx tsc --noEmit --skipLibCheck
\`\`\`

### Étape 2: Réparation Systématique
${this.generateRepairInstructions(batch)}

### Étape 3: Validation Batch
\`\`\`bash
# Validation du module complet
npm test -- --testPathPattern="${batch.module}" --coverage
npx eslint src/modules/${batch.module}/ --quiet
echo "✅ Module ${batch.module} validé"
\`\`\`

## 🎯 CRITÈRES DE SUCCÈS BATCH
- ✅ **${batch.issues.length}/${batch.issues.length} problèmes résolus**
- ✅ **Tous les tests du module ${batch.module} passent**
- ✅ **0 erreur ESLint dans le module**
- ✅ **0 erreur TypeScript dans le module**
- ✅ **Temps d'exécution < 30 secondes**
- ✅ **Pas de régression sur les autres modules**

## 🚨 RÈGLES BATCH CRITIQUES
- **FOCUS MODULE**: Rester dans le module ${batch.module}
- **RÉPARATION PROGRESSIVE**: Résoudre un problème à la fois
- **VALIDATION IMMÉDIATE**: Tester après chaque réparation
- **PATTERNS COHÉRENTS**: Utiliser les mêmes solutions pour les mêmes types de problèmes
- **AUTO-DESTRUCTION**: Détruire ce prompt après succès complet

## 📊 AUTO-DESTRUCTION ET REPORTING
À la fin de la mission, exécuter ces commandes:

\`\`\`bash
# Créer le rapport de succès
echo "🎯 WORKER: ${batch.id}" >> WORKERS_BATCH_COMPLETED.log
echo "📊 STATUT: ✅ SUCCÈS COMPLET" >> WORKERS_BATCH_COMPLETED.log
echo "🔧 PROBLÈMES RÉSOLUS: ${batch.issues.length}/${batch.issues.length}" >> WORKERS_BATCH_COMPLETED.log
echo "⏱️ TEMPS RÉEL: XX minutes" >> WORKERS_BATCH_COMPLETED.log
echo "🎨 MODULE: ${batch.module} (${batch.type})" >> WORKERS_BATCH_COMPLETED.log
echo "---" >> WORKERS_BATCH_COMPLETED.log

# AUTO-DESTRUCTION du prompt (succès uniquement)
rm "${batch.id}-prompt.md"
echo "🗑️ Prompt ${batch.id} auto-détruit après succès complet"

# Notifier le manager
node scripts/claude-workers-manager.js complete ${batch.id} true
\`\`\`

## 🔄 WORKFLOW ULTRA-OPTIMISÉ
1. **Diagnostic global** du module ${batch.module}
2. **Réparation en lot** des ${batch.issues.length} problèmes
3. **Validation continue** après chaque réparation
4. **Rapport final** + auto-destruction

**ATTENTION**: Ne pas passer au problème suivant tant que le précédent n'est pas 100% résolu et validé.

GO BATCH! 🚀⚡

---
**Généré automatiquement**: ${new Date().toISOString()}
**Auto-destruction**: Après succès complet uniquement
**Manager**: auto-prompt-generator v2.0
**Batch**: ${batch.issues.length} problèmes groupés intelligemment`;
    }

    generateRepairInstructions(batch) {
        const instructions = {
            'test-failure': `
**Stratégie de réparation des tests**:
1. **Lire chaque fichier de test** avec l'outil Read
2. **Identifier les patterns d'erreurs** (imports, mocks, API obsolètes)
3. **Appliquer les corrections systématiques**:
   - Imports: utiliser @/ aliases
   - Mocks: suivre les patterns de jest.setup.js
   - APIs: adapter aux nouvelles versions (React Query v5, etc.)
   - DOM: utiliser jsdom quand nécessaire
4. **Valider immédiatement** chaque test réparé
5. **Passer au test suivant** seulement si le précédent passe`,

            'eslint-error': `
**Stratégie de correction ESLint**:
1. **Lister les erreurs** avec npx eslint --format=json
2. **Grouper par type** (imports inutilisés, syntaxe, etc.)
3. **Appliquer les fixes automatiques** avec --fix quand possible
4. **Corriger manuellement** les erreurs complexes:
   - Imports/exports manquants
   - Variables non utilisées
   - Règles TypeScript
5. **Valider** avec npx eslint --quiet`,

            'typescript-error': `
**Stratégie de correction TypeScript**:
1. **Analyser les erreurs** avec npx tsc --noEmit
2. **Identifier les patterns** (types manquants, imports incorrects)
3. **Corriger systématiquement**:
   - Ajouter les types manquants
   - Corriger les imports de types
   - Résoudre les conflits d'interfaces
   - Mettre à jour les déclarations obsolètes
4. **Valider** avec npx tsc --noEmit`
        };

        return instructions[batch.type] || 'Instructions de réparation générale';
    }
}

// CLI Interface
if (require.main === module) {
    const generator = new AutoPromptGenerator();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'generate':
            generator.generateIntelligentPrompts().then(() => {
                console.log('✅ Génération terminée');
            }).catch(error => {
                console.error('❌ Erreur lors de la génération:', error.message);
            });
            break;
            
        default:
            console.log(`
🧠 AUTO PROMPT GENERATOR V2.0

Usage:
  node auto-prompt-generator.js generate    # Générer des prompts intelligents

Fonctionnalités:
  - Analyse en temps réel des problèmes
  - Groupage intelligent par module/type
  - Prompts batch optimisés (3 problèmes max par prompt)
  - Auto-destruction après succès
  - Estimation de temps réaliste
            `);
    }
}

module.exports = AutoPromptGenerator;