import { performance } from 'perf_hooks';

// Tests de charge pour les API critiques

describe('API Load Testing', () => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const CONCURRENT_REQUESTS = 50;
    const TEST_DURATION_MS = 10000; // 10 secondes

    let authToken: string;

    beforeAll(async () => {
        // Obtenir un token d'authentification pour les tests
        const response = await fetch(`${BASE_URL}/api/auth/connexion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'test_password'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = `Bearer ${data.token}`;
        }
    });

    describe('GET /api/utilisateurs - Endpoint critique', () => {
        it('should handle concurrent requests efficiently', async () => {
            const requests = Array.from({ length: CONCURRENT_REQUESTS }, () =>
                fetch(`${BASE_URL}/api/utilisateurs`, {
                    headers: { Authorization: authToken }
                })
            );

            const startTime = performance.now();
            const responses = await Promise.all(requests);
            const endTime = performance.now();

            const totalTime = endTime - startTime;
            const avgResponseTime = totalTime / CONCURRENT_REQUESTS;

            // Vérifications
            expect(responses.every(r => r.status === 200)).toBe(true);
            expect(avgResponseTime).toBeLessThan(500); // Moins de 500ms en moyenne
            expect(totalTime).toBeLessThan(5000); // Toutes les requêtes en moins de 5s

            console.log(`${CONCURRENT_REQUESTS} requêtes simultanées en ${totalTime.toFixed(2)}ms`);
            console.log(`Temps de réponse moyen: ${avgResponseTime.toFixed(2)}ms`);
        });

        it('should maintain performance under sustained load', async () => {
            const results: number[] = [];
            const startTime = Date.now();

            while (Date.now() - startTime < TEST_DURATION_MS) {
                const requestStart = performance.now();
                
                const response = await fetch(`${BASE_URL}/api/utilisateurs?limit=10`, {
                    headers: { Authorization: authToken }
                });
                
                const requestEnd = performance.now();
                const responseTime = requestEnd - requestStart;

                expect(response.status).toBe(200);
                results.push(responseTime);

                // Petit délai pour éviter de surcharger
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Analyse des résultats
            const avgTime = results.reduce((a, b) => a + b) / results.length;
            const maxTime = Math.max(...results);
            const minTime = Math.min(...results);

            expect(avgTime).toBeLessThan(300);
            expect(maxTime).toBeLessThan(1000);

            console.log(`Test de charge ${TEST_DURATION_MS}ms:`);
            console.log(`- ${results.length} requêtes`);
            console.log(`- Temps moyen: ${avgTime.toFixed(2)}ms`);
            console.log(`- Min/Max: ${minTime.toFixed(2)}ms / ${maxTime.toFixed(2)}ms`);
        });
    });

    describe('POST /api/conges - Endpoint création', () => {
        it('should handle multiple leave creations efficiently', async () => {
            const leaveData = {
                leaveTypeCode: 'CP',
                startDate: '2024-06-01',
                endDate: '2024-06-05',
                reason: 'Test de charge'
            };

            const requests = Array.from({ length: 20 }, () =>
                fetch(`${BASE_URL}/api/conges`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: authToken
                    },
                    body: JSON.stringify({
                        ...leaveData,
                        startDate: `2024-06-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
                    })
                })
            );

            const startTime = performance.now();
            const responses = await Promise.all(requests);
            const endTime = performance.now();

            const successfulRequests = responses.filter(r => r.status === 201).length;
            const totalTime = endTime - startTime;

            expect(successfulRequests).toBeGreaterThan(15); // Au moins 75% de succès
            expect(totalTime).toBeLessThan(10000); // Moins de 10s pour 20 créations

            console.log(`${successfulRequests}/20 créations réussies en ${totalTime.toFixed(2)}ms`);
        });
    });

    describe('GET /api/planning/generate - Endpoint complexe', () => {
        it('should generate planning within acceptable time limits', async () => {
            const planningRequest = {
                startDate: '2024-01-01',
                endDate: '2024-01-07',
                siteId: 1,
                options: { useTemplate: true }
            };

            const startTime = performance.now();
            
            const response = await fetch(`${BASE_URL}/api/planning/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authToken
                },
                body: JSON.stringify(planningRequest)
            });

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(15000); // Moins de 15s pour génération

            const data = await response.json();
            expect(data.attributions).toBeDefined();

            console.log(`Génération de planning en ${responseTime.toFixed(2)}ms`);
        });

        it('should handle multiple planning generations concurrently', async () => {
            const requests = Array.from({ length: 3 }, (_, i) =>
                fetch(`${BASE_URL}/api/planning/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: authToken
                    },
                    body: JSON.stringify({
                        startDate: `2024-0${i + 1}-01`,
                        endDate: `2024-0${i + 1}-07`,
                        siteId: 1
                    })
                })
            );

            const startTime = performance.now();
            const responses = await Promise.all(requests);
            const endTime = performance.now();

            const successfulRequests = responses.filter(r => r.status === 200).length;
            const totalTime = endTime - startTime;

            expect(successfulRequests).toBe(3);
            expect(totalTime).toBeLessThan(30000); // 3 générations en moins de 30s

            console.log(`3 générations parallèles en ${totalTime.toFixed(2)}ms`);
        });
    });

    describe('Database intensive operations', () => {
        it('should handle large dataset queries efficiently', async () => {
            const queries = [
                '/api/conges?startDate=2023-01-01&endDate=2023-12-31', // Année complète
                '/api/utilisateurs?includeStats=true', // Avec statistiques
                '/api/assignments?startDate=2024-01-01&endDate=2024-12-31' // Assignations année
            ];

            const results = await Promise.all(
                queries.map(async (query) => {
                    const startTime = performance.now();
                    const response = await fetch(`${BASE_URL}${query}`, {
                        headers: { Authorization: authToken }
                    });
                    const endTime = performance.now();

                    return {
                        query,
                        status: response.status,
                        time: endTime - startTime,
                        dataSize: parseInt(response.headers.get('content-length') || '0')
                    };
                })
            );

            results.forEach(result => {
                expect(result.status).toBe(200);
                expect(result.time).toBeLessThan(5000); // Moins de 5s par requête complexe
                
                console.log(`${result.query}: ${result.time.toFixed(2)}ms (${result.dataSize} bytes)`);
            });
        });
    });

    describe('Memory and resource usage', () => {
        it('should not cause memory leaks with repeated requests', async () => {
            const initialMemory = process.memoryUsage();
            
            // Faire beaucoup de requêtes pour tester les fuites mémoire
            for (let i = 0; i < 100; i++) {
                await fetch(`${BASE_URL}/api/utilisateurs?page=${i % 10}`, {
                    headers: { Authorization: authToken }
                });
                
                // Forcer le garbage collector occasionnellement
                if (i % 20 === 0 && global.gc) {
                    global.gc();
                }
            }

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

            // L'augmentation mémoire ne doit pas être excessive
            expect(memoryIncreasePercent).toBeLessThan(50); // Moins de 50% d'augmentation

            console.log(`Mémoire initiale: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`Mémoire finale: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`Augmentation: ${memoryIncreasePercent.toFixed(2)}%`);
        });
    });

    describe('Error handling under load', () => {
        it('should handle invalid requests gracefully under load', async () => {
            // Mélange de requêtes valides et invalides
            const requests = Array.from({ length: 30 }, (_, i) => {
                const isValid = i % 3 !== 0; // 2/3 valides, 1/3 invalides
                
                return fetch(`${BASE_URL}/api/utilisateurs${isValid ? '' : '/invalid-endpoint'}`, {
                    headers: { Authorization: isValid ? authToken : 'invalid-token' }
                });
            });

            const startTime = performance.now();
            const responses = await Promise.all(requests);
            const endTime = performance.now();

            const validResponses = responses.filter((_, i) => i % 3 !== 0);
            const invalidResponses = responses.filter((_, i) => i % 3 === 0);

            // Les requêtes valides doivent réussir
            expect(validResponses.every(r => r.status === 200)).toBe(true);
            
            // Les requêtes invalides doivent échouer proprement
            expect(invalidResponses.every(r => r.status >= 400)).toBe(true);

            const totalTime = endTime - startTime;
            expect(totalTime).toBeLessThan(8000); // Gestion d'erreur rapide

            console.log(`Gestion de 30 requêtes mixtes en ${totalTime.toFixed(2)}ms`);
        });
    });

    afterAll(async () => {
        // Générer un rapport de performance
        const reportData = {
            timestamp: new Date().toISOString(),
            testResults: 'Performance tests completed',
            environment: process.env.NODE_ENV || 'test'
        };

        // Sauvegarder dans un fichier de rapport
        require('fs').writeFileSync(
            'performance-test-results.json', 
            JSON.stringify(reportData, null, 2)
        );
    });
});