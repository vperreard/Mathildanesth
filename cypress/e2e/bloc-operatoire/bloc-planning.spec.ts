describe('Module Bloc Opératoire', () => {
    beforeEach(() => {
        // Se connecter en tant qu'admin
        cy.login('admin@example.com', 'password');
        cy.visit('/bloc-operatoire');
    });

    describe('Navigation et interface', () => {
        it('devrait afficher les 4 onglets principaux', () => {
            cy.get('[role="tablist"]').within(() => {
                cy.contains('Planning').should('be.visible');
                cy.contains('Salles').should('be.visible');
                cy.contains('Secteurs').should('be.visible');
                cy.contains('Règles').should('be.visible');
            });
        });

        it('devrait charger le module en moins de 2 secondes', () => {
            const startTime = Date.now();
            
            cy.get('[data-testid="bloc-planning-content"]', { timeout: 2000 })
                .should('be.visible')
                .then(() => {
                    const loadTime = Date.now() - startTime;
                    expect(loadTime).to.be.lessThan(2000);
                });
        });

        it('devrait naviguer entre les onglets', () => {
            // Cliquer sur l'onglet Salles
            cy.contains('[role="tab"]', 'Salles').click();
            cy.contains('Gestion des salles').should('be.visible');

            // Cliquer sur l'onglet Secteurs
            cy.contains('[role="tab"]', 'Secteurs').click();
            cy.contains('Gestion des secteurs').should('be.visible');

            // Retour au planning
            cy.contains('[role="tab"]', 'Planning').click();
            cy.contains('Planning du Bloc Opératoire').should('be.visible');
        });
    });

    describe('Planning et drag & drop', () => {
        beforeEach(() => {
            cy.contains('[role="tab"]', 'Planning').click();
        });

        it('devrait afficher la vue hebdomadaire par défaut', () => {
            cy.get('[data-testid="view-selector"]').should('have.value', 'week');
            cy.get('[data-testid="week-grid"]').should('be.visible');
        });

        it('devrait permettre le drag & drop d\'une affectation', () => {
            // Créer une affectation test
            cy.get('[data-testid="add-affectation-btn"]').click();
            cy.get('[data-testid="affectation-dialog"]').within(() => {
                cy.get('[name="supervisorId"]').select('1');
                cy.get('[name="roomId"]').select('1');
                cy.get('[name="day"]').select('MONDAY');
                cy.get('[name="period"]').select('MORNING');
                cy.contains('button', 'Créer').click();
            });

            // Attendre que l'affectation apparaisse
            cy.get('[data-testid="affectation-1"]').should('be.visible');

            // Drag & drop vers mardi après-midi
            cy.get('[data-testid="affectation-1"]')
                .drag('[data-testid="cell-TUESDAY-AFTERNOON"]');

            // Vérifier le déplacement
            cy.get('[data-testid="cell-TUESDAY-AFTERNOON"]')
                .should('contain', 'Dr');
        });

        it('devrait afficher les conflits en temps réel', () => {
            // Créer deux affectations conflictuelles
            cy.createAffectation({
                supervisorId: 1,
                roomId: 1,
                day: 'MONDAY',
                period: 'MORNING'
            });

            cy.createAffectation({
                supervisorId: 1,
                roomId: 2,
                day: 'MONDAY',
                period: 'MORNING'
            });

            cy.createAffectation({
                supervisorId: 1,
                roomId: 3,
                day: 'MONDAY',
                period: 'MORNING'
            });

            // Vérifier l'indicateur de conflit
            cy.get('[data-testid="conflict-indicator"]')
                .should('be.visible')
                .and('contain', 'Limite de 2 salles dépassée');
        });
    });

    describe('Gestion des salles', () => {
        beforeEach(() => {
            cy.contains('[role="tab"]', 'Salles').click();
        });

        it('devrait créer une nouvelle salle', () => {
            cy.get('[data-testid="add-room-btn"]').click();
            
            cy.get('[data-testid="room-form"]').within(() => {
                cy.get('[name="name"]').type('Salle Test');
                cy.get('[name="description"]').type('Description test');
                cy.get('[name="capacity"]').clear().type('2');
                cy.get('[name="sectorId"]').select('1');
                cy.contains('button', 'Créer').click();
            });

            cy.contains('Salle créée avec succès').should('be.visible');
            cy.contains('Salle Test').should('be.visible');
        });

        it('devrait modifier une salle existante', () => {
            cy.get('[data-testid="room-1"]').within(() => {
                cy.get('[data-testid="edit-btn"]').click();
            });

            cy.get('[name="capacity"]').clear().type('3');
            cy.get('[data-testid="save-btn"]').click();

            cy.contains('Salle mise à jour').should('be.visible');
        });

        it('devrait gérer les équipements d\'une salle', () => {
            cy.get('[data-testid="room-1"]').within(() => {
                cy.get('[data-testid="edit-btn"]').click();
            });

            // Ajouter un équipement
            cy.get('[name="equipment-input"]').type('Respirateur');
            cy.get('[data-testid="add-equipment-btn"]').click();

            cy.contains('Respirateur').should('be.visible');
        });
    });

    describe('Gestion des secteurs', () => {
        beforeEach(() => {
            cy.contains('[role="tab"]', 'Secteurs').click();
        });

        it('devrait créer un nouveau secteur', () => {
            cy.get('[data-testid="add-sector-btn"]').click();
            
            cy.get('[data-testid="sector-form"]').within(() => {
                cy.get('[name="name"]').type('Secteur Cardio');
                cy.get('[name="category"]').select('SPECIALIZED');
                cy.get('[name="sectorType"]').select('CARDIAC');
                cy.get('[name="maxRoomsPerSupervisor"]').clear().type('1');
                cy.contains('button', 'Créer').click();
            });

            cy.contains('Secteur créé avec succès').should('be.visible');
            cy.contains('Secteur Cardio').should('be.visible');
        });

        it('devrait configurer les règles de supervision', () => {
            cy.get('[data-testid="sector-1"]').within(() => {
                cy.get('[data-testid="edit-btn"]').click();
            });

            // Activer la contiguïté requise
            cy.get('[name="requiresContiguousRooms"]').check();
            
            // Sélectionner les secteurs compatibles
            cy.contains('Général').click();
            
            cy.get('[data-testid="save-btn"]').click();

            cy.contains('Salles contiguës requises').should('be.visible');
        });
    });

    describe('Validation des règles métier', () => {
        beforeEach(() => {
            cy.contains('[role="tab"]', 'Planning').click();
            cy.get('[data-testid="editor-tab"]').click();
        });

        it('devrait valider le nombre max de salles par superviseur', () => {
            // Tenter d'assigner 3 salles à un superviseur
            for (let i = 1; i <= 3; i++) {
                cy.createAffectationInEditor({
                    supervisorId: 1,
                    roomId: i,
                    day: 'MONDAY',
                    period: 'MORNING'
                });
            }

            // Vérifier l'avertissement
            cy.get('[data-testid="validation-warning"]')
                .should('contain', '3ème salle possible mais déconseillée');
        });

        it('devrait valider la contiguïté des salles', () => {
            // Assigner salle 1 et salle 3 (non contiguës)
            cy.createAffectationInEditor({
                supervisorId: 1,
                roomId: 1,
                day: 'MONDAY',
                period: 'MORNING'
            });

            cy.createAffectationInEditor({
                supervisorId: 1,
                roomId: 3,
                day: 'MONDAY',
                period: 'MORNING'
            });

            // Vérifier l'erreur
            cy.get('[data-testid="validation-error"]')
                .should('contain', 'Les salles doivent être contiguës');
        });

        it('devrait valider la compatibilité des secteurs', () => {
            // Tenter d'assigner un superviseur à des secteurs incompatibles
            cy.createAffectationInEditor({
                supervisorId: 1,
                roomId: 1, // Secteur général
                day: 'MONDAY',
                period: 'MORNING'
            });

            cy.createAffectationInEditor({
                supervisorId: 1,
                roomId: 10, // Secteur endoscopie
                day: 'MONDAY',
                period: 'MORNING'
            });

            // Vérifier l'erreur
            cy.get('[data-testid="validation-error"]')
                .should('contain', 'Incompatibilité: GENERAL ne peut pas être supervisé avec ENDOSCOPY');
        });
    });

    describe('Fonctionnalités avancées', () => {
        it('devrait supporter l\'undo/redo', () => {
            cy.get('[data-testid="editor-tab"]').click();

            // Créer une affectation
            cy.createAffectationInEditor({
                supervisorId: 1,
                roomId: 1,
                day: 'MONDAY',
                period: 'MORNING'
            });

            // Undo
            cy.get('[data-testid="undo-btn"]').click();
            cy.get('[data-testid="affectation-list"]')
                .should('not.contain', 'Dr');

            // Redo
            cy.get('[data-testid="redo-btn"]').click();
            cy.get('[data-testid="affectation-list"]')
                .should('contain', 'Dr');
        });

        it('devrait sauvegarder automatiquement après 3 secondes', () => {
            cy.get('[data-testid="editor-tab"]').click();

            // Créer une affectation
            cy.createAffectationInEditor({
                supervisorId: 1,
                roomId: 1,
                day: 'MONDAY',
                period: 'MORNING'
            });

            // Vérifier l'indicateur "non sauvegardé"
            cy.contains('Non sauvegardé').should('be.visible');

            // Attendre 3 secondes
            cy.wait(3000);

            // Vérifier que la sauvegarde est effectuée
            cy.contains('Non sauvegardé').should('not.exist');
        });

        it('devrait afficher les métriques de performance', () => {
            // En mode développement seulement
            if (Cypress.env('NODE_ENV') === 'development') {
                cy.get('[data-testid="performance-indicator"]')
                    .should('be.visible')
                    .and('contain', 'Données chargées en cache');
            }
        });
    });
});

// Commandes personnalisées pour les tests
Cypress.Commands.add('createAffectation', (affectation) => {
    cy.request('POST', '/api/bloc-operatoire/affectations', affectation);
});

Cypress.Commands.add('createAffectationInEditor', (affectation) => {
    cy.get(`[data-testid="cell-${affectation.day}-${affectation.period}"]`).click();
    cy.get('[data-testid="affectation-dialog"]').within(() => {
        cy.get('[name="supervisorId"]').select(affectation.supervisorId.toString());
        cy.get('[name="roomId"]').select(affectation.roomId.toString());
        cy.contains('button', 'Créer').click();
    });
});