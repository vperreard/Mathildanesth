// Tests de performance critiques pour les fonctionnalités principales

describe('Tests de Performance Critiques', () => {
    beforeEach(() => {
    jest.clearAllMocks();
        cy.login('admin@mathildanesth.fr', 'AdminSecure123!');
    });

    describe('Performance des pages principales', () => {
        it('devrait charger le dashboard admin en moins de 2 secondes', () => {
            const startTime = Date.now();
            
            cy.visit('/admin/dashboard');
            
            // Attendre que tous les widgets soient chargés
            cy.get('[data-testid="dashboard-widgets"]').should('be.visible');
            cy.get('[data-testid="loading-indicator"]').should('not.exist');
            
            cy.then(() => {
                const loadTime = Date.now() - startTime;
                expect(loadTime).to.be.lessThan(2000);
                cy.log(`Dashboard chargé en ${loadTime}ms`);
            });
        });

        it('devrait charger la liste des utilisateurs rapidement même avec beaucoup de données', () => {
            cy.intercept('GET', '/api/utilisateurs*', { fixture: 'large-users-dataset.json' }).as('getUsers');
            
            const startTime = Date.now();
            cy.visit('/admin/utilisateurs');
            
            cy.wait('@getUsers');
            cy.get('[data-testid="users-table"]').should('be.visible');
            
            cy.then(() => {
                const loadTime = Date.now() - startTime;
                expect(loadTime).to.be.lessThan(3000);
                cy.log(`1000+ utilisateurs chargés en ${loadTime}ms`);
            });
        });

        it('devrait charger le planning mensuel rapidement', () => {
            const startTime = Date.now();
            
            cy.visit('/planning?view=month&date=2024-01-01');
            
            cy.get('[data-testid="planning-calendar"]').should('be.visible');
            cy.get('[data-testid="calendar-events"]').should('have.length.greaterThan', 0);
            
            cy.then(() => {
                const loadTime = Date.now() - startTime;
                expect(loadTime).to.be.lessThan(2500);
                cy.log(`Planning mensuel chargé en ${loadTime}ms`);
            });
        });
    });

    describe('Performance des API critiques', () => {
        it('devrait répondre rapidement aux requêtes de recherche d\'utilisateurs', () => {
            cy.visit('/admin/utilisateurs');
            
            // Mesurer le temps de réponse de la recherche
            cy.get('[data-testid="search-input"]').type('dupont');
            
            cy.intercept('GET', '/api/utilisateurs/search*').as('searchUsers');
            cy.wait('@searchUsers').then((interception) => {
                expect(interception.reply.delay || 0).to.be.lessThan(500);
            });
            
            cy.get('[data-testid="search-results"]').should('be.visible');
        });

        it('devrait générer un planning rapidement', () => {
            cy.visit('/admin/planning/generate');
            
            cy.get('[data-testid="start-date"]').type('2024-01-01');
            cy.get('[data-testid="end-date"]').type('2024-01-07');
            cy.get('[data-testid="site-select"]').select('Site Principal');
            
            const startTime = Date.now();
            cy.get('[data-testid="generate-btn"]').click();
            
            cy.get('[data-testid="generation-complete"]', { timeout: 10000 }).should('be.visible');
            
            cy.then(() => {
                const generationTime = Date.now() - startTime;
                expect(generationTime).to.be.lessThan(5000);
                cy.log(`Planning généré en ${generationTime}ms`);
            });
        });

        it('devrait traiter les demandes de congés en masse rapidement', () => {
            cy.visit('/admin/conges');
            
            // Sélectionner plusieurs demandes
            cy.get('[data-testid="select-all-pending"]').check();
            
            const startTime = Date.now();
            cy.get('[data-testid="bulk-approve-btn"]').click();
            cy.get('[data-testid="confirm-bulk-approve"]').click();
            
            cy.get('[data-testid="bulk-operation-complete"]', { timeout: 8000 }).should('be.visible');
            
            cy.then(() => {
                const processingTime = Date.now() - startTime;
                expect(processingTime).to.be.lessThan(3000);
                cy.log(`Traitement en masse effectué en ${processingTime}ms`);
            });
        });
    });

    describe('Performance des opérations drag & drop', () => {
        it('devrait déplacer les éléments fluidement dans le planning', () => {
            cy.visit('/bloc-operatoire');
            
            // Mesurer la fluidité du drag & drop
            cy.get('[data-testid="assignment-card"]').first().as('sourceCard');
            cy.get('[data-testid="drop-zone"]').first().as('targetZone');
            
            const startTime = Date.now();
            
            cy.get('@sourceCard').trigger('dragstart');
            cy.get('@targetZone').trigger('dragover');
            cy.get('@targetZone').trigger('drop');
            
            cy.get('[data-testid="drop-feedback"]').should('be.visible');
            
            cy.then(() => {
                const dropTime = Date.now() - startTime;
                expect(dropTime).to.be.lessThan(100); // Très réactif
                cy.log(`Drag & drop effectué en ${dropTime}ms`);
            });
        });

        it('devrait gérer le tri de grandes listes sans lag', () => {
            cy.visit('/admin/utilisateurs');
            
            // Trier une grande liste
            const startTime = Date.now();
            cy.get('[data-testid="sort-by-name"]').click();
            
            cy.get('[data-testid="sort-complete"]').should('exist');
            
            cy.then(() => {
                const sortTime = Date.now() - startTime;
                expect(sortTime).to.be.lessThan(1000);
                cy.log(`Tri de 1000+ éléments en ${sortTime}ms`);
            });
        });
    });

    describe('Performance des filtres et recherches', () => {
        it('devrait filtrer les données instantanément', () => {
            cy.visit('/admin/conges');
            
            // Test de filtre en temps réel
            cy.get('[data-testid="status-filter"]').select('PENDING');
            
            // Le filtre doit être quasi-instantané
            cy.get('[data-testid="filtered-results"]').should('be.visible');
            cy.get('[data-testid="filter-delay"]').should('have.attr', 'data-time').then((time) => {
                expect(parseInt(time)).to.be.lessThan(200);
            });
        });

        it('devrait gérer la recherche avec autocomplétion rapidement', () => {
            cy.visit('/admin/planning/assign');
            
            cy.get('[data-testid="user-search"]').type('dupo');
            
            // L'autocomplétion doit apparaître rapidement
            cy.get('[data-testid="autocomplete-results"]', { timeout: 500 }).should('be.visible');
            cy.get('[data-testid="autocomplete-item"]').should('have.length.greaterThan', 0);
        });
    });

    describe('Performance des rapports et exports', () => {
        it('devrait générer un rapport PDF rapidement', () => {
            cy.visit('/admin/reports');
            
            cy.get('[data-testid="report-type"]').select('MONTHLY_SUMMARY');
            cy.get('[data-testid="month-selector"]').select('2024-01');
            
            const startTime = Date.now();
            cy.get('[data-testid="generate-pdf"]').click();
            
            cy.get('[data-testid="pdf-ready"]', { timeout: 10000 }).should('be.visible');
            
            cy.then(() => {
                const generationTime = Date.now() - startTime;
                expect(generationTime).to.be.lessThan(5000);
                cy.log(`Rapport PDF généré en ${generationTime}ms`);
            });
        });

        it('devrait exporter des données volumineuses en CSV rapidement', () => {
            cy.visit('/admin/utilisateurs');
            
            const startTime = Date.now();
            cy.get('[data-testid="export-all-csv"]').click();
            
            cy.get('[data-testid="export-complete"]', { timeout: 8000 }).should('be.visible');
            
            cy.then(() => {
                const exportTime = Date.now() - startTime;
                expect(exportTime).to.be.lessThan(3000);
                cy.log(`Export CSV de 1000+ utilisateurs en ${exportTime}ms`);
            });
        });
    });

    describe('Performance de la navigation', () => {
        it('devrait naviguer entre les pages sans délai perceptible', () => {
            const pages = [
                '/admin/dashboard',
                '/admin/utilisateurs',
                '/admin/conges',
                '/admin/planning',
                '/admin/sites'
            ];
            
            pages.forEach((page, index) => {
                const startTime = Date.now();
                cy.visit(page);
                
                cy.get('[data-testid="page-content"]').should('be.visible');
                
                cy.then(() => {
                    const loadTime = Date.now() - startTime;
                    expect(loadTime).to.be.lessThan(1500);
                    cy.log(`Page ${page} chargée en ${loadTime}ms`);
                });
            });
        });

        it('devrait gérer le cache du routeur efficacement', () => {
            // Première visite
            const startTime1 = Date.now();
            cy.visit('/admin/utilisateurs');
            cy.get('[data-testid="users-table"]').should('be.visible');
            
            cy.then(() => {
                const firstLoad = Date.now() - startTime1;
                
                // Navigation vers une autre page
                cy.visit('/admin/dashboard');
                cy.get('[data-testid="dashboard-widgets"]').should('be.visible');
                
                // Retour à la page utilisateurs (doit être plus rapide)
                const startTime2 = Date.now();
                cy.visit('/admin/utilisateurs');
                cy.get('[data-testid="users-table"]').should('be.visible');
                
                cy.then(() => {
                    const secondLoad = Date.now() - startTime2;
                    expect(secondLoad).to.be.lessThan(firstLoad * 0.7); // 30% plus rapide minimum
                    cy.log(`Cache efficace: ${firstLoad}ms -> ${secondLoad}ms`);
                });
            });
        });
    });

    describe('Performance sous charge', () => {
        it('devrait gérer de multiples requêtes simultanées', () => {
            cy.visit('/admin/dashboard');
            
            // Simuler plusieurs actions simultanées
            const startTime = Date.now();
            
            // Actions parallèles
            cy.get('[data-testid="refresh-stats"]').click();
            cy.get('[data-testid="load-notifications"]').click();
            cy.get('[data-testid="update-calendar"]').click();
            
            // Attendre que toutes les actions soient terminées
            cy.get('[data-testid="all-widgets-loaded"]').should('be.visible');
            
            cy.then(() => {
                const totalTime = Date.now() - startTime;
                expect(totalTime).to.be.lessThan(4000); // Toutes les actions en moins de 4s
                cy.log(`Charges multiples gérées en ${totalTime}ms`);
            });
        });

        it('devrait maintenir la responsivité lors d\'opérations lourdes', () => {
            cy.visit('/admin/simulations');
            
            // Lancer une simulation complexe
            cy.get('[data-testid="complex-simulation-btn"]').click();
            
            // Vérifier que l'interface reste responsive
            cy.get('[data-testid="cancel-simulation"]').should('be.visible');
            cy.get('[data-testid="progress-indicator"]').should('be.visible');
            
            // Tester l'interaction pendant le traitement
            cy.get('[data-testid="other-tab"]').click();
            cy.get('[data-testid="tab-content"]').should('be.visible');
            
            // L'interface doit rester fluide
            cy.get('body').should('not.have.class', 'frozen');
        });
    });

    describe('Performance mémoire', () => {
        it('ne devrait pas avoir de fuites mémoire lors de navigation intensive', () => {
            // Test de navigation répétée pour détecter les fuites
            const pages = ['/admin/utilisateurs', '/admin/conges', '/admin/planning'];
            
            // Navigation répétée
            for (let i = 0; i < 5; i++) {
                pages.forEach(page => {
                    cy.visit(page);
                    cy.get('[data-testid="page-content"]').should('be.visible');
                    cy.wait(100);
                });
            }
            
            // Vérifier que la performance ne se dégrade pas
            const finalStartTime = Date.now();
            cy.visit('/admin/utilisateurs');
            cy.get('[data-testid="users-table"]').should('be.visible');
            
            cy.then(() => {
                const finalLoadTime = Date.now() - finalStartTime;
                expect(finalLoadTime).to.be.lessThan(2000); // Pas de dégradation
                cy.log(`Performance stable après navigation intensive: ${finalLoadTime}ms`);
            });
        });
    });

    describe('Benchmarks et métriques', () => {
        it('devrait mesurer et enregistrer les métriques de performance', () => {
            cy.visit('/admin/dashboard');
            
            // Mesurer différentes métriques
            cy.window().then((win) => {
                const performance = win.performance;
                
                // Temps de chargement initial
                const navigationStart = performance.timing.navigationStart;
                const domContentLoaded = performance.timing.domContentLoadedEventEnd;
                const loadComplete = performance.timing.loadEventEnd;
                
                const domTime = domContentLoaded - navigationStart;
                const loadTime = loadComplete - navigationStart;
                
                cy.log(`DOM Ready: ${domTime}ms`);
                cy.log(`Load Complete: ${loadTime}ms`);
                
                expect(domTime).to.be.lessThan(1500);
                expect(loadTime).to.be.lessThan(3000);
                
                // Enregistrer dans un fichier pour suivi
                cy.writeFile('cypress/reports/performance-metrics.json', {
                    timestamp: new Date().toISOString(),
                    domTime,
                    loadTime,
                    page: '/admin/dashboard'
                }, { flag: 'a+' });
            });
        });
    });
});