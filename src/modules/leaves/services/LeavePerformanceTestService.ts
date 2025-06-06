import { LeaveQueryCacheService } from './LeaveQueryCacheService';
import { EnhancedLeaveService } from './enhancedLeaveService';
import { LeaveFilters, LeaveStatus, LeaveType } from '../types/leave';
import { logger } from '@/lib/logger';
import { formatDate } from '@/utils/dateUtils';

interface PerformanceTestResult {
    testName: string;
    scenario: string;
    cacheEnabled: boolean;
    executionTimeMs: number;
    requestCount: number;
    averageTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
    cacheMissRate?: number;
    cacheHitRate?: number;
    timestamp: Date;
    memoryUsageMB?: number;
}

interface TestScenario {
    name: string;
    iterations: number;
    filters: LeaveFilters;
}

/**
 * Service de test de performance pour évaluer les gains du système de cache
 */
export class LeavePerformanceTestService {
    private cacheService: LeaveQueryCacheService;
    private leaveService: EnhancedLeaveService;
    private results: PerformanceTestResult[] = [];

    constructor() {
        this.cacheService = LeaveQueryCacheService.getInstance();
        this.leaveService = EnhancedLeaveService.getInstance();
    }

    /**
     * Exécute les tests de performance avec et sans cache
     */
    public async runTests(): Promise<PerformanceTestResult[]> {
        // Scénarios de test
        const scenarios: TestScenario[] = [
            {
                name: 'Liste des congés - Pas de filtre',
                iterations: 10,
                filters: {}
            },
            {
                name: 'Liste des congés - Filtre par utilisateur',
                iterations: 10,
                filters: { userId: '1' }
            },
            {
                name: 'Liste des congés - Filtre par statut',
                iterations: 10,
                filters: { status: LeaveStatus.EN_ATTENTE }
            },
            {
                name: 'Liste des congés - Filtres multiples',
                iterations: 10,
                filters: {
                    status: LeaveStatus.APPROUVE,
                    startDate: formatDate(new Date(new Date().getFullYear(), 0, 1)),
                    endDate: formatDate(new Date())
                }
            },
            {
                name: 'Liste des congés - Avec pagination',
                iterations: 10,
                filters: {
                    page: 1,
                    limit: 20
                }
            }
        ];

        // Nettoyer les résultats précédents
        this.results = [];

        // Tester chaque scénario
        for (const scenario of scenarios) {
            // Invalider complètement le cache avant les tests
            await this.cacheService.invalidateAll();

            // Test avec cache désactivé
            const withoutCacheResults = await this.runTestScenario(scenario, false);
            this.results.push(withoutCacheResults);

            // Invalider le cache à nouveau
            await this.cacheService.invalidateAll();

            // Test avec cache activé
            const withCacheResults = await this.runTestScenario(scenario, true);
            this.results.push(withCacheResults);

            // Attendre un peu entre les scénarios pour éviter de saturer le système
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Afficher le rapport de performance
        this.generatePerformanceReport();

        return this.results;
    }

    /**
     * Exécute un scénario de test
     */
    private async runTestScenario(scenario: TestScenario, cacheEnabled: boolean): Promise<PerformanceTestResult> {
        const times: number[] = [];
        const start = Date.now();
        let hitCount = 0;
        let missCount = 0;

        logger.info(`Exécution du test "${scenario.name}" ${cacheEnabled ? 'avec' : 'sans'} cache`);

        // Capture de l'utilisation mémoire avant
        const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

        for (let i = 0; i < scenario.iterations; i++) {
            const iterationStart = Date.now();

            try {
                if (cacheEnabled) {
                    // Vérifier si les données sont en cache avant la requête
                    const cacheKey = this.cacheService.generateListKey(scenario.filters);
                    const cachedData = await this.cacheService.getCachedData(cacheKey);

                    if (cachedData) {
                        hitCount++;
                    } else {
                        missCount++;
                    }
                }

                // Exécuter la requête
                await this.leaveService.fetchLeaves(scenario.filters);

                const iterationTime = Date.now() - iterationStart;
                times.push(iterationTime);
            } catch (error: unknown) {
                logger.error(`Erreur durant le test "${scenario.name}"`, { error });
            }
        }

        // Capture de l'utilisation mémoire après
        const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
        const memoryUsage = memAfter - memBefore;

        const totalTime = Date.now() - start;
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        // Calculer les taux de hit/miss pour le cache
        const totalRequests = hitCount + missCount;
        const hitRate = totalRequests > 0 ? hitCount / totalRequests : 0;
        const missRate = totalRequests > 0 ? missCount / totalRequests : 0;

        return {
            testName: scenario.name,
            scenario: JSON.stringify(scenario.filters),
            cacheEnabled,
            executionTimeMs: totalTime,
            requestCount: scenario.iterations,
            averageTimeMs: avgTime,
            minTimeMs: minTime,
            maxTimeMs: maxTime,
            cacheHitRate: hitRate,
            cacheMissRate: missRate,
            timestamp: new Date(),
            memoryUsageMB: memoryUsage
        };
    }

    /**
     * Génère un rapport de performance comparatif
     */
    private generatePerformanceReport(): void {
        logger.info('=== RAPPORT DE PERFORMANCE DU CACHE DE CONGÉS ===');

        // Grouper les résultats par scénario pour faciliter la comparaison
        const resultsByScenario: Record<string, PerformanceTestResult[]> = {};

        for (const result of this.results) {
            if (!resultsByScenario[result.testName]) {
                resultsByScenario[result.testName] = [];
            }
            resultsByScenario[result.testName].push(result);
        }

        // Afficher les comparaisons pour chaque scénario
        for (const [scenarioName, results] of Object.entries(resultsByScenario)) {
            logger.info(`\nScénario: ${scenarioName}`);

            // Trier les résultats: d'abord sans cache, puis avec cache
            results.sort((a, b) => {
                if (a.cacheEnabled === b.cacheEnabled) return 0;
                return a.cacheEnabled ? 1 : -1;
            });

            if (results.length >= 2) {
                const withoutCache = results[0];
                const withCache = results[1];

                const speedup = withoutCache.averageTimeMs / withCache.averageTimeMs;
                const improvement = ((withoutCache.averageTimeMs - withCache.averageTimeMs) / withoutCache.averageTimeMs) * 100;

                logger.info(`  Sans cache: ${withoutCache.averageTimeMs.toFixed(2)}ms (min: ${withoutCache.minTimeMs}ms, max: ${withoutCache.maxTimeMs}ms)`);
                logger.info(`  Avec cache: ${withCache.averageTimeMs.toFixed(2)}ms (min: ${withCache.minTimeMs}ms, max: ${withCache.maxTimeMs}ms)`);
                logger.info(`  Amélioration: ${improvement.toFixed(2)}% (${speedup.toFixed(2)}x plus rapide)`);
                logger.info(`  Taux de hit du cache: ${withCache.cacheHitRate ? (withCache.cacheHitRate * 100).toFixed(2) : 'N/A'}%`);
            }
        }

        logger.info('\n=== RÉSUMÉ ===');

        // Calcul des améliorations globales
        const withoutCacheResults = this.results.filter(r => !r.cacheEnabled);
        const withCacheResults = this.results.filter(r => r.cacheEnabled);

        if (withoutCacheResults.length > 0 && withCacheResults.length > 0) {
            const avgWithoutCache = withoutCacheResults.reduce((sum, r) => sum + r.averageTimeMs, 0) / withoutCacheResults.length;
            const avgWithCache = withCacheResults.reduce((sum, r) => sum + r.averageTimeMs, 0) / withCacheResults.length;

            const overallImprovement = ((avgWithoutCache - avgWithCache) / avgWithoutCache) * 100;
            const overallSpeedup = avgWithoutCache / avgWithCache;

            logger.info(`Amélioration globale des performances: ${overallImprovement.toFixed(2)}%`);
            logger.info(`Accélération globale: ${overallSpeedup.toFixed(2)}x`);

            // Taux de hit du cache global
            const totalHits = withCacheResults.reduce((sum, r) => sum + (r.cacheHitRate || 0) * r.requestCount, 0);
            const totalRequests = withCacheResults.reduce((sum, r) => sum + r.requestCount, 0);
            const globalHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

            logger.info(`Taux de hit du cache global: ${(globalHitRate * 100).toFixed(2)}%`);
        }

        logger.info('=== FIN DU RAPPORT ===');
    }

    /**
     * Exporte les résultats au format JSON
     */
    public exportResults(): string {
        return JSON.stringify(this.results, null, 2);
    }

    /**
     * Exécute un test de stress du cache
     */
    public async runStressTest(
        iterations: number = 100,
        concurrency: number = 10,
        invalidateEvery: number = 20
    ): Promise<void> {
        logger.info(`Démarrage du test de stress: ${iterations} itérations, concurrence ${concurrency}, invalidation tous les ${invalidateEvery}`);

        // Invalider le cache avant de commencer
        await this.cacheService.invalidateAll();

        const start = Date.now();
        let completedRequests = 0;
        let cacheHits = 0;
        let errors = 0;

        // Créer un tableau de promesses pour exécuter les requêtes en parallèle
        for (let i = 0; i < iterations; i++) {
            // Créer un lot de requêtes concurrentes
            const batch = Array(concurrency).fill(0).map(async (_, j) => {
                try {
                    // Utiliser différents filtres pour simuler diverses requêtes
                    const randomFilter: LeaveFilters = {
                        status: j % 3 === 0 ? LeaveStatus.APPROUVE :
                            j % 3 === 1 ? LeaveStatus.EN_ATTENTE :
                                LeaveStatus.REJETE,
                        page: 1 + (i % 5),
                        limit: 10 + (j % 5) * 10
                    };

                    // Pour certaines requêtes, ajouter des filtres supplémentaires
                    if (j % 2 === 0) {
                        randomFilter.userId = String(1 + (j % 5));
                    }

                    // Vérifier si on a un hit ou un miss
                    const cacheKey = this.cacheService.generateListKey(randomFilter);
                    const cachedData = await this.cacheService.getCachedData(cacheKey);

                    if (cachedData) {
                        cacheHits++;
                    }

                    // Exécuter la requête
                    await this.leaveService.fetchLeaves(randomFilter);
                    completedRequests++;
                } catch (error: unknown) {
                    errors++;
                    logger.error(`Erreur durant le test de stress`, { error, iteration: i, concurrent: j });
                }
            });

            // Attendre que le lot soit terminé
            await Promise.all(batch);

            // Invalider le cache périodiquement pour simuler des mises à jour
            if (i > 0 && i % invalidateEvery === 0) {
                logger.info(`Invalidation partielle du cache à l'itération ${i}`);
                // Simuler une mise à jour qui invaliderait une partie du cache
                await this.cacheService.invalidateCache(
                    Math.random() > 0.5 ? 'leave_updated' : 'leave_created',
                    { leave: { id: String(i), userId: String(i % 5) } }
                );
            }
        }

        const totalTime = Date.now() - start;
        const hitRate = completedRequests > 0 ? (cacheHits / completedRequests) * 100 : 0;

        logger.info('=== RÉSULTATS DU TEST DE STRESS ===');
        logger.info(`Requêtes complétées: ${completedRequests} sur ${iterations * concurrency}`);
        logger.info(`Erreurs: ${errors}`);
        logger.info(`Temps total: ${totalTime}ms`);
        logger.info(`Temps moyen par requête: ${(totalTime / completedRequests).toFixed(2)}ms`);
        logger.info(`Taux de hit du cache: ${hitRate.toFixed(2)}%`);
        logger.info(`Requêtes par seconde: ${((completedRequests / totalTime) * 1000).toFixed(2)}`);
        logger.info('====================================');
    }
}

// Exporter une instance du service
export const leavePerformanceTestService = new LeavePerformanceTestService(); 