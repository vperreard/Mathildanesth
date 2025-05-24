const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ENDPOINTS = [
    { name: 'API Users', path: '/api/users?limit=20' },
    { name: 'API Users (Count)', path: '/api/users', method: 'HEAD' },
    { name: 'API Users (Suggestions)', path: '/api/users?q=test&field=nom', method: 'OPTIONS' },
    { name: 'API Sites', path: '/api/sites' },
    { name: 'API Specialties', path: '/api/specialties' },
];

// Métriques de référence (avant optimisations)
const BASELINE_METRICS = {
    'Page d\'accueil': 277,
    'Page de connexion': 1876,
    'Page d\'authentification': 3035,
    'API Users': 22,
    'API Lectures': 7,
    'API Écritures': 22,
    'WebSockets': 15
};

async function testAPIPerformance() {
    console.log('🚀 Tests de performance API MATHILDA - Optimisations v1.0.0\n');
    console.log('📊 Test des optimisations backend...\n');

    const results = {
        timestamp: new Date().toISOString(),
        baseline: BASELINE_METRICS,
        tests: [],
        summary: {}
    };

    // Test de chaque endpoint
    for (const endpoint of ENDPOINTS) {
        console.log(`🔄 Test: ${endpoint.name}...`);

        const testResult = await testEndpoint(endpoint);
        results.tests.push(testResult);

        const status = getPerformanceStatus(testResult.averageTime);
        console.log(`   ${status} ${endpoint.name}: ${testResult.averageTime.toFixed(0)}ms (min: ${testResult.minTime}ms, max: ${testResult.maxTime}ms)`);

        if (testResult.cacheHit !== undefined) {
            console.log(`   💾 Cache Hit Rate: ${testResult.cacheHitRate.toFixed(1)}%`);
        }

        // Petite pause entre les tests
        await sleep(100);
    }

    // Test de charge
    console.log('\n🔥 Test de charge concurrent...');
    const loadTestResult = await performLoadTest();
    results.loadTest = loadTestResult;

    console.log(`   📈 Requêtes concurrent: ${loadTestResult.concurrent} x ${loadTestResult.requestsPerBatch}`);
    console.log(`   ⏱️  Temps moyen: ${loadTestResult.averageTime.toFixed(0)}ms`);
    console.log(`   ✅ Succès: ${loadTestResult.successRate.toFixed(1)}%`);

    // Résultats détaillés
    displayDetailedResults(results);

    // Comparaison avec la baseline
    compareWithBaseline(results);

    // Sauvegarde
    const filename = `performance-api-results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n💾 Résultats sauvegardés: ${filename}`);

    return results;
}

