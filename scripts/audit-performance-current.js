#!/usr/bin/env node

/**
 * Audit Performance Complet
 * Analyse les performances actuelles de l'application avec l'infrastructure monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class PerformanceAuditor {
    constructor() {
        this.results = {
            timestamp: Date.now(),
            audit: {
                bundle: {},
                api: {},
                database: {},
                lighthouse: {},
                vitals: {},
                recommendations: []
            }
        };
        
        this.resultsDir = path.join(__dirname, '../results');
        this.ensureResultsDir();
    }

    ensureResultsDir() {
        if (!fs.existsSync(this.resultsDir)) {
            fs.mkdirSync(this.resultsDir, { recursive: true });
        }
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level}] ${message}`);
    }

    async runFullAudit() {
        this.log('🚀 Démarrage de l\'audit performance complet');
        
        try {
            await this.analyzeBundleSize();
            await this.analyzeApiPerformance();
            await this.analyzeDatabaseQueries();
            await this.runLighthouseAudit();
            await this.analyzeCoreWebVitals();
            await this.analyzeMemoryUsage();
            await this.generateRecommendations();
            await this.saveResults();
            await this.generateReport();
            
            this.log('✅ Audit performance terminé avec succès');
            
        } catch (error) {
            this.log(`❌ Erreur durant l'audit: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async analyzeBundleSize() {
        this.log('📦 Analyse de la taille des bundles...');
        
        try {
            // Analyser .next/static si build existe
            const nextDir = path.join(__dirname, '../.next');
            const distDir = path.join(__dirname, '../dist');
            
            let bundleInfo = {};
            
            if (fs.existsSync(nextDir)) {
                bundleInfo = await this.analyzeNextjsBundle(nextDir);
            } else if (fs.existsSync(distDir)) {
                bundleInfo = await this.analyzeDistBundle(distDir);
            } else {
                this.log('⚠️ Aucun build trouvé, génération d\'un build pour analyse...');
                await this.buildForAnalysis();
                bundleInfo = await this.analyzeNextjsBundle(nextDir);
            }
            
            this.results.audit.bundle = bundleInfo;
            this.log(`📊 Bundle principal: ${(bundleInfo.mainSize / 1024).toFixed(2)} KB`);
            
        } catch (error) {
            this.log(`❌ Erreur analyse bundle: ${error.message}`, 'ERROR');
            this.results.audit.bundle = { error: error.message };
        }
    }

    async buildForAnalysis() {
        this.log('🔨 Génération du build pour analyse...');
        try {
            execSync('npm run build', { 
                cwd: path.join(__dirname, '..'),
                stdio: 'pipe'
            });
        } catch (error) {
            this.log('⚠️ Build échoué, utilisation des métriques alternatives');
        }
    }

    async analyzeNextjsBundle(nextDir) {
        const bundleInfo = {
            mainSize: 0,
            chunks: [],
            totalSize: 0,
            gzippedSize: 0
        };

        try {
            const staticDir = path.join(nextDir, 'static');
            if (!fs.existsSync(staticDir)) {
                return bundleInfo;
            }

            const walkDir = (dir) => {
                const files = fs.readdirSync(dir);
                
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        walkDir(filePath);
                    } else if (file.endsWith('.js')) {
                        const size = stat.size;
                        bundleInfo.totalSize += size;
                        
                        if (file.includes('main') || file.includes('app')) {
                            bundleInfo.mainSize += size;
                        }
                        
                        bundleInfo.chunks.push({
                            name: file,
                            size: size,
                            sizeKB: (size / 1024).toFixed(2)
                        });
                    }
                });
            };

            walkDir(staticDir);
            
            // Trier par taille
            bundleInfo.chunks.sort((a, b) => b.size - a.size);
            bundleInfo.chunks = bundleInfo.chunks.slice(0, 10); // Top 10
            
        } catch (error) {
            this.log(`⚠️ Erreur lecture bundle: ${error.message}`);
        }

        return bundleInfo;
    }

    async analyzeDistBundle(distDir) {
        // Similar logic for dist directory
        return {
            mainSize: 0,
            chunks: [],
            totalSize: 0,
            note: 'Dist directory analysis not fully implemented'
        };
    }

    async analyzeApiPerformance() {
        this.log('⚡ Analyse des performances API...');
        
        try {
            // Utiliser les métriques existantes
            const performanceFile = path.join(this.resultsDir, 'performance.json');
            let apiMetrics = {
                averageResponseTime: 0,
                slowestEndpoints: [],
                errorRate: 0,
                totalRequests: 0
            };

            if (fs.existsSync(performanceFile)) {
                const metrics = JSON.parse(fs.readFileSync(performanceFile, 'utf8'));
                const apiRequests = metrics.filter(m => m.type === 'api' || m.name?.includes('api'));
                
                if (apiRequests.length > 0) {
                    const totalTime = apiRequests.reduce((sum, req) => sum + req.duration, 0);
                    apiMetrics.averageResponseTime = totalTime / apiRequests.length;
                    apiMetrics.totalRequests = apiRequests.length;
                    
                    // Endpoints les plus lents
                    apiMetrics.slowestEndpoints = apiRequests
                        .sort((a, b) => b.duration - a.duration)
                        .slice(0, 5)
                        .map(req => ({
                            endpoint: req.name,
                            duration: req.duration,
                            status: req.status || 'unknown'
                        }));
                        
                    // Taux d'erreur
                    const errors = apiRequests.filter(req => req.status === 'SLOW' || req.status === 'ERROR');
                    apiMetrics.errorRate = errors.length / apiRequests.length;
                }
            }

            // Tests en temps réel des APIs critiques
            const criticalApis = [
                'http://localhost:3000/api/auth/me',
                'http://localhost:3000/api/planning',
                'http://localhost:3000/api/conges'
            ];

            const realTimeMetrics = await this.testApisRealTime(criticalApis);
            apiMetrics.realTime = realTimeMetrics;

            this.results.audit.api = apiMetrics;
            this.log(`📊 API moyenne: ${apiMetrics.averageResponseTime.toFixed(2)}ms`);
            
        } catch (error) {
            this.log(`❌ Erreur analyse API: ${error.message}`, 'ERROR');
            this.results.audit.api = { error: error.message };
        }
    }

    async testApisRealTime(apis) {
        const results = [];
        
        for (const apiUrl of apis) {
            try {
                const start = Date.now();
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    timeout: 5000
                });
                const duration = Date.now() - start;
                
                results.push({
                    url: apiUrl,
                    duration,
                    status: response.status,
                    success: response.ok
                });
                
            } catch (error) {
                results.push({
                    url: apiUrl,
                    duration: 5000,
                    status: 'ERROR',
                    error: error.message,
                    success: false
                });
            }
        }
        
        return results;
    }

    async analyzeDatabaseQueries() {
        this.log('🗄️ Analyse des performances base de données...');
        
        try {
            // Analyser le schéma Prisma pour optimisations potentielles
            const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
            let dbAnalysis = {
                tablesCount: 0,
                indexesFound: [],
                missingIndexes: [],
                recommendations: []
            };

            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                
                // Compter les modèles
                const models = schema.match(/model \w+/g) || [];
                dbAnalysis.tablesCount = models.length;
                
                // Trouver les indexes existants
                const indexes = schema.match(/@@index\([^)]+\)/g) || [];
                dbAnalysis.indexesFound = indexes;
                
                // Recommandations d'indexes manquants basées sur les patterns courants
                if (schema.includes('email') && !schema.includes('@@index([email])')) {
                    dbAnalysis.missingIndexes.push('User.email');
                }
                
                if (schema.includes('userId') && !schema.includes('@@index([userId])')) {
                    dbAnalysis.missingIndexes.push('*.userId (foreign keys)');
                }
                
                if (schema.includes('createdAt') && !schema.includes('@@index([createdAt])')) {
                    dbAnalysis.missingIndexes.push('*.createdAt (temporal queries)');
                }
                
                if (schema.includes('status') && !schema.includes('@@index([status])')) {
                    dbAnalysis.missingIndexes.push('*.status (filtering)');
                }
            }

            this.results.audit.database = dbAnalysis;
            this.log(`📊 Tables: ${dbAnalysis.tablesCount}, Indexes manquants: ${dbAnalysis.missingIndexes.length}`);
            
        } catch (error) {
            this.log(`❌ Erreur analyse DB: ${error.message}`, 'ERROR');
            this.results.audit.database = { error: error.message };
        }
    }

    async runLighthouseAudit() {
        this.log('🔍 Audit Lighthouse...');
        
        try {
            // Vérifier si lighthouse est installé
            let lighthouseResults = {};
            
            try {
                // Essayer d'exécuter lighthouse
                const result = execSync('npx lighthouse http://localhost:3000 --only-categories=performance --output=json --quiet', {
                    timeout: 60000,
                    encoding: 'utf8'
                });
                
                const lighthouse = JSON.parse(result);
                lighthouseResults = {
                    performanceScore: lighthouse.lhr.categories.performance.score * 100,
                    metrics: {
                        firstContentfulPaint: lighthouse.lhr.audits['first-contentful-paint'].numericValue,
                        largestContentfulPaint: lighthouse.lhr.audits['largest-contentful-paint'].numericValue,
                        firstInputDelay: lighthouse.lhr.audits['max-potential-fid'].numericValue,
                        cumulativeLayoutShift: lighthouse.lhr.audits['cumulative-layout-shift'].numericValue
                    }
                };
                
            } catch (error) {
                this.log('⚠️ Lighthouse non disponible, utilisation de métriques alternatives');
                lighthouseResults = {
                    performanceScore: null,
                    error: 'Lighthouse non disponible',
                    alternatives: 'Utiliser les Core Web Vitals intégrés'
                };
            }

            this.results.audit.lighthouse = lighthouseResults;
            
            if (lighthouseResults.performanceScore) {
                this.log(`📊 Score Lighthouse: ${lighthouseResults.performanceScore}/100`);
            }
            
        } catch (error) {
            this.log(`❌ Erreur Lighthouse: ${error.message}`, 'ERROR');
            this.results.audit.lighthouse = { error: error.message };
        }
    }

    async analyzeCoreWebVitals() {
        this.log('📈 Analyse Core Web Vitals...');
        
        try {
            // Utiliser les métriques du monitoring service
            const vitalsFile = path.join(this.resultsDir, 'performance.json');
            let vitalsData = {
                LCP: null,
                FID: null,
                CLS: null,
                status: 'no-data'
            };

            if (fs.existsSync(vitalsFile)) {
                const metrics = JSON.parse(fs.readFileSync(vitalsFile, 'utf8'));
                const vitalsMetrics = metrics.filter(m => 
                    m.name === 'LCP' || m.name === 'FID' || m.name === 'CLS'
                );

                vitalsMetrics.forEach(metric => {
                    vitalsData[metric.name] = metric.duration;
                });

                if (vitalsMetrics.length > 0) {
                    vitalsData.status = 'data-available';
                }
            }

            // Évaluer les seuils
            vitalsData.evaluation = {
                LCP: vitalsData.LCP ? (vitalsData.LCP < 2500 ? 'GOOD' : vitalsData.LCP < 4000 ? 'NEEDS_IMPROVEMENT' : 'POOR') : 'NO_DATA',
                FID: vitalsData.FID ? (vitalsData.FID < 100 ? 'GOOD' : vitalsData.FID < 300 ? 'NEEDS_IMPROVEMENT' : 'POOR') : 'NO_DATA',
                CLS: vitalsData.CLS ? (vitalsData.CLS < 0.1 ? 'GOOD' : vitalsData.CLS < 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR') : 'NO_DATA'
            };

            this.results.audit.vitals = vitalsData;
            this.log(`📊 Core Web Vitals: LCP=${vitalsData.LCP}ms, FID=${vitalsData.FID}ms, CLS=${vitalsData.CLS}`);
            
        } catch (error) {
            this.log(`❌ Erreur Web Vitals: ${error.message}`, 'ERROR');
            this.results.audit.vitals = { error: error.message };
        }
    }

    async analyzeMemoryUsage() {
        this.log('🧠 Analyse utilisation mémoire...');
        
        try {
            const memoryUsage = process.memoryUsage();
            
            const memoryData = {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
                rss: memoryUsage.rss,
                heapUsagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
                formatted: {
                    heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
                    heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
                    rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2)
                }
            };

            this.results.audit.memory = memoryData;
            this.log(`📊 Mémoire: ${memoryData.formatted.heapUsedMB}MB / ${memoryData.formatted.heapTotalMB}MB (${memoryData.heapUsagePercent.toFixed(1)}%)`);
            
        } catch (error) {
            this.log(`❌ Erreur mémoire: ${error.message}`, 'ERROR');
            this.results.audit.memory = { error: error.message };
        }
    }

    async generateRecommendations() {
        this.log('💡 Génération des recommandations...');
        
        const recommendations = [];

        // Recommandations Bundle
        if (this.results.audit.bundle.mainSize > 500 * 1024) { // > 500KB
            recommendations.push({
                type: 'bundle',
                priority: 'HIGH',
                title: 'Bundle trop volumineux',
                description: `Bundle principal: ${(this.results.audit.bundle.mainSize / 1024).toFixed(2)}KB (objectif: <250KB)`,
                actions: ['Implémenter code splitting', 'Tree shaking', 'Lazy loading des composants']
            });
        }

        // Recommandations API
        if (this.results.audit.api.averageResponseTime > 200) {
            recommendations.push({
                type: 'api',
                priority: 'HIGH',
                title: 'APIs lentes',
                description: `Temps de réponse moyen: ${this.results.audit.api.averageResponseTime.toFixed(2)}ms (objectif: <200ms)`,
                actions: ['Cache Redis', 'Optimisation requêtes DB', 'Pagination', 'Indexes DB']
            });
        }

        // Recommandations Database
        if (this.results.audit.database.missingIndexes?.length > 0) {
            recommendations.push({
                type: 'database',
                priority: 'MEDIUM',
                title: 'Indexes manquants',
                description: `${this.results.audit.database.missingIndexes.length} indexes manquants détectés`,
                actions: ['Créer indexes sur colonnes fréquemment utilisées', 'Optimiser requêtes N+1']
            });
        }

        // Recommandations Core Web Vitals
        const vitals = this.results.audit.vitals.evaluation;
        if (vitals?.LCP === 'POOR' || vitals?.FID === 'POOR' || vitals?.CLS === 'POOR') {
            recommendations.push({
                type: 'vitals',
                priority: 'HIGH',
                title: 'Core Web Vitals à améliorer',
                description: `LCP: ${vitals.LCP}, FID: ${vitals.FID}, CLS: ${vitals.CLS}`,
                actions: ['Optimiser images', 'Préchargement critique', 'Layout stable']
            });
        }

        // Recommandations mémoire
        if (this.results.audit.memory?.heapUsagePercent > 80) {
            recommendations.push({
                type: 'memory',
                priority: 'MEDIUM',
                title: 'Utilisation mémoire élevée',
                description: `${this.results.audit.memory.heapUsagePercent.toFixed(1)}% de la heap utilisée`,
                actions: ['Analyser fuites mémoire', 'Optimiser caches', 'Garbage collection']
            });
        }

        this.results.audit.recommendations = recommendations;
        this.log(`💡 ${recommendations.length} recommandations générées`);
    }

    async saveResults() {
        const resultsFile = path.join(this.resultsDir, 'performance-audit-current.json');
        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        this.log(`💾 Résultats sauvegardés: ${resultsFile}`);
    }

    async generateReport() {
        this.log('📊 Génération du rapport...');
        
        const reportPath = path.join(this.resultsDir, 'performance-audit-report.md');
        const audit = this.results.audit;
        
        let report = `# 📊 Audit Performance - ${new Date().toLocaleDateString()}

## 🎯 Résumé Exécutif

**Objectifs PHASE 1:**
- Pages < 1s (actuellement: ${audit.vitals.LCP ? (audit.vitals.LCP/1000).toFixed(1) + 's' : 'N/A'})
- API < 200ms (actuellement: ${audit.api.averageResponseTime ? audit.api.averageResponseTime.toFixed(0) + 'ms' : 'N/A'})
- Score Lighthouse > 95 (actuellement: ${audit.lighthouse.performanceScore || 'N/A'})

## 📦 Bundle Analysis

- **Taille principale**: ${audit.bundle.mainSize ? (audit.bundle.mainSize / 1024).toFixed(2) + ' KB' : 'N/A'}
- **Taille totale**: ${audit.bundle.totalSize ? (audit.bundle.totalSize / 1024).toFixed(2) + ' KB' : 'N/A'}
- **Status**: ${audit.bundle.mainSize > 500 * 1024 ? '🔴 TROP VOLUMINEUX' : '🟢 ACCEPTABLE'}

### Top Chunks
${audit.bundle.chunks ? audit.bundle.chunks.map(chunk => 
    `- ${chunk.name}: ${chunk.sizeKB} KB`
).join('\n') : 'Aucune donnée'}

## ⚡ Performance API

- **Temps moyen**: ${audit.api.averageResponseTime ? audit.api.averageResponseTime.toFixed(2) + 'ms' : 'N/A'}
- **Requêtes totales**: ${audit.api.totalRequests || 0}
- **Taux d'erreur**: ${audit.api.errorRate ? (audit.api.errorRate * 100).toFixed(1) + '%' : 'N/A'}
- **Status**: ${audit.api.averageResponseTime > 200 ? '🔴 LENT' : '🟢 RAPIDE'}

### Endpoints les plus lents
${audit.api.slowestEndpoints ? audit.api.slowestEndpoints.map(endpoint => 
    `- ${endpoint.endpoint}: ${endpoint.duration}ms`
).join('\n') : 'Aucune donnée'}

## 🗄️ Base de Données

- **Tables**: ${audit.database.tablesCount || 0}
- **Indexes trouvés**: ${audit.database.indexesFound?.length || 0}
- **Indexes manquants**: ${audit.database.missingIndexes?.length || 0}
- **Status**: ${audit.database.missingIndexes?.length > 0 ? '🔴 OPTIMISATIONS NÉCESSAIRES' : '🟢 OPTIMISÉ'}

### Indexes à créer
${audit.database.missingIndexes ? audit.database.missingIndexes.map(index => 
    `- ${index}`
).join('\n') : 'Aucun'}

## 📈 Core Web Vitals

- **LCP**: ${audit.vitals.LCP ? audit.vitals.LCP + 'ms' : 'N/A'} (${audit.vitals.evaluation?.LCP || 'N/A'})
- **FID**: ${audit.vitals.FID ? audit.vitals.FID + 'ms' : 'N/A'} (${audit.vitals.evaluation?.FID || 'N/A'})
- **CLS**: ${audit.vitals.CLS || 'N/A'} (${audit.vitals.evaluation?.CLS || 'N/A'})

## 🧠 Mémoire

- **Utilisée**: ${audit.memory?.formatted?.heapUsedMB || 'N/A'} MB
- **Totale**: ${audit.memory?.formatted?.heapTotalMB || 'N/A'} MB
- **Pourcentage**: ${audit.memory?.heapUsagePercent ? audit.memory.heapUsagePercent.toFixed(1) + '%' : 'N/A'}

## 💡 Recommandations Prioritaires

${audit.recommendations ? audit.recommendations.map(rec => 
    `### ${rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'} ${rec.title}
    
**Problème**: ${rec.description}

**Actions recommandées**:
${rec.actions.map(action => `- ${action}`).join('\n')}
`
).join('\n') : 'Aucune recommandation'}

## 🚀 Plan d'Action Immédiat

### Phase 1A - Quick Wins (1-2 jours)
${audit.recommendations?.filter(r => r.priority === 'HIGH').map(r => `- ${r.title}`).join('\n') || '- Aucune action urgente'}

### Phase 1B - Optimisations (2-3 jours)  
${audit.recommendations?.filter(r => r.priority === 'MEDIUM').map(r => `- ${r.title}`).join('\n') || '- Aucune optimisation'}

---

**Audit généré**: ${new Date().toISOString()}
**Outils**: Infrastructure monitoring bulletproof
`;

        fs.writeFileSync(reportPath, report);
        this.log(`📄 Rapport généré: ${reportPath}`);
        
        // Afficher résumé dans la console
        console.log('\n' + '='.repeat(50));
        console.log('📊 RÉSUMÉ AUDIT PERFORMANCE');
        console.log('='.repeat(50));
        console.log(`Bundle: ${audit.bundle.mainSize ? (audit.bundle.mainSize / 1024).toFixed(2) + ' KB' : 'N/A'}`);
        console.log(`API: ${audit.api.averageResponseTime ? audit.api.averageResponseTime.toFixed(2) + 'ms' : 'N/A'}`);
        console.log(`LCP: ${audit.vitals.LCP ? audit.vitals.LCP + 'ms' : 'N/A'}`);
        console.log(`Recommandations: ${audit.recommendations?.length || 0}`);
        console.log('='.repeat(50) + '\n');
    }
}

// CLI Interface
if (require.main === module) {
    const auditor = new PerformanceAuditor();
    
    auditor.runFullAudit()
        .then(() => {
            console.log('✅ Audit terminé avec succès');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur durant l\'audit:', error.message);
            process.exit(1);
        });
}

module.exports = PerformanceAuditor;