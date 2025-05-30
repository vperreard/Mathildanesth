describe('Workflow Planning Bloc Opératoire', () => {
    const chirurgien = {
        email: 'chirurgien@example.com',
        password: 'Test123!',
        nom: 'Chirurgien',
        prenom: 'Expert'
    };

    beforeEach(() => {
        cy.cleanState();
        
        // Configuration des interceptions API pour bloc opératoire
        cy.intercept('POST', '**/api/auth/login', { fixture: 'auth-response.json' }).as('login');
        cy.intercept('GET', '**/api/bloc-operatoire/salles', { fixture: 'operatingRooms.json' }).as('operatingRooms');
        cy.intercept('GET', '**/api/bloc-operatoire/chirurgiens', { fixture: 'surgeons.json' }).as('surgeons');
        cy.intercept('GET', '**/api/bloc-operatoire/specialites', { fixture: 'specialties.json' }).as('specialties');
        cy.intercept('POST', '**/api/bloc-operatoire/planning', { 
            body: { success: true, planningId: 'plan-123' } 
        }).as('createBlocPlanning');
        cy.intercept('PUT', '**/api/bloc-operatoire/planning/**', {
            body: { success: true }
        }).as('updateBlocPlanning');
        
        cy.task('seedTestData', { fixtures: ['operatingRooms', 'surgeons'] });
    });

    it('permet un workflow complet : planning bloc → affectation chirurgiens → validation compétences', () => {
        // ÉTAPE 1: Connexion
        cy.log('🔐 ÉTAPE 1: Connexion utilisateur bloc');
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', chirurgien.email);
        cy.safeType('[data-cy=password-input]', chirurgien.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('login');
        cy.url({ timeout: 15000 }).should('include', '/tableau-de-bord');

        // ÉTAPE 2: Accès au planning bloc opératoire
        cy.log('🏥 ÉTAPE 2: Accès au planning bloc opératoire');
        cy.get('[data-cy=nav-bloc-operatoire]').click();
        cy.waitForApiResponse('operatingRooms');
        
        cy.url().should('include', '/bloc-operatoire');
        cy.waitForElement('[data-cy=bloc-planning-interface]');
        
        // Vérifier l'interface de planning
        cy.get('[data-cy=bloc-planning-interface]').should('be.visible');
        cy.get('[data-cy=operating-rooms-list]').should('exist');
        cy.get('[data-cy=surgeons-list]').should('exist');

        // ÉTAPE 3: Création d'un planning bloc
        cy.log('📅 ÉTAPE 3: Création d\'un planning bloc');
        cy.safeClick('[data-cy=create-bloc-planning-button]');
        cy.waitForElement('[data-cy=bloc-planning-modal]');
        
        cy.get('[data-cy=bloc-planning-modal]').within(() => {
            // Sélectionner la date
            cy.safeType('[data-cy=planning-date]', '2025-06-15');
            
            // Sélectionner le secteur
            cy.safeClick('[data-cy=sector-select]');
            cy.get('[data-cy=sector-option-chirurgie-generale]').click();
            
            // Sélectionner la salle
            cy.safeClick('[data-cy=room-select]');
            cy.get('[data-cy=room-option-salle-1]').click();
            
            cy.safeClick('[data-cy=create-planning-button]');
        });
        
        cy.waitForApiResponse('createBlocPlanning');
        
        // Vérifier la création
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Planning créé');

        // ÉTAPE 4: Affectation des chirurgiens
        cy.log('👨‍⚕️ ÉTAPE 4: Affectation des chirurgiens');
        cy.waitForElement('[data-cy=bloc-planning-grid]');
        
        // Drag and drop chirurgien vers créneau
        cy.get('[data-cy=available-surgeons]').within(() => {
            cy.get('[data-cy=surgeon-item]').first().as('firstSurgeon');
        });
        
        cy.get('[data-cy=bloc-planning-grid]').within(() => {
            cy.get('[data-cy=time-slot-morning]').as('morningSlot');
        });
        
        // Simuler le drag and drop
        cy.get('@firstSurgeon').dragTo('@morningSlot');
        
        // Vérifier l'affectation
        cy.get('@morningSlot').within(() => {
            cy.get('[data-cy=assigned-surgeon]').should('be.visible');
        });

        // ÉTAPE 5: Validation des compétences
        cy.log('✅ ÉTAPE 5: Validation des compétences');
        cy.get('[data-cy=validate-competences-button]').click();
        cy.waitForElement('[data-cy=competence-validation-modal]');
        
        cy.get('[data-cy=competence-validation-modal]').within(() => {
            // Vérifier les compétences requises
            cy.get('[data-cy=required-competences]').should('be.visible');
            cy.get('[data-cy=surgeon-competences]').should('be.visible');
            
            // Vérifier la compatibilité
            cy.get('[data-cy=competence-match-status]').should('contain', 'Compatible');
            
            cy.safeClick('[data-cy=confirm-assignment-button]');
        });
        
        cy.waitForApiResponse('updateBlocPlanning');
        
        // Vérifier la validation
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Affectation validée');

        // ÉTAPE 6: Visualisation du planning final
        cy.log('👁️ ÉTAPE 6: Visualisation du planning final');
        cy.get('[data-cy=bloc-planning-grid]').within(() => {
            cy.get('[data-cy=validated-assignment]').should('have.length.at.least', 1);
            cy.get('[data-cy=assignment-status-confirmed]').should('be.visible');
        });
        
        // Vérifier les détails de l'affectation
        cy.get('[data-cy=validated-assignment]').first().click();
        cy.waitForElement('[data-cy=assignment-details-modal]');
        
        cy.get('[data-cy=assignment-details-modal]').within(() => {
            cy.get('[data-cy=surgeon-name]').should('be.visible');
            cy.get('[data-cy=operation-type]').should('be.visible');
            cy.get('[data-cy=estimated-duration]').should('be.visible');
            cy.get('[data-cy=competence-status]').should('contain', 'Certifié');
        });

        // ÉTAPE 7: Export et partage
        cy.log('📤 ÉTAPE 7: Export et partage du planning');
        cy.get('[data-cy=export-planning-button]').click();
        cy.waitForElement('[data-cy=export-options-modal]');
        
        cy.get('[data-cy=export-options-modal]').within(() => {
            cy.safeClick('[data-cy=export-format-pdf]');
            cy.safeClick('[data-cy=export-button]');
        });
        
        // Vérifier l'export
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Planning exporté');
    });

    it('gère les conflits de planification', () => {
        // Test de gestion des conflits
        cy.log('⚠️ Test de gestion des conflits');
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', chirurgien.email);
        cy.safeType('[data-cy=password-input]', chirurgien.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('login');
        cy.get('[data-cy=nav-bloc-operatoire]').click();
        cy.waitForApiResponse('operatingRooms');
        
        // Simuler un conflit (chirurgien déjà affecté)
        cy.intercept('POST', '**/api/bloc-operatoire/planning', {
            statusCode: 409,
            body: { 
                error: 'Conflit d\'affectation',
                conflicts: [{
                    type: 'surgeon_busy',
                    surgeonId: 'surgeon-1',
                    timeSlot: '08:00-12:00'
                }]
            }
        }).as('planningConflict');
        
        // Tenter une affectation conflictuelle
        cy.get('[data-cy=available-surgeons]').within(() => {
            cy.get('[data-cy=surgeon-item]').first().dragTo('[data-cy=time-slot-morning]');
        });
        
        cy.waitForApiResponse('planningConflict');
        
        // Vérifier la détection du conflit
        cy.waitForElement('[data-cy=conflict-alert]');
        cy.get('[data-cy=conflict-alert]')
            .should('be.visible')
            .and('contain', 'Conflit d\'affectation');
        
        // Proposer une résolution
        cy.get('[data-cy=resolve-conflict-button]').click();
        cy.waitForElement('[data-cy=conflict-resolution-modal]');
        
        cy.get('[data-cy=conflict-resolution-modal]').within(() => {
            cy.get('[data-cy=conflict-description]').should('be.visible');
            cy.get('[data-cy=alternative-suggestions]').should('be.visible');
            
            // Sélectionner une alternative
            cy.get('[data-cy=alternative-suggestion]').first().click();
            cy.safeClick('[data-cy=apply-alternative-button]');
        });
        
        // Vérifier la résolution
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Conflit résolu');
    });

    it('optimise les performances du planning bloc', () => {
        // Test de performance pour planning bloc
        cy.log('⚡ Test de performance planning bloc');
        
        const startTime = performance.now();
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', chirurgien.email);
        cy.safeType('[data-cy=password-input]', chirurgien.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('login');
        
        // Mesurer le chargement du module bloc
        const blocLoadStart = performance.now();
        cy.get('[data-cy=nav-bloc-operatoire]').click();
        cy.waitForApiResponse('operatingRooms').then(() => {
            const blocLoadTime = performance.now() - blocLoadStart;
            cy.task('logPerformance', {
                type: 'bloc-workflow',
                name: 'bloc-module-load',
                duration: blocLoadTime,
                timestamp: Date.now(),
                status: blocLoadTime < 2000 ? 'PASS' : 'SLOW'
            });
            
            expect(blocLoadTime).to.be.lessThan(2000);
        });
        
        // Test de performance drag and drop
        const dragDropStart = performance.now();
        cy.get('[data-cy=available-surgeons]').within(() => {
            cy.get('[data-cy=surgeon-item]').first().dragTo('[data-cy=time-slot-morning]');
        });
        
        cy.window().then(() => {
            const dragDropTime = performance.now() - dragDropStart;
            cy.task('logPerformance', {
                type: 'bloc-workflow',
                name: 'drag-drop-assignment',
                duration: dragDropTime,
                timestamp: Date.now(),
                status: dragDropTime < 500 ? 'PASS' : 'SLOW'
            });
            
            // Drag and drop doit être instantané (< 500ms)
            expect(dragDropTime).to.be.lessThan(500);
        });
    });

    afterEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
    });
});