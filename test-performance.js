const puppeteer = require('puppeteer');
const fs = require('fs');

async function measurePagePerformance() {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Configurer les métriques de performance
    await page.setCacheEnabled(false); // Test sans cache initial

    console.log('🚀 Tests de performance MATHILDA - Optimisations v1.0.0\n');

    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    // Test 1: Page d'accueil
    console.log('📊 Test 1: Page d\'accueil...');
    await testPage(page, 'http://localhost:3000', 'Page d\'accueil', results);

    // Test 2: Page de connexion
    console.log('📊 Test 2: Page de connexion...');
    await testPage(page, 'http://localhost:3000/auth/connexion', 'Page de connexion', results);

    // Test 3: Test avec cache (second chargement)
    console.log('📊 Test 3: Page d\'accueil (avec cache)...');
    await page.setCacheEnabled(true);
    await testPage(page, 'http://localhost:3000', 'Page d\'accueil (cached)', results);

    // Test 4: API utilisateurs
    console.log('📊 Test 4: API utilisateurs...');
    await testAPI(page, 'http://localhost:3000/api/utilisateurs?limit=20', 'API Users', results);

    // Test 5: Service Worker
    console.log('📊 Test 5: Service Worker...');
    await testServiceWorker(page, results);

    // Afficher les résultats
    displayResults(results);

    // Sauvegarder les résultats
    fs.writeFileSync(`performance-results-${Date.now()}.json`, JSON.stringify(results, null, 2));

    await browser.close();
}

