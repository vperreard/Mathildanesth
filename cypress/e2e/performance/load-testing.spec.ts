describe('Tests de charge et performance', () => {
    const LOAD_TEST_CONFIG = {
        concurrent_users: 10,
        test_duration: 30000, // 30 seconds
        request_delay: 1000,   // 1 second between requests
        max_response_time: 2000 // 2 seconds max
    };

    beforeEach(() => {
        cy.cleanState();
        
        // Configuration pour tests de charge
        cy.intercept('POST', '**/api/auth/login', (req) => {
            // Simuler latence réseau variable
            const latency = Math.random() * 200 + 100; // 100-300ms
            cy.wait(latency);
            req.reply({ fixture: 'auth-response.json' });
        }).as('loadLogin');
        
        cy.intercept('GET', '**/api/**', (req) => {
            const latency = Math.random() * 150 + 50; // 50-200ms
            cy.wait(latency);
            req.reply({ statusCode: 200, body: { data: 'test' } });
        }).as('loadGet');
    });

    it('teste la charge sur l\'authentification', () => {
        const startTime = performance.now();
        const users = [];
        
        // Simuler plusieurs connexions simultanées
        for (let i = 0; i < 5; i++) {
            cy.log(`Démarrage utilisateur simulé ${i + 1}`);
            
            cy.visit('/auth/connexion', { timeout: 10000 });
            cy.waitForPageLoad();
            
            cy.safeType('[data-cy=email-input]', `user${i}@example.com`);
            cy.safeType('[data-cy=password-input]', 'Test123!');
            
            const loginStartTime = performance.now();
            cy.safeClick('[data-cy=submit-button]');
            
            cy.wait('@loadLogin').then(() => {
                const loginDuration = performance.now() - loginStartTime;
                
                cy.task('logPerformance', {
                    type: 'load-test',
                    name: `concurrent-login-user-${i}`,
                    duration: loginDuration,
                    timestamp: Date.now(),
                    status: loginDuration < LOAD_TEST_CONFIG.max_response_time ? 'PASS' : 'SLOW'
                });
                
                // Chaque connexion doit rester < 2s même sous charge
                expect(loginDuration).to.be.lessThan(LOAD_TEST_CONFIG.max_response_time);
            });
            
            // Délai entre utilisateurs
            cy.wait(500);
        }
        
        const totalDuration = performance.now() - startTime;
        cy.task('logPerformance', {
            type: 'load-test',
            name: 'total-concurrent-logins',
            duration: totalDuration,
            timestamp: Date.now(),
            status: totalDuration < 15000 ? 'PASS' : 'SLOW'
        });
    });

    it('teste la charge sur les APIs critiques', () => {
        // Connexion préalable
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Test de charge sur les APIs
        const apiEndpoints = [
            { url: '/api/planning', name: 'planning' },
            { url: '/api/conges', name: 'leaves' },
            { url: '/api/users/me', name: 'profile' }
        ];
        
        apiEndpoints.forEach((endpoint) => {
            cy.log(`Test de charge API: ${endpoint.name}`);
            
            // Série de requêtes rapides
            for (let i = 0; i < 10; i++) {
                const requestStart = performance.now();
                
                cy.request({
                    method: 'GET',
                    url: endpoint.url,
                    failOnStatusCode: false
                }).then((response) => {
                    const requestDuration = performance.now() - requestStart;
                    
                    cy.task('logPerformance', {
                        type: 'api-load-test',
                        name: `${endpoint.name}-request-${i}`,
                        duration: requestDuration,
                        timestamp: Date.now(),
                        status: requestDuration < 500 ? 'PASS' : 'SLOW'
                    });
                    
                    // API doit répondre en < 500ms même sous charge
                    expect(requestDuration).to.be.lessThan(500);
                    expect(response.status).to.be.oneOf([200, 401, 404]); // Status valides
                });
                
                cy.wait(100); // Délai entre requêtes
            }
        });
    });

    it('teste la résistance aux erreurs sous charge', () => {
        // Simuler des erreurs réseau intermittentes
        let errorCount = 0;
        
        cy.intercept('POST', '**/api/auth/login', (req) => {
            errorCount++;
            if (errorCount % 3 === 0) {
                // 1 erreur sur 3
                req.reply({ statusCode: 500, body: { error: 'Erreur serveur simulée' } });
            } else {
                req.reply({ fixture: 'auth-response.json' });
            }
        }).as('flakyLogin');
        
        // Tester la récupération après erreurs
        for (let attempt = 0; attempt < 6; attempt++) {
            cy.log(`Tentative de connexion ${attempt + 1}`);
            
            cy.visit('/auth/connexion');
            cy.waitForPageLoad();
            
            cy.safeType('[data-cy=email-input]', 'admin@example.com');
            cy.safeType('[data-cy=password-input]', 'Test123!');
            cy.safeClick('[data-cy=submit-button]');
            
            cy.wait('@flakyLogin').then((interception) => {
                if (interception.response?.statusCode === 200) {
                    // Connexion réussie
                    cy.url({ timeout: 10000 }).should('include', '/tableau-de-bord');
                    cy.log('✅ Connexion réussie après erreur');
                } else {
                    // Erreur attendue
                    cy.waitForElement('[data-cy=error-message]');
                    cy.get('[data-cy=error-message]').should('be.visible');
                    cy.log('❌ Erreur gérée correctement');
                }
            });
            
            cy.wait(500);
        }
    });

    it('teste les performances avec cache désactivé', () => {
        // Désactiver le cache pour tester les performances sans optimisations
        cy.visit('/auth/connexion', {
            onBeforeLoad: (win) => {
                // Désactiver le cache du navigateur
                if (win.navigator.serviceWorker) {
                    win.navigator.serviceWorker.getRegistrations().then((registrations) => {
                        registrations.forEach((registration) => {
                            registration.unregister();
                        });
                    });
                }
            }
        });
        
        // Forcer rechargement sans cache
        cy.reload(true);
        
        const startTime = performance.now();
        cy.waitForPageLoad();
        
        cy.window().then(() => {
            const pageLoadTime = performance.now() - startTime;
            
            cy.task('logPerformance', {
                type: 'no-cache-test',
                name: 'login-page-no-cache',
                duration: pageLoadTime,
                timestamp: Date.now(),
                status: pageLoadTime < 5000 ? 'PASS' : 'SLOW'
            });
            
            // Sans cache, le chargement doit rester < 5s
            expect(pageLoadTime).to.be.lessThan(5000);
        });
        
        // Test de navigation sans cache
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        const navStartTime = performance.now();
        cy.url().should('include', '/tableau-de-bord').then(() => {
            const navTime = performance.now() - navStartTime;
            
            cy.task('logPerformance', {
                type: 'no-cache-test',
                name: 'dashboard-nav-no-cache',
                duration: navTime,
                timestamp: Date.now(),
                status: navTime < 3000 ? 'PASS' : 'SLOW'
            });
            
            expect(navTime).to.be.lessThan(3000);
        });
    });

    it('teste la performance avec connexion lente simulée', () => {
        // Simuler une connexion lente
        cy.intercept('**/*', (req) => {
            // Ajouter 500-1000ms de latence
            const latency = Math.random() * 500 + 500;
            cy.wait(latency);
            req.continue();
        }).as('slowNetwork');
        
        const startTime = performance.now();
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.window().then(() => {
            const slowPageLoadTime = performance.now() - startTime;
            
            cy.task('logPerformance', {
                type: 'slow-network-test',
                name: 'login-page-slow-network',
                duration: slowPageLoadTime,
                timestamp: Date.now(),
                status: slowPageLoadTime < 10000 ? 'PASS' : 'SLOW'
            });
            
            // Avec connexion lente, doit rester utilisable < 10s
            expect(slowPageLoadTime).to.be.lessThan(10000);
        });
        
        // Test d'interaction sur connexion lente
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        
        const loginStartTime = performance.now();
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url({ timeout: 15000 }).should('include', '/tableau-de-bord').then(() => {
            const slowLoginTime = performance.now() - loginStartTime;
            
            cy.task('logPerformance', {
                type: 'slow-network-test',
                name: 'login-process-slow-network',
                duration: slowLoginTime,
                timestamp: Date.now(),
                status: slowLoginTime < 8000 ? 'PASS' : 'SLOW'
            });
            
            expect(slowLoginTime).to.be.lessThan(8000);
        });
    });

    afterEach(() => {
        // Rapport de performance après chaque test de charge
        cy.task('logPerformance', {
            type: 'load-test-complete',
            name: 'load-test-completed',
            duration: 0,
            timestamp: Date.now(),
            status: 'COMPLETED'
        });
    });
});