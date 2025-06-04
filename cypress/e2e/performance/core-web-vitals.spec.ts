describe('Core Web Vitals et Performance', () => {
    // Seuils de performance stricts
    const PERFORMANCE_THRESHOLDS = {
        LCP: 2500,  // Largest Contentful Paint < 2.5s
        FID: 100,   // First Input Delay < 100ms
        CLS: 0.1,   // Cumulative Layout Shift < 0.1
        FCP: 1800,  // First Contentful Paint < 1.8s
        TTFB: 800,  // Time to First Byte < 800ms
        pageLoad: 3000,  // Page load < 3s
        apiResponse: 500  // API response < 500ms
    };

    beforeEach(() => {
        cy.cleanState();
        
        // Intercepter toutes les APIs avec timing
        cy.intercept('GET', '**/api/**', (req) => {
            const startTime = performance.now();
            req.reply((res) => {
                const duration = performance.now() - startTime;
                cy.task('logPerformance', {
                    type: 'api',
                    name: `GET-${req.url.split('/').pop()}`,
                    duration,
                    timestamp: Date.now(),
                    status: duration < PERFORMANCE_THRESHOLDS.apiResponse ? 'PASS' : 'SLOW'
                });
                res.send();
            });
        }).as('getRequests');
        
        cy.intercept('POST', '**/api/**', (req) => {
            const startTime = performance.now();
            req.reply((res) => {
                const duration = performance.now() - startTime;
                cy.task('logPerformance', {
                    type: 'api',
                    name: `POST-${req.url.split('/').pop()}`,
                    duration,
                    timestamp: Date.now(),
                    status: duration < PERFORMANCE_THRESHOLDS.apiResponse ? 'PASS' : 'SLOW'
                });
                res.send();
            });
        }).as('postRequests');
    });

    it('mesure les Core Web Vitals de la page d\'accueil', () => {
        const startTime = performance.now();
        
        cy.visit('/');
        
        // Attendre que la page soit complètement chargée
        cy.window().its('document.readyState').should('equal', 'complete');
        
        // Mesurer le temps de chargement initial
        cy.window().then((win) => {
            const pageLoadTime = performance.now() - startTime;
            
            cy.task('logPerformance', {
                type: 'navigation',
                name: 'home-page-load',
                duration: pageLoadTime,
                timestamp: Date.now(),
                status: pageLoadTime < PERFORMANCE_THRESHOLDS.pageLoad ? 'PASS' : 'SLOW'
            });
            
            // Vérifier que le chargement est rapide
            expect(pageLoadTime).to.be.lessThan(PERFORMANCE_THRESHOLDS.pageLoad);
        });
        
        // Mesurer LCP en utilisant PerformanceObserver (simulé)
        cy.window().then((win) => {
            // Simuler la mesure LCP via les métriques de performance
            const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
                const lcp = navigation.loadEventEnd - navigation.navigationStart;
                
                cy.task('logPerformance', {
                    type: 'core-web-vitals',
                    name: 'LCP',
                    duration: lcp,
                    timestamp: Date.now(),
                    status: lcp < PERFORMANCE_THRESHOLDS.LCP ? 'PASS' : 'SLOW'
                });
                
                expect(lcp).to.be.lessThan(PERFORMANCE_THRESHOLDS.LCP);
            }
        });
    });

    it('mesure les performances de connexion et navigation', () => {
        // Test complet du workflow avec mesures de performance
        
        // ÉTAPE 1: Performance de la page de connexion
        const loginStartTime = performance.now();
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.window().then(() => {
            const loginPageTime = performance.now() - loginStartTime;
            cy.task('logPerformance', {
                type: 'navigation',
                name: 'login-page-load',
                duration: loginPageTime,
                timestamp: Date.now(),
                status: loginPageTime < PERFORMANCE_THRESHOLDS.pageLoad ? 'PASS' : 'SLOW'
            });
            
            expect(loginPageTime).to.be.lessThan(PERFORMANCE_THRESHOLDS.pageLoad);
        });

        // ÉTAPE 2: Performance de l'authentification
        const authStartTime = performance.now();
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url({ timeout: 10000 }).should('include', '/tableau-de-bord').then(() => {
            const authTime = performance.now() - authStartTime;
            cy.task('logPerformance', {
                type: 'authentication',
                name: 'complete-auth-flow',
                duration: authTime,
                timestamp: Date.now(),
                status: authTime < 2000 ? 'PASS' : 'SLOW'
            });
            
            // L'authentification doit être < 2s
            expect(authTime).to.be.lessThan(2000);
        });

        // ÉTAPE 3: Performance de navigation entre pages
        const navStartTime = performance.now();
        cy.get('[data-cy=nav-planning]').click();
        cy.url().should('include', '/planning').then(() => {
            const navTime = performance.now() - navStartTime;
            cy.task('logPerformance', {
                type: 'navigation',
                name: 'page-navigation',
                duration: navTime,
                timestamp: Date.now(),
                status: navTime < 1500 ? 'PASS' : 'SLOW'
            });
            
            // Navigation entre pages doit être < 1.5s
            expect(navTime).to.be.lessThan(1500);
        });
    });

    it('teste les performances sous charge simulée', () => {
        // Simuler des interactions utilisateur rapides
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        // Connexion rapide
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Série de navigations rapides pour tester la charge
        const pages = [
            { nav: '[data-cy=nav-planning]', url: '/planning', name: 'planning' },
            { nav: '[data-cy=nav-conges]', url: '/conges', name: 'conges' },
            { nav: '[data-cy=nav-tableau-de-bord]', url: '/tableau-de-bord', name: 'dashboard' }
        ];
        
        pages.forEach((page, index) => {
            const startTime = performance.now();
            
            cy.get(page.nav).click();
            cy.url().should('include', page.url).then(() => {
                const navTime = performance.now() - startTime;
                
                cy.task('logPerformance', {
                    type: 'load-test',
                    name: `rapid-navigation-${page.name}`,
                    duration: navTime,
                    timestamp: Date.now(),
                    status: navTime < 1000 ? 'PASS' : 'SLOW'
                });
                
                // Sous charge, navigation doit rester < 1s
                expect(navTime).to.be.lessThan(1000);
            });
            
            // Courte pause entre navigations
            cy.wait(100);
        });
    });

    it('mesure les performances des APIs critiques', () => {
        cy.intercept('GET', '**/api/auth/me', { fixture: 'user-profile.json' }).as('userProfile');
        cy.intercept('GET', '**/api/planning/**', { fixture: 'planning-data.json' }).as('planningData');
        cy.intercept('GET', '**/api/conges/**', { fixture: 'leaves-data.json' }).as('leavesData');
        
        cy.visit('/auth/connexion');
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        // Tester performance API utilisateur
        const userApiStart = performance.now();
        cy.wait('@userProfile').then(() => {
            const userApiTime = performance.now() - userApiStart;
            cy.task('logPerformance', {
                type: 'api-critical',
                name: 'user-profile-api',
                duration: userApiTime,
                timestamp: Date.now(),
                status: userApiTime < PERFORMANCE_THRESHOLDS.apiResponse ? 'PASS' : 'SLOW'
            });
            
            expect(userApiTime).to.be.lessThan(PERFORMANCE_THRESHOLDS.apiResponse);
        });
        
        // Navigation vers planning
        cy.get('[data-cy=nav-planning]').click();
        
        // Tester performance API planning
        const planningApiStart = performance.now();
        cy.wait('@planningData').then(() => {
            const planningApiTime = performance.now() - planningApiStart;
            cy.task('logPerformance', {
                type: 'api-critical',
                name: 'planning-data-api',
                duration: planningApiTime,
                timestamp: Date.now(),
                status: planningApiTime < PERFORMANCE_THRESHOLDS.apiResponse ? 'PASS' : 'SLOW'
            });
            
            expect(planningApiTime).to.be.lessThan(PERFORMANCE_THRESHOLDS.apiResponse);
        });
    });

    it('détecte les fuites mémoire potentielles', () => {
        cy.visit('/auth/connexion');
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Mesurer la mémoire initiale
        cy.window().then((win) => {
            if ('memory' in win.performance) {
                const initialMemory = (win.performance as any).memory.usedJSHeapSize;
                
                // Série d'actions pour potentiellement créer des fuites
                for (let i = 0; i < 10; i++) {
                    cy.get('[data-cy=nav-planning]').click();
                    cy.url().should('include', '/planning');
                    cy.get('[data-cy=nav-conges]').click();
                    cy.url().should('include', '/conges');
                    cy.get('[data-cy=nav-tableau-de-bord]').click();
                    cy.url().should('include', '/tableau-de-bord');
                }
                
                // Mesurer la mémoire finale
                cy.window().then((finalWin) => {
                    if ('memory' in finalWin.performance) {
                        const finalMemory = (finalWin.performance as any).memory.usedJSHeapSize;
                        const memoryIncrease = finalMemory - initialMemory;
                        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
                        
                        cy.task('logPerformance', {
                            type: 'memory',
                            name: 'memory-leak-detection',
                            duration: memoryIncrease,
                            timestamp: Date.now(),
                            status: memoryIncreasePercent < 50 ? 'PASS' : 'LEAK_SUSPECTED',
                            additionalData: {
                                initialMemory,
                                finalMemory,
                                increasePercent: memoryIncreasePercent
                            }
                        });
                        
                        // L'augmentation de mémoire ne doit pas dépasser 50%
                        expect(memoryIncreasePercent).to.be.lessThan(50);
                    }
                });
            }
        });
    });

    afterEach(() => {
        // Générer un rapport de performance après chaque test
        cy.task('logPerformance', {
            type: 'test-complete',
            name: 'performance-test-completed',
            duration: 0,
            timestamp: Date.now(),
            status: 'COMPLETED'
        });
    });
});