async function testEndpoint(endpoint) {
    const numTests = 5;
    const times = [];
    const cacheHits = [];
    let errors = 0;

    for (let i = 0; i < numTests; i++) {
        try {
            const startTime = Date.now();

            const response = await makeRequest(BASE_URL + endpoint.path, endpoint.method || 'GET');

            const endTime = Date.now();
            const duration = endTime - startTime;
            times.push(duration);

            // Analyser les headers de cache si disponibles
            if (response.headers) {
                const cacheInfo = analyzeCacheHeaders(response.headers, response.body);
                if (cacheInfo.cacheHit !== undefined) {
                    cacheHits.push(cacheInfo.cacheHit);
                }
            }

        } catch (error) {
            errors++;
            console.log(`   ⚠️  Erreur test ${i + 1}: ${error.message}`);
        }
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const cacheHitRate = cacheHits.length > 0 ? (cacheHits.filter(hit => hit).length / cacheHits.length) * 100 : 0;

    return {
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method || 'GET',
        averageTime,
        minTime,
        maxTime,
        errors,
        successRate: ((numTests - errors) / numTests) * 100,
        cacheHitRate,
        cacheHit: cacheHits.length > 0 ? cacheHits[cacheHits.length - 1] : undefined,
        samples: times
    };
}

async function performLoadTest() {
    const concurrent = 10;
    const requestsPerBatch = 5;
    const endpoint = '/api/users?limit=10';

    const startTime = Date.now();
    const promises = [];

    // Créer des requêtes concurrentes
    for (let i = 0; i < concurrent; i++) {
        const batchPromises = [];
        for (let j = 0; j < requestsPerBatch; j++) {
            batchPromises.push(makeRequest(BASE_URL + endpoint));
        }
        promises.push(Promise.all(batchPromises));
    }

    let successCount = 0;
    let totalRequests = concurrent * requestsPerBatch;

    try {
        const results = await Promise.all(promises);
        successCount = results.flat().filter(r => r.status >= 200 && r.status < 300).length;
    } catch (error) {
        console.log(`   ⚠️  Erreur durant le test de charge: ${error.message}`);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    return {
        concurrent,
        requestsPerBatch,
        totalRequests,
        successCount,
        successRate: (successCount / totalRequests) * 100,
        totalTime,
        averageTime: totalTime / totalRequests,
        requestsPerSecond: (totalRequests / totalTime) * 1000
    };
}

function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            timeout: 10000,
            headers: {
                'User-Agent': 'MATHILDA-Performance-Test/1.0',
                'Accept': 'application/json',
            }
        };

        const client = urlObj.protocol === 'https:' ? https : http;

        const req = client.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: jsonBody
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

function analyzeCacheHeaders(headers, body) {
    const cacheControl = headers['cache-control'] || '';
    const xCacheHit = headers['x-cache-hit'];
    const executionTime = headers['x-execution-time'];

    // Analyser si c'est un cache hit depuis les métadonnées du body
    let cacheHit = undefined;
    if (body && body.meta && body.meta.cacheHit !== undefined) {
        cacheHit = body.meta.cacheHit;
    } else if (xCacheHit !== undefined) {
        cacheHit = xCacheHit === 'true';
    }

    return {
        cacheControl,
        cacheHit,
        executionTime: executionTime ? parseFloat(executionTime) : undefined
    };
}

function getPerformanceStatus(time) {
    if (time < 50) return '🟢';
    if (time < 100) return '🟡';
    if (time < 500) return '🟠';
    return '🔴';
}

function displayDetailedResults(results) {
    console.log('\n🎯 RÉSULTATS DÉTAILLÉS\n');
    console.log('='.repeat(60));

    // APIs les plus rapides
    const sortedBySpeed = [...results.tests].sort((a, b) => a.averageTime - b.averageTime);

    console.log('\n🏆 TOP 3 APIs LES PLUS RAPIDES:');
    sortedBySpeed.slice(0, 3).forEach((test, index) => {
        const medal = ['🥇', '🥈', '🥉'][index];
        console.log(`${medal} ${test.name}: ${test.averageTime.toFixed(0)}ms`);
    });

    // APIs avec le meilleur cache hit rate
    const withCache = results.tests.filter(t => t.cacheHitRate > 0);
    if (withCache.length > 0) {
        console.log('\n💾 MEILLEUR CACHE HIT RATE:');
        withCache.sort((a, b) => b.cacheHitRate - a.cacheHitRate).slice(0, 3).forEach(test => {
            console.log(`📦 ${test.name}: ${test.cacheHitRate.toFixed(1)}%`);
        });
    }

    // Détection des optimisations
    console.log('\n✨ OPTIMISATIONS DÉTECTÉES:');

    let optimizationsFound = 0;

    results.tests.forEach(test => {
        if (test.cacheHitRate > 0) {
            console.log(`💾 ${test.name}: Cache intelligent actif (${test.cacheHitRate.toFixed(1)}% hit rate)`);
            optimizationsFound++;
        }

        if (test.averageTime < 100) {
            console.log(`⚡ ${test.name}: Performance élevée (${test.averageTime.toFixed(0)}ms)`);
            optimizationsFound++;
        }
    });

    if (optimizationsFound === 0) {
        console.log('ℹ️  Aucune optimisation spécifique détectée dans cette session');
    }
}

function compareWithBaseline(results) {
    console.log('\n📈 COMPARAISON AVEC LA BASELINE\n');
    console.log('='.repeat(60));

    let totalImprovement = 0;
    let comparisons = 0;

    // Mapper les noms des tests aux métriques de baseline
    const testMapping = {
        'API Users': 'API Lectures',
        'API Users (Count)': 'API Lectures',
        'API Users (Suggestions)': 'API Lectures'
    };

    results.tests.forEach(test => {
        const baselineName = testMapping[test.name] || test.name;
        const baselineTime = BASELINE_METRICS[baselineName];

        if (baselineTime) {
            const currentTime = test.averageTime;
            const improvement = ((baselineTime - currentTime) / baselineTime) * 100;
            const status = improvement > 0 ? '📈' : improvement < -10 ? '📉' : '➡️';

            console.log(`${status} ${test.name}:`);
            console.log(`   Avant: ${baselineTime}ms → Après: ${currentTime.toFixed(0)}ms`);
            console.log(`   Amélioration: ${improvement.toFixed(1)}%`);
            console.log();

            totalImprovement += improvement;
            comparisons++;
        }
    });

    if (comparisons > 0) {
        const avgImprovement = totalImprovement / comparisons;
        console.log(`🎯 AMÉLIORATION MOYENNE: ${avgImprovement.toFixed(1)}%`);

        if (avgImprovement > 20) {
            console.log('🎉 EXCELLENT! Optimisations très efficaces');
        } else if (avgImprovement > 10) {
            console.log('👍 BIEN! Optimisations réussies');
        } else if (avgImprovement > 0) {
            console.log('✅ CORRECT! Légères améliorations');
        } else {
            console.log('⚠️  Performance similaire ou dégradée');
        }
    }

    // Test de charge vs baseline
    if (results.loadTest) {
        console.log(`\n🔥 TEST DE CHARGE:`);
        console.log(`   Throughput: ${results.loadTest.requestsPerSecond.toFixed(1)} req/s`);
        console.log(`   Taux de succès: ${results.loadTest.successRate.toFixed(1)}%`);

        if (results.loadTest.successRate > 95) {
            console.log('   🟢 Excellente stabilité sous charge');
        } else if (results.loadTest.successRate > 90) {
            console.log('   🟡 Bonne stabilité sous charge');
        } else {
            console.log('   🔴 Instabilité détectée sous charge');
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Point d'entrée
if (require.main === module) {
    testAPIPerformance()
        .then((results) => {
            console.log('\n🎉 Tests terminés avec succès!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erreur durant les tests:', error.message);
            process.exit(1);
        });
}

module.exports = { testAPIPerformance, BASELINE_METRICS }; 