async function testPage(page, url, name, results) {
    try {
        const startTime = Date.now();

        // Commencer à enregistrer les métriques
        await page.evaluateOnNewDocument(() => {
            window.performanceData = {
                navigationStart: Date.now(),
                loadStart: null,
                loadEnd: null,
                domContentLoaded: null
            };
        });

        const response = await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // Mesurer les Core Web Vitals
        const metrics = await page.evaluate(() => {
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    resolve({
                        entries: entries.map(entry => ({
                            name: entry.name,
                            value: entry.value,
                            rating: entry.rating
                        }))
                    });
                });

                observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

                // Fallback si pas de metrics dans 2 secondes
                setTimeout(() => {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    resolve({
                        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
                        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
                        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime,
                        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
                    });
                }, 2000);
            });
        });

        // Vérifier le Service Worker
        const swStatus = await page.evaluate(() => {
            return {
                isRegistered: 'serviceWorker' in navigator,
                isActive: navigator.serviceWorker?.controller !== null
            };
        });

        const result = {
            name,
            url,
            loadTime,
            statusCode: response?.status(),
            metrics,
            serviceWorker: swStatus,
            timestamp: new Date().toISOString()
        };

        results.tests.push(result);

        console.log(`   ✅ ${name}: ${loadTime}ms (Status: ${response?.status()})`);
        console.log(`   📱 Service Worker: ${swStatus.isActive ? 'Actif' : 'Inactif'}`);

    } catch (error) {
        console.log(`   ❌ ${name}: ERREUR - ${error.message}`);
        results.tests.push({
            name,
            url,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

async function testAPI(page, url, name, results) {
    try {
        const startTime = Date.now();

        const response = await page.evaluate(async (apiUrl) => {
            const start = Date.now();
            const response = await fetch(apiUrl);
            const end = Date.now();
            const data = await response.json();

            return {
                status: response.status,
                duration: end - start,
                cacheHit: data.meta?.cacheHit || false,
                totalItems: data.pagination?.total || 0,
                headers: Object.fromEntries(response.headers.entries())
            };
        }, url);

        const endTime = Date.now();

        const result = {
            name,
            url,
            duration: response.duration,
            statusCode: response.status,
            cacheHit: response.cacheHit,
            totalItems: response.totalItems,
            headers: response.headers,
            timestamp: new Date().toISOString()
        };

        results.tests.push(result);

        console.log(`   ✅ ${name}: ${response.duration}ms (Cache: ${response.cacheHit ? 'HIT' : 'MISS'}, Items: ${response.totalItems})`);

    } catch (error) {
        console.log(`   ❌ ${name}: ERREUR - ${error.message}`);
        results.tests.push({
            name,
            url,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

async function testServiceWorker(page, results) {
    try {
        const swInfo = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (!('serviceWorker' in navigator)) {
                    resolve({ supported: false });
                    return;
                }

                navigator.serviceWorker.ready.then(registration => {
                    // Tester les statistiques du cache
                    const messageChannel = new MessageChannel();

                    messageChannel.port1.onmessage = (event) => {
                        if (event.data.type === 'CACHE_STATS') {
                            resolve({
                                supported: true,
                                registered: true,
                                active: !!registration.active,
                                cacheStats: event.data.payload
                            });
                        }
                    };

                    if (registration.active) {
                        registration.active.postMessage(
                            { type: 'GET_CACHE_STATS' },
                            [messageChannel.port2]
                        );
                    } else {
                        resolve({
                            supported: true,
                            registered: true,
                            active: false
                        });
                    }

                    // Timeout pour les stats
                    setTimeout(() => {
                        resolve({
                            supported: true,
                            registered: true,
                            active: !!registration.active,
                            timeout: true
                        });
                    }, 2000);
                });
            });
        });

        results.tests.push({
            name: 'Service Worker',
            ...swInfo,
            timestamp: new Date().toISOString()
        });

        if (swInfo.supported) {
            console.log(`   ✅ Service Worker: ${swInfo.active ? 'Actif' : 'Inactif'}`);
            if (swInfo.cacheStats) {
                const totalEntries = Object.values(swInfo.cacheStats).reduce((sum, cache) => sum + cache.count, 0);
                console.log(`   📦 Cache: ${totalEntries} entrées`);
            }
        } else {
            console.log(`   ❌ Service Worker: Non supporté`);
        }

    } catch (error) {
        console.log(`   ❌ Service Worker: ERREUR - ${error.message}`);
        results.tests.push({
            name: 'Service Worker',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

function displayResults(results) {
    console.log('\n🎯 RÉSULTATS DES TESTS DE PERFORMANCE\n');
    console.log('=' * 60);

    // Grouper les résultats par type
    const pageTests = results.tests.filter(t => t.loadTime);
    const apiTests = results.tests.filter(t => t.duration);
    const swTests = results.tests.filter(t => t.name === 'Service Worker');

    // Pages
    if (pageTests.length > 0) {
        console.log('\n📄 PAGES:');
        pageTests.forEach(test => {
            const status = test.loadTime < 1000 ? '🟢' : test.loadTime < 2000 ? '🟡' : '🔴';
            console.log(`  ${status} ${test.name}: ${test.loadTime}ms`);
        });

        const avgPageLoad = pageTests.reduce((sum, t) => sum + t.loadTime, 0) / pageTests.length;
        console.log(`\n📊 Temps moyen: ${avgPageLoad.toFixed(0)}ms`);
    }

    // APIs
    if (apiTests.length > 0) {
        console.log('\n🔌 APIs:');
        apiTests.forEach(test => {
            const status = test.duration < 100 ? '🟢' : test.duration < 500 ? '🟡' : '🔴';
            const cache = test.cacheHit ? '💾' : '🌐';
            console.log(`  ${status} ${cache} ${test.name}: ${test.duration}ms`);
        });
    }

    // Service Worker
    if (swTests.length > 0) {
        const sw = swTests[0];
        console.log('\n⚙️ SERVICE WORKER:');
        console.log(`  Support: ${sw.supported ? '✅' : '❌'}`);
        console.log(`  Actif: ${sw.active ? '✅' : '❌'}`);
        if (sw.cacheStats) {
            Object.entries(sw.cacheStats).forEach(([name, stats]) => {
                console.log(`  📦 ${name}: ${stats.count} entrées (${(stats.size / 1024).toFixed(1)} KB)`);
            });
        }
    }

    console.log('\n🎉 Tests terminés !');
    console.log(`📁 Résultats sauvegardés: performance-results-${Date.now()}.json`);
}

// Fonction pour comparer avec les métriques précédentes
function compareWithBaseline(results) {
    // Métriques de référence (avant optimisations)
    const baseline = {
        'Page d\'accueil': 277,
        'Page de connexion': 1876,
        'Page d\'authentification': 3035,
        'API Users': 22
    };

    console.log('\n📈 COMPARAISON AVEC LES MÉTRIQUES DE BASE:\n');

    results.tests.forEach(test => {
        const baselineTime = baseline[test.name];
        if (baselineTime) {
            const improvement = ((baselineTime - (test.loadTime || test.duration)) / baselineTime * 100);
            const status = improvement > 0 ? '📈' : '📉';
            console.log(`${status} ${test.name}: ${improvement.toFixed(1)}% (${baselineTime}ms → ${test.loadTime || test.duration}ms)`);
        }
    });
}

// Lancer les tests
measurePagePerformance().catch(console.error); 