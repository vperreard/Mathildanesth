describe('Monitoring Avancé des Performances', () => {
    // Seuils de performance optimisés pour l'application médicale
    const ADVANCED_THRESHOLDS = {
        // Core Web Vitals optimisés
        LCP: 2000,  // Largest Contentful Paint < 2s (critical pour urgences)
        FID: 50,    // First Input Delay < 50ms (réactivité critique)
        CLS: 0.05,  // Cumulative Layout Shift < 0.05 (stabilité UI)
        
        // Métriques spécifiques application
        authFlow: 1500,     // Connexion complète < 1.5s
        dataLoad: 1000,     // Chargement données < 1s
        navigation: 800,    // Navigation entre pages < 800ms
        apiCritical: 300,   // APIs critiques < 300ms
        
        // Métriques ressources
        memoryGrowth: 25,   // Croissance mémoire < 25%
        bundleSize: 2000000, // Bundle principal < 2MB
        imageLoad: 500      // Chargement images < 500ms
    };

    let performanceMetrics = [];

    beforeEach(() => {
        cy.cleanState();
        performanceMetrics = [];
        
        // Configuration monitoring avancé
        cy.window().then((win) => {
            // Activer le monitoring des ressources
            if ('PerformanceObserver' in win) {
                const observer = new win.PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        performanceMetrics.push({
                            name: entry.name,
                            duration: entry.duration,
                            startTime: entry.startTime,
                            type: entry.entryType
                        });
                    });
                });
                observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
            }
        });
        
        // Intercepteurs avec monitoring de performance
        cy.intercept('**/api/**', (req) => {
            const startTime = performance.now();
            req.reply((res) => {
                const duration = performance.now() - startTime;
                cy.task('logAdvancedPerformance', {
                    type: 'api-monitoring',
                    endpoint: req.url,
                    method: req.method,
                    duration,
                    status: res.statusCode,
                    size: res.body ? JSON.stringify(res.body).length : 0,
                    timestamp: Date.now()
                });
                res.send();
            });
        }).as('apiMonitoring');
    });

    it('surveille les performances en temps réel lors de l\'utilisation normale', () => {
        cy.log('📈 Surveillance temps réel des performances');
        
        // Démarrer le monitoring
        const sessionStartTime = performance.now();
        
        // Workflow utilisateur normal avec monitoring
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        // Mesurer les Core Web Vitals réels
        cy.window().then((win) => {
            // Simuler la mesure LCP via observer
            cy.wrap(null).then(() => {
                const navigation = win.performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    const lcp = navigation.loadEventEnd - navigation.navigationStart;
                    
                    cy.task('logAdvancedPerformance', {
                        type: 'core-web-vitals',
                        metric: 'LCP',
                        value: lcp,
                        threshold: ADVANCED_THRESHOLDS.LCP,
                        status: lcp < ADVANCED_THRESHOLDS.LCP ? 'EXCELLENT' : lcp < ADVANCED_THRESHOLDS.LCP * 1.5 ? 'GOOD' : 'POOR',
                        timestamp: Date.now()
                    });
                    
                    expect(lcp).to.be.lessThan(ADVANCED_THRESHOLDS.LCP);
                }
            });
        });
        
        // Test de connexion avec monitoring complet
        const authStartTime = performance.now();
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url({ timeout: 10000 }).should('include', '/tableau-de-bord').then(() => {
            const authDuration = performance.now() - authStartTime;
            
            cy.task('logAdvancedPerformance', {
                type: 'user-flow',
                action: 'complete-authentication',
                duration: authDuration,
                threshold: ADVANCED_THRESHOLDS.authFlow,
                status: authDuration < ADVANCED_THRESHOLDS.authFlow ? 'EXCELLENT' : 'SLOW',
                timestamp: Date.now()
            });
            
            expect(authDuration).to.be.lessThan(ADVANCED_THRESHOLDS.authFlow);
        });
        
        // Navigation monitoring
        const pages = [
            { selector: '[data-cy=nav-planning]', url: '/planning', name: 'planning' },
            { selector: '[data-cy=nav-conges]', url: '/conges', name: 'leaves' },
            { selector: '[data-cy=nav-tableau-de-bord]', url: '/tableau-de-bord', name: 'dashboard' }
        ];
        
        pages.forEach((page) => {
            const navStartTime = performance.now();
            
            cy.get(page.selector).click();
            cy.url().should('include', page.url).then(() => {
                const navDuration = performance.now() - navStartTime;
                
                cy.task('logAdvancedPerformance', {
                    type: 'navigation-monitoring',
                    page: page.name,
                    duration: navDuration,
                    threshold: ADVANCED_THRESHOLDS.navigation,
                    status: navDuration < ADVANCED_THRESHOLDS.navigation ? 'FAST' : 'SLOW',
                    timestamp: Date.now()
                });
                
                expect(navDuration).to.be.lessThan(ADVANCED_THRESHOLDS.navigation);
            });
            
            cy.wait(200); // Pause réaliste entre navigations
        });
    });

    it('détecte et analyse les goulots d\'\u00e9tranglement', () => {
        cy.log('🔍 Détection des goulots d\'\u00e9tranglement');
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        // Analyser les ressources lentes
        cy.window().then((win) => {
            const resourceEntries = win.performance.getEntriesByType('resource');
            
            resourceEntries.forEach((resource) => {
                const isSlowResource = resource.duration > 1000;
                const isCriticalResource = resource.name.includes('/api/') || 
                                         resource.name.includes('.js') || 
                                         resource.name.includes('.css');
                
                if (isSlowResource && isCriticalResource) {
                    cy.task('logAdvancedPerformance', {
                        type: 'bottleneck-detection',
                        resource: resource.name,
                        duration: resource.duration,
                        transferSize: resource.transferSize,
                        initiatorType: resource.initiatorType,
                        severity: resource.duration > 2000 ? 'CRITICAL' : 'WARNING',
                        timestamp: Date.now()
                    });
                    
                    // Alerter sur les ressources critiques lentes
                    if (resource.duration > 2000) {
                        cy.log(`⚠️ BOTTLENECK CRITIQUE: ${resource.name} - ${resource.duration}ms`);
                    }
                }
            });
        });
        
        // Test de charge progressive
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Simulation de charge avec multiples actions simultanées
        const concurrentActions = [
            () => cy.get('[data-cy=nav-planning]').click(),
            () => cy.get('[data-cy=nav-conges]').click(),
            () => cy.get('[data-cy=user-menu]').click()
        ];
        
        const loadTestStart = performance.now();
        
        // Exécuter actions rapidement
        concurrentActions.forEach((action, index) => {
            cy.wait(100 * index).then(() => {
                action();
            });
        });
        
        cy.wait(2000).then(() => {
            const loadTestDuration = performance.now() - loadTestStart;
            
            cy.task('logAdvancedPerformance', {
                type: 'load-test',
                scenario: 'concurrent-navigation',
                duration: loadTestDuration,
                actions: concurrentActions.length,
                averageActionTime: loadTestDuration / concurrentActions.length,
                status: loadTestDuration < 3000 ? 'STABLE' : 'UNSTABLE',
                timestamp: Date.now()
            });
        });
    });

    it('surveille l\'usage mémoire et détecte les fuites', () => {
        cy.log('🧠 Surveillance mémoire et détection de fuites');
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Mesure mémoire initiale
        cy.window().then((win) => {
            if ('memory' in win.performance) {
                const initialMemory = (win.performance as any).memory.usedJSHeapSize;
                
                // Cycle intensif pour détecter les fuites
                const memoryTestCycles = 20;
                
                for (let i = 0; i < memoryTestCycles; i++) {
                    cy.get('[data-cy=nav-planning]').click();
                    cy.url().should('include', '/planning');
                    cy.get('[data-cy=nav-conges]').click();
                    cy.url().should('include', '/conges');
                    cy.get('[data-cy=nav-tableau-de-bord]').click();
                    cy.url().should('include', '/tableau-de-bord');
                    
                    // Mesure intermédiaire tous les 5 cycles
                    if (i % 5 === 0) {
                        cy.window().then((cycleWin) => {
                            if ('memory' in cycleWin.performance) {
                                const cycleMemory = (cycleWin.performance as any).memory.usedJSHeapSize;
                                const memoryGrowth = ((cycleMemory - initialMemory) / initialMemory) * 100;
                                
                                cy.task('logAdvancedPerformance', {
                                    type: 'memory-monitoring',
                                    cycle: i,
                                    initialMemory,
                                    currentMemory: cycleMemory,
                                    growthPercent: memoryGrowth,
                                    status: memoryGrowth < ADVANCED_THRESHOLDS.memoryGrowth ? 'HEALTHY' : 'LEAK_SUSPECTED',
                                    timestamp: Date.now()
                                });
                            }
                        });
                    }
                }
                
                // Mesure finale
                cy.window().then((finalWin) => {
                    if ('memory' in finalWin.performance) {
                        const finalMemory = (finalWin.performance as any).memory.usedJSHeapSize;
                        const totalGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;
                        
                        cy.task('logAdvancedPerformance', {
                            type: 'memory-leak-analysis',
                            initialMemory,
                            finalMemory,
                            totalGrowthPercent: totalGrowth,
                            cycles: memoryTestCycles,
                            memoryPerCycle: (finalMemory - initialMemory) / memoryTestCycles,
                            leakDetected: totalGrowth > ADVANCED_THRESHOLDS.memoryGrowth,
                            severity: totalGrowth > 50 ? 'CRITICAL' : totalGrowth > 25 ? 'WARNING' : 'NORMAL',
                            timestamp: Date.now()
                        });
                        
                        // Seuil de croissance acceptable
                        expect(totalGrowth).to.be.lessThan(ADVANCED_THRESHOLDS.memoryGrowth);
                    }
                });
            }
        });
    });

    it('mesure les performances sur différents appareils simulés', () => {
        cy.log('📱 Test multi-appareils');
        
        const deviceProfiles = [
            { name: 'Desktop-High-End', viewport: [1920, 1080], cpu: 'fast', network: 'fast' },
            { name: 'Laptop-Standard', viewport: [1366, 768], cpu: 'standard', network: 'standard' },
            { name: 'Tablet-iPad', viewport: [768, 1024], cpu: 'slow', network: 'slow' },
            { name: 'Mobile-iPhone', viewport: [375, 667], cpu: 'slow', network: '3g' }
        ];
        
        deviceProfiles.forEach((device) => {
            cy.log(`Testing on ${device.name}`);
            
            // Configurer le viewport
            cy.viewport(device.viewport[0], device.viewport[1]);
            
            // Simuler les conditions réseau (si supporté)
            if (device.network === '3g') {
                cy.intercept('**/api/**', { delay: 200 }); // Simuler latence 3G
            }
            
            const deviceTestStart = performance.now();
            
            cy.visit('/auth/connexion');
            cy.waitForPageLoad();
            
            // Test de connexion sur cet appareil
            cy.safeType('[data-cy=email-input]', 'admin@example.com');
            cy.safeType('[data-cy=password-input]', 'Test123!');
            cy.safeClick('[data-cy=submit-button]');
            
            cy.url({ timeout: 15000 }).should('include', '/tableau-de-bord').then(() => {
                const deviceTestDuration = performance.now() - deviceTestStart;
                
                // Seuils adaptés par type d'appareil
                const deviceThreshold = device.cpu === 'fast' ? 2000 : 
                                      device.cpu === 'standard' ? 3000 : 5000;
                
                cy.task('logAdvancedPerformance', {
                    type: 'device-performance',
                    device: device.name,
                    viewport: device.viewport,
                    cpuProfile: device.cpu,
                    networkProfile: device.network,
                    duration: deviceTestDuration,
                    threshold: deviceThreshold,
                    status: deviceTestDuration < deviceThreshold ? 'OPTIMAL' : 'SUBOPTIMAL',
                    timestamp: Date.now()
                });
                
                expect(deviceTestDuration).to.be.lessThan(deviceThreshold);
            });
            
            // Test navigation sur cet appareil
            const navTestStart = performance.now();
            cy.get('[data-cy=nav-planning]').click();
            cy.url().should('include', '/planning').then(() => {
                const navDuration = performance.now() - navTestStart;
                const navThreshold = device.cpu === 'fast' ? 1000 : 2000;
                
                cy.task('logAdvancedPerformance', {
                    type: 'device-navigation',
                    device: device.name,
                    action: 'navigate-to-planning',
                    duration: navDuration,
                    threshold: navThreshold,
                    status: navDuration < navThreshold ? 'SMOOTH' : 'LAGGY',
                    timestamp: Date.now()
                });
                
                expect(navDuration).to.be.lessThan(navThreshold);
            });
        });
    });

    it('génère un rapport de performance complet', () => {
        cy.log('📄 Génération rapport de performance');
        
        // Exécuter un workflow complet pour collecter des données
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Navigation complète
        cy.get('[data-cy=nav-planning]').click();
        cy.url().should('include', '/planning');
        cy.get('[data-cy=nav-conges]').click();
        cy.url().should('include', '/conges');
        
        // Générer le rapport final
        cy.task('generatePerformanceReport', {
            sessionId: Date.now(),
            testSuite: 'Advanced Performance Monitoring',
            thresholds: ADVANCED_THRESHOLDS,
            timestamp: Date.now()
        }).then((report) => {
            // Vérifier que le rapport contient les données attendues
            expect(report).to.have.property('summary');
            expect(report).to.have.property('metrics');
            expect(report).to.have.property('recommendations');
            
            // Vérifier les scores de performance
            expect(report.summary.overallScore).to.be.greaterThan(80);
        });
    });

    afterEach(() => {
        // Exporter les métriques collectées
        cy.task('exportPerformanceMetrics', {
            testName: Cypress.currentTest.title,
            metrics: performanceMetrics,
            timestamp: Date.now()
        });
    });

    after(() => {
        // Générer un rapport consolidé
        cy.task('generateConsolidatedReport', {
            suite: 'Advanced Performance Monitoring',
            timestamp: Date.now()
        });
    });
});