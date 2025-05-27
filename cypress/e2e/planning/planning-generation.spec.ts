describe('Génération de Planning', () => {
    beforeEach(() => {
    jest.clearAllMocks();
        // Se connecter en tant qu'admin
        cy.login('admin@example.com', 'password');
        cy.visit('/planning');
    });

    describe('Génération complète', () => {
        it('devrait générer un planning pour un mois complet', () => {
            // Naviguer vers la génération
            cy.get('[data-testid="generate-planning-btn"]').click();
            
            // Configurer les paramètres
            cy.get('[data-testid="date-range-picker"]').click();
            cy.get('[data-testid="start-date"]').type('2024-02-01');
            cy.get('[data-testid="end-date"]').type('2024-02-29');
            
            // Sélectionner les types d'affectations
            cy.get('[data-testid="assignment-type-garde"]').check();
            cy.get('[data-testid="assignment-type-astreinte"]').check();
            cy.get('[data-testid="assignment-type-consultation"]').check();
            cy.get('[data-testid="assignment-type-bloc"]').check();
            
            // Configurer l'optimisation
            cy.get('[data-testid="optimization-level"]').select('standard');
            cy.get('[data-testid="apply-preferences"]').check();
            
            // Lancer la génération
            cy.get('[data-testid="generate-btn"]').click();
            
            // Vérifier le chargement
            cy.get('[data-testid="generation-progress"]').should('be.visible');
            
            // Attendre la fin (max 30 secondes)
            cy.get('[data-testid="generation-complete"]', { timeout: 30000 })
                .should('be.visible');
            
            // Vérifier les résultats
            cy.get('[data-testid="total-assignments"]')
                .should('contain', 'assignments générées');
            
            cy.get('[data-testid="coverage-percentage"]')
                .invoke('text')
                .then((text) => {
                    const percentage = parseInt(text);
                    expect(percentage).to.be.greaterThan(90);
                });
        });

        it('devrait respecter les contraintes de repos', () => {
            // Générer un planning
            cy.generateTestPlanning({
                startDate: '2024-02-01',
                endDate: '2024-02-07',
                types: ['GARDE']
            });
            
            // Aller à la validation
            cy.get('[data-testid="validate-planning-btn"]').click();
            
            // Vérifier qu'aucune violation de repos n'est détectée
            cy.get('[data-testid="violations-list"]')
                .should('not.contain', 'Période de repos insuffisante');
        });

        it('devrait équilibrer les affectations entre utilisateurs', () => {
            cy.generateTestPlanning({
                startDate: '2024-02-01',
                endDate: '2024-02-29',
                types: ['GARDE', 'ASTREINTE']
            });
            
            // Vérifier l'équité
            cy.get('[data-testid="equity-score"]')
                .invoke('text')
                .then((text) => {
                    const score = parseInt(text);
                    expect(score).to.be.greaterThan(80);
                });
            
            // Vérifier la distribution
            cy.get('[data-testid="user-assignments-count"]').each(($el) => {
                const count = parseInt($el.text());
                expect(count).to.be.within(3, 8); // Entre 3 et 8 affectations par utilisateur
            });
        });
    });

    describe('Validation et modifications', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            // Générer un planning de test
            cy.generateTestPlanning({
                startDate: '2024-02-01',
                endDate: '2024-02-29'
            });
            cy.visit('/planning/validation');
        });

        it('devrait permettre le drag & drop pour modifier les affectations', () => {
            // Sélectionner une affectation
            cy.get('[data-testid="assignment-G24-user1-2024-02-05"]')
                .as('sourceAssignment');
            
            // Drag vers un autre utilisateur
            cy.get('@sourceAssignment').drag('[data-testid="cell-user2-2024-02-05"]');
            
            // Vérifier que l'affectation a été déplacée
            cy.get('[data-testid="cell-user2-2024-02-05"]')
                .should('contain', 'G24');
            
            // Vérifier que la validation se met à jour
            cy.get('[data-testid="validation-status"]')
                .should('contain', 'Revalidation en cours');
            
            cy.wait(1000);
            
            cy.get('[data-testid="validation-status"]')
                .should('contain', 'Valide');
        });

        it('devrait détecter et afficher les conflits', () => {
            // Créer un conflit en déplaçant une garde
            cy.get('[data-testid="assignment-G24-user1-2024-02-05"]')
                .drag('[data-testid="cell-user1-2024-02-06"]');
            
            // Vérifier qu'un conflit est détecté
            cy.get('[data-testid="conflicts-tab"]').click();
            cy.get('[data-testid="conflict-list"]')
                .should('contain', 'Gardes consécutives');
            
            // Vérifier le nombre de conflits
            cy.get('[data-testid="conflicts-count"]')
                .should('contain', '1');
        });

        it('devrait proposer des résolutions automatiques', () => {
            // Créer un conflit
            cy.createTestConflict();
            
            // Aller aux conflits
            cy.get('[data-testid="conflicts-tab"]').click();
            
            // Cliquer sur un conflit
            cy.get('[data-testid="conflict-item"]').first().click();
            
            // Vérifier les résolutions proposées
            cy.get('[data-testid="resolution-options"]')
                .should('be.visible')
                .children()
                .should('have.length.greaterThan', 0);
            
            // Appliquer une résolution
            cy.get('[data-testid="apply-resolution-0"]').click();
            
            // Vérifier que le conflit est résolu
            cy.get('[data-testid="conflicts-count"]')
                .should('contain', '0');
        });
    });

    describe('Remplacement rapide', () => {
        it('devrait trouver des remplaçants disponibles', () => {
            cy.generateTestPlanning();
            cy.visit('/planning');
            
            // Cliquer sur une affectation
            cy.get('[data-testid="assignment-G24-user1-2024-02-15"]')
                .rightclick();
            
            cy.get('[data-testid="quick-replace-option"]').click();
            
            // Vérifier l'ouverture du modal
            cy.get('[data-testid="replacement-modal"]')
                .should('be.visible');
            
            // Vérifier la liste des candidats
            cy.get('[data-testid="replacement-candidates"]')
                .children()
                .should('have.length.greaterThan', 0);
            
            // Vérifier les scores
            cy.get('[data-testid="candidate-score"]').each(($el) => {
                const score = parseInt($el.text());
                expect(score).to.be.within(0, 100);
            });
        });

        it('devrait effectuer un remplacement en 3 clics', () => {
            cy.generateTestPlanning();
            cy.visit('/planning');
            
            // 1er clic: Ouvrir le menu
            cy.get('[data-testid="assignment-AST-user2-2024-02-20"]')
                .rightclick();
            
            // 2e clic: Sélectionner remplacement rapide
            cy.get('[data-testid="quick-replace-option"]').click();
            
            // 3e clic: Confirmer avec le premier candidat
            cy.get('[data-testid="select-candidate-0"]').click();
            cy.get('[data-testid="confirm-replacement"]').click();
            
            // Vérifier le remplacement
            cy.get('[data-testid="assignment-AST-user2-2024-02-20"]')
                .should('not.exist');
            
            cy.get('[data-testid="success-toast"]')
                .should('contain', 'Remplacement effectué');
        });
    });

    describe('Performance avec charge importante', () => {
        it('devrait gérer 100+ utilisateurs sans ralentissement', () => {
            // Créer beaucoup d'utilisateurs de test
            cy.createTestUsers(100);
            
            // Mesurer le temps de génération
            const startTime = Date.now();
            
            cy.generateTestPlanning({
                startDate: '2024-02-01',
                endDate: '2024-02-29',
                userCount: 100
            });
            
            const generationTime = Date.now() - startTime;
            
            // Vérifier que la génération prend moins de 10 secondes
            expect(generationTime).to.be.lessThan(10000);
            
            // Vérifier la fluidité de l'interface
            cy.visit('/planning/validation');
            
            // Scroll performance
            cy.get('[data-testid="planning-grid"]').scrollTo('bottom', {
                duration: 1000
            });
            
            // Drag & drop performance
            cy.get('[data-testid^="assignment-"]').first()
                .drag('[data-testid^="cell-"]').eq(50);
            
            // Vérifier qu'il n'y a pas de lag visible
            cy.get('[data-testid="fps-counter"]')
                .invoke('text')
                .then((text) => {
                    const fps = parseInt(text);
                    expect(fps).to.be.greaterThan(30);
                });
        });
    });
});

// Commandes personnalisées
Cypress.Commands.add('generateTestPlanning', (options = {}) => {
    cy.request('POST', '/api/test/generate-planning', {
        startDate: options.startDate || '2024-02-01',
        endDate: options.endDate || '2024-02-29',
        types: options.types || ['GARDE', 'ASTREINTE', 'CONSULTATION', 'BLOC'],
        userCount: options.userCount || 20
    });
});

Cypress.Commands.add('createTestConflict', () => {
    cy.request('POST', '/api/test/create-conflict', {
        type: 'consecutive-gardes'
    });
});

Cypress.Commands.add('createTestUsers', (count) => {
    cy.request('POST', '/api/test/create-users', { count });
});