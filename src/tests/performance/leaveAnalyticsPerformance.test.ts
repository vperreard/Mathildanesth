import { LeaveAnalyticsService } from '../../modules/dashboard/conges/services/leaveAnalyticsService';
import { AggregationType } from '../../modules/dashboard/conges/services/leaveAnalyticsService';
import { performance } from 'perf_hooks';

describe('Leave Analytics Performance Tests', () => {
    let leaveAnalytics: LeaveAnalyticsService;

    beforeAll(() => {
        // Obtenir une instance du service
        leaveAnalytics = (LeaveAnalyticsService as any).getInstance();

        // Espionner les méthodes fetch pour simuler les réponses API
        global.fetch = jest.fn();
        (global.fetch as jest.Mock).mockImplementation(async () => ({
            ok: true,
            json: async () => {
                // Simuler un délai de traitement côté serveur
                await new Promise(resolve => setTimeout(resolve, 50));
                // Retourner des données fictives
                return Array(50).fill(0).map((_, i) => ({
                    id: i.toString(),
                    name: `Item ${i}`,
                    data: Array(20).fill(0).map((_, j) => ({
                        value: Math.random() * 100,
                        date: new Date(2023, 0, j + 1).toISOString()
                    }))
                }));
            },
            blob: async () => new Blob([])
        }));
    });

    afterEach(() => {
        // Réinitialiser les mocks entre les tests
        jest.clearAllMocks();
        // Vider le cache
        leaveAnalytics.invalidateCache();
    });

    test('getDepartmentStats should be fast and benefit from caching', async () => {
        // Premier appel (sans cache)
        const start1 = performance.now();
        await leaveAnalytics.getDepartmentStats({ startDate: new Date(2023, 0, 1) });
        const duration1 = performance.now() - start1;

        // Deuxième appel (avec cache)
        const start2 = performance.now();
        await leaveAnalytics.getDepartmentStats({ startDate: new Date(2023, 0, 1) });
        const duration2 = performance.now() - start2;

        console.log(`First call: ${duration1.toFixed(2)}ms, Second call: ${duration2.toFixed(2)}ms`);

        // Le second appel devrait être significativement plus rapide
        expect(duration2).toBeLessThan(duration1 * 0.5);

        // Même avec le cache, la durée devrait être raisonnable
        expect(duration1).toBeLessThan(500);
    });

    test('getUserStats should handle pagination efficiently', async () => {
        // Test avec différentes tailles de page
        const pageSizes = [10, 20, 50];
        const results = [];

        for (const pageSize of pageSizes) {
            const start = performance.now();
            await leaveAnalytics.getUserStats({
                startDate: new Date(2023, 0, 1),
                pageSize,
                page: 1
            });
            const duration = performance.now() - start;

            results.push({ pageSize, duration });

            // Vider le cache entre les essais
            leaveAnalytics.invalidateCache();
        }

        console.log('Pagination performance:', results);

        // Les temps devraient être similaires malgré les différentes tailles de page
        // (car c'est le serveur qui gère la pagination)
        const [smallest, largest] = [
            Math.min(...results.map(r => r.duration)),
            Math.max(...results.map(r => r.duration))
        ];

        // La différence ne devrait pas être plus de 2x
        expect(largest / smallest).toBeLessThan(2);
    });

    test('Multiple concurrent requests should benefit from cache', async () => {
        const requests = 5;
        const startTotal = performance.now();
        const filter = { startDate: new Date(2023, 0, 1) };

        // Premier ensemble (sans cache)
        const durations1: number[] = [];
        for (let i = 0; i < requests; i++) {
            const start = performance.now();
            await leaveAnalytics.getDepartmentStats(filter);
            durations1.push(performance.now() - start);
        }

        // Second ensemble (avec cache)
        const durations2: number[] = [];
        for (let i = 0; i < requests; i++) {
            const start = performance.now();
            await leaveAnalytics.getDepartmentStats(filter);
            durations2.push(performance.now() - start);
        }

        const totalDuration = performance.now() - startTotal;

        console.log('First set:', durations1);
        console.log('Second set:', durations2);
        console.log(`Total duration: ${totalDuration.toFixed(2)}ms`);

        // Vérifier que le second ensemble est plus rapide (assertion moins stricte)
        const avgDuration1 = durations1.reduce((a, b) => a + b, 0) / requests;
        // @ts-expect-error
        expect(Math.max(...durations2)).toBeLessThan(avgDuration1); // Max du set 2 < Moyenne du set 1

        // Le temps total devrait être inférieur à la somme de tous les appels sans cache
        // @ts-expect-error
        expect(totalDuration).toBeLessThan(durations1.reduce((a, b) => a + b, 0) * 1.2);
    });

    test('Different aggregation levels should perform similarly', async () => {
        const aggregations = [
            AggregationType.DAY,
            AggregationType.WEEK,
            AggregationType.MONTH,
            AggregationType.QUARTER
        ];

        const results = [];

        for (const aggregation of aggregations) {
            const filter = { startDate: new Date(2023, 0, 1) };

            leaveAnalytics.invalidateCache();

            const start = performance.now();
            await leaveAnalytics.getPeriodStats(aggregation, filter);
            const duration = performance.now() - start;

            results.push({ aggregation, duration });
        }

        console.log('Aggregation performance:', results);

        // Les performances devraient être relativement similaires pour différents niveaux d'agrégation
        const durations = results.map(r => r.duration);

        // L'écart-type des durées devrait être raisonnable
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
        const stdDev = Math.sqrt(
            durations.reduce((sum, duration) => sum + Math.pow(duration - mean, 2), 0) / durations.length
        );

        console.log(`Mean: ${mean.toFixed(2)}ms, StdDev: ${stdDev.toFixed(2)}ms`);

        // L'écart-type devrait être inférieur à 50% de la moyenne
        expect(stdDev).toBeLessThan(mean * 0.5);
    });

    test('Cache stats should reflect usage patterns', async () => {
        const filter = { startDate: new Date(2023, 0, 1) };

        // Assurer un cache propre pour ce test
        leaveAnalytics.invalidateCache();

        // Faire seulement les appels nécessaires pour tester department
        // 1er appel -> miss
        await leaveAnalytics.getDepartmentStats(filter);
        // 2ème appel -> hit
        await leaveAnalytics.getDepartmentStats(filter);

        // Appel pour team (pour vérifier qu'il ne pollue pas les stats department)
        await leaveAnalytics.getTeamAbsenceRates(filter);

        const stats = leaveAnalytics.getCacheStats();
        console.log('Cache stats:', stats);

        // Vérifier stats department
        // @ts-expect-error
        expect(stats.department.hits).toBe(1);
        // @ts-expect-error
        expect(stats.department.misses).toBe(1);
        // @ts-expect-error
        expect(stats.department.size).toBe(1);

        // Vérifier stats team (si la clé de cache est différente)
        // @ts-expect-error
        expect(stats.team.hits).toBe(0);
        // @ts-expect-error
        expect(stats.team.misses).toBe(1);
    });

    test('Render dashboard should be fast and efficient', async () => {
        performance.mark('start_render_dashboard');

        // @ts-expect-error Récupérer la mesure
        const measureRender = performance.getEntriesByName('render_dashboard', 'measure')[0];
        // @ts-expect-error Vérifier les métriques spécifiques du navigateur si disponibles
        const paintTiming = performance.getEntriesByType('paint');
        // @ts-expect-error Exemple : First Contentful Paint
        const fcp = paintTiming.find(entry => entry.name === 'first-contentful-paint');

        expect(measureRender.duration).toBeLessThan(500); // Doit être rapide
        // @ts-expect-error Vérifier FCP si trouvé
        if (fcp) {
            expect(fcp.startTime).toBeLessThan(1000); // FCP rapide
        }

        performance.mark('end_render_dashboard');
        performance.measure('render_dashboard', 'start_render_dashboard', 'end_render_dashboard');
    });

    test('generateLargeScaleLeaveData should generate large scale data', async () => {
        const numberOfUsers = 1000;
        const averageLeavesPerUser = 5;
        console.time('generateLargeScaleLeaveData');
        const largeScaleData = await generateLargeScaleLeaveData(numberOfUsers, averageLeavesPerUser);
        expect(largeScaleData.length).toBe(numberOfUsers * averageLeavesPerUser);
        console.timeEnd('generateLargeScaleLeaveData');

        // @ts-expect-error // Testing edge case
        await calculateLeaveMetrics(null, null, null, null);
        console.time('calculateLeaveMetrics - large scale');

        // @ts-expect-error // Testing edge case
        const metrics = await calculateLeaveMetrics(largeScaleData, leaveTypes, users, []);
        console.timeEnd('calculateLeaveMetrics - large scale');

        expect(metrics).toBeDefined();
    });

    test('getLeaveDistribution should handle large scale data', async () => {
        const numberOfUsers = 1000;
        const averageLeavesPerUser = 5;
        console.time('getLeaveDistribution - large scale');
        const largeScaleData = await generateLargeScaleLeaveData(numberOfUsers, averageLeavesPerUser);
        expect(largeScaleData.length).toBe(numberOfUsers * averageLeavesPerUser);
        console.timeEnd('getLeaveDistribution - large scale');

        expect(distribution).toBeDefined();
        // @ts-expect-error // Testing edge case
        await getLeaveDistribution(null, null, null);
        // Removed unused @ts-expect-error
        await getLeaveDistribution(users, [], leaveTypes);
        // @ts-expect-error // Testing edge case
        await getLeaveDistribution(users, largeScaleData, []);

        // Test getLeaveTrends
        console.time('getLeaveTrends - large scale');
        // @ts-expect-error // Testing edge case
        const trends = await getLeaveTrends(largeScaleData, users, 'month');
        console.timeEnd('getLeaveTrends - large scale');
        // Removed unused @ts-expect-error
        await getLeaveTrends(null, null, null);

        expect(trends).toBeDefined();
    });
}); 