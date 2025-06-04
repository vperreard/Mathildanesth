describe('Workflow complet utilisateur', () => {
    const testUser = {
        email: 'medecin@example.com',
        password: 'Test123!',
        nom: 'Martin',
        prenom: 'Jean'
    };

    beforeEach(() => {
        cy.cleanState();
        
        // Configuration des interceptions API
        cy.intercept('POST', '**/api/auth/login', { fixture: 'auth-response.json' }).as('login');
        cy.intercept('GET', '**/api/auth/me', { fixture: 'user-profile.json' }).as('userProfile');
        cy.intercept('GET', '**/api/planning/**', { fixture: 'planning-data.json' }).as('planningData');
        cy.intercept('GET', '**/api/conges/**', { fixture: 'leaves-data.json' }).as('leavesData');
        cy.intercept('POST', '**/api/conges', { fixture: 'leave-created.json' }).as('createLeave');
        cy.intercept('PUT', '**/api/planning/**', { fixture: 'planning-updated.json' }).as('updatePlanning');
        
        // Préparer la base de données
        cy.task('seedTestData', { fixtures: ['users'] });
    });

    it('permet un workflow complet : connexion → consultation planning → demande congé → validation', () => {
        // ÉTAPE 1: Connexion
        cy.log('🔐 ÉTAPE 1: Connexion utilisateur');
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', testUser.email);
        cy.safeType('[data-cy=password-input]', testUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('login');
        cy.url({ timeout: 15000 }).should('include', '/tableau-de-bord');
        
        // Vérifier l'authentification
        cy.waitForElement('[data-cy=user-name]');
        cy.get('[data-cy=user-name]').should('contain', testUser.nom);

        // ÉTAPE 2: Navigation vers le planning
        cy.log('📅 ÉTAPE 2: Consultation du planning');
        cy.get('[data-cy=nav-planning]').click();
        cy.waitForApiResponse('planningData');
        
        cy.url().should('include', '/planning');
        cy.waitForElement('[data-cy=planning-calendar]');
        
        // Vérifier que le planning se charge
        cy.get('[data-cy=planning-calendar]').should('be.visible');
        cy.get('[data-cy=planning-grid]').should('exist');

        // ÉTAPE 3: Demande de congé
        cy.log('🏖️ ÉTAPE 3: Création d\'une demande de congé');
        cy.get('[data-cy=nav-conges]').click();
        cy.waitForApiResponse('leavesData');
        
        cy.url().should('include', '/conges');
        cy.waitForElement('[data-cy=create-leave-button]');
        
        // Ouvrir le formulaire de congé
        cy.safeClick('[data-cy=create-leave-button]');
        cy.waitForElement('[data-cy=leave-modal]');
        
        // Remplir le formulaire
        cy.get('[data-cy=leave-modal]').within(() => {
            cy.safeClick('[data-cy=leave-type-select]');
            cy.get('[data-cy=leave-type-option-conge-annuel]').click();
            
            cy.safeType('[data-cy=leave-start-date]', '2025-07-01');
            cy.safeType('[data-cy=leave-end-date]', '2025-07-05');
            cy.safeType('[data-cy=leave-reason]', 'Congés d\'été');
            
            cy.safeClick('[data-cy=submit-leave-button]');
        });
        
        cy.waitForApiResponse('createLeave');
        
        // Vérifier la notification de succès
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Demande de congé créée');

        // ÉTAPE 4: Vérification de la demande
        cy.log('✅ ÉTAPE 4: Vérification de la demande créée');
        cy.waitForElement('[data-cy=leaves-list]');
        cy.get('[data-cy=leaves-list]').within(() => {
            cy.get('[data-cy=leave-item]').should('have.length.at.least', 1);
            cy.get('[data-cy=leave-item]').first().within(() => {
                cy.get('[data-cy=leave-type]').should('contain', 'Congé annuel');
                cy.get('[data-cy=leave-status]').should('contain', 'En attente');
                cy.get('[data-cy=leave-dates]').should('contain', '01/07/2025 - 05/07/2025');
            });
        });

        // ÉTAPE 5: Retour au planning pour vérifier l'impact
        cy.log('🔄 ÉTAPE 5: Vérification de l\'impact sur le planning');
        cy.get('[data-cy=nav-planning]').click();
        cy.waitForPageLoad();
        
        // Vérifier que la demande de congé apparaît dans le planning
        cy.get('[data-cy=planning-calendar]').within(() => {
            cy.get('[data-cy=leave-indicator]').should('exist');
            cy.get('[data-cy=pending-leave]').should('be.visible');
        });

        // ÉTAPE 6: Test de déconnexion
        cy.log('🚪 ÉTAPE 6: Déconnexion');
        cy.get('[data-cy=user-menu]').click();
        cy.waitForElement('[data-cy=logout-option]');
        cy.safeClick('[data-cy=logout-option]');
        
        // Vérifier la redirection vers la page de connexion
        cy.url({ timeout: 10000 }).should('include', '/auth/connexion');
    });

    it('gère les erreurs réseau de manière gracieuse', () => {
        // Test de résilience avec erreurs réseau
        cy.log('🔥 Test de résilience aux erreurs réseau');
        
        // Simuler une erreur réseau sur le login
        cy.intercept('POST', '**/api/auth/login', { forceNetworkError: true }).as('loginError');
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', testUser.email);
        cy.safeType('[data-cy=password-input]', testUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        // Vérifier la gestion d'erreur
        cy.waitForElement('[data-cy=error-message]');
        cy.get('[data-cy=error-message]')
            .should('be.visible')
            .and('contain', 'erreur');
            
        // Récupérer la connexion
        cy.intercept('POST', '**/api/auth/login', { fixture: 'auth-response.json' }).as('loginRetry');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('loginRetry');
        cy.url({ timeout: 15000 }).should('include', '/tableau-de-bord');
    });

    it('maintient les performances sous charge', () => {
        // Test de performance lors du workflow
        cy.log('⚡ Test de performance du workflow');
        
        // Mesurer le temps de connexion
        const startTime = performance.now();
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', testUser.email);
        cy.safeType('[data-cy=password-input]', testUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('login').then(() => {
            const loginTime = performance.now() - startTime;
            cy.task('logPerformance', {
                type: 'workflow',
                name: 'complete-login',
                duration: loginTime,
                timestamp: Date.now(),
                status: loginTime < 3000 ? 'PASS' : 'SLOW'
            });
            
            // Vérifier que la connexion est rapide (< 3s)
            expect(loginTime).to.be.lessThan(3000);
        });
        
        // Test de navigation rapide
        const navStart = performance.now();
        cy.get('[data-cy=nav-planning]').click();
        cy.waitForApiResponse('planningData').then(() => {
            const navTime = performance.now() - navStart;
            cy.task('logPerformance', {
                type: 'workflow',
                name: 'navigation-planning',
                duration: navTime,
                timestamp: Date.now(),
                status: navTime < 2000 ? 'PASS' : 'SLOW'
            });
            
            // Navigation doit être < 2s
            expect(navTime).to.be.lessThan(2000);
        });
    });

    afterEach(() => {
        // Cleanup après chaque test
        cy.clearCookies();
        cy.clearLocalStorage();
    });
});