describe('Workflow complet administrateur', () => {
    const adminUser = {
        email: 'admin@example.com',
        password: 'Test123!',
        nom: 'Admin',
        prenom: 'Super'
    };

    beforeEach(() => {
        cy.cleanState();
        
        // Configuration des interceptions API pour admin
        cy.intercept('POST', '**/api/auth/login', { fixture: 'admin-auth-response.json' }).as('adminLogin');
        cy.intercept('GET', '**/api/auth/me', { fixture: 'user-profile.json' }).as('adminProfile');
        cy.intercept('GET', '**/api/admin/users', { fixture: 'admin-users-list.json' }).as('usersList');
        cy.intercept('GET', '**/api/admin/conges', { fixture: 'admin-leaves-list.json' }).as('adminLeavesList');
        cy.intercept('POST', '**/api/admin/users', { fixture: 'user-created.json' }).as('createUser');
        cy.intercept('PUT', '**/api/admin/conges/**', { fixture: 'leave-created.json' }).as('validateLeave');
        cy.intercept('GET', '**/api/admin/rules', { body: { rules: [] } }).as('rulesList');
        cy.intercept('POST', '**/api/admin/rules', { body: { success: true } }).as('createRule');
        
        // Préparer la base de données avec données admin
        cy.task('seedTestData', { fixtures: ['users', 'adminData'] });
    });

    it('permet un workflow admin complet : connexion → gestion utilisateurs → validation congés → configuration règles', () => {
        // ÉTAPE 1: Connexion admin
        cy.log('🔐 ÉTAPE 1: Connexion administrateur');
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', adminUser.email);
        cy.safeType('[data-cy=password-input]', adminUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('adminLogin');
        cy.url({ timeout: 15000 }).should('include', '/tableau-de-bord');
        
        // Vérifier l'accès admin
        cy.waitForElement('[data-cy=admin-panel]');
        cy.get('[data-cy=admin-panel]').should('be.visible');
        cy.get('[data-cy=admin-nav]').should('exist');

        // ÉTAPE 2: Gestion des utilisateurs
        cy.log('👥 ÉTAPE 2: Gestion des utilisateurs');
        cy.get('[data-cy=admin-nav-users]').click();
        cy.waitForApiResponse('usersList');
        
        cy.url().should('include', '/admin/utilisateurs');
        cy.waitForElement('[data-cy=users-table]');
        
        // Vérifier la liste des utilisateurs
        cy.get('[data-cy=users-table]').should('be.visible');
        cy.get('[data-cy=user-row]').should('have.length.at.least', 1);
        
        // Créer un nouvel utilisateur
        cy.safeClick('[data-cy=create-user-button]');
        cy.waitForElement('[data-cy=user-form-modal]');
        
        cy.get('[data-cy=user-form-modal]').within(() => {
            cy.safeType('[data-cy=user-nom]', 'Nouveau');
            cy.safeType('[data-cy=user-prenom]', 'Utilisateur');
            cy.safeType('[data-cy=user-email]', 'nouveau@example.com');
            
            // Sélectionner le rôle
            cy.safeClick('[data-cy=user-role-select]');
            cy.get('[data-cy=role-option-mar]').click();
            
            // Sélectionner le site
            cy.safeClick('[data-cy=user-site-select]');
            cy.get('[data-cy=site-option-principal]').click();
            
            cy.safeClick('[data-cy=submit-user-button]');
        });
        
        cy.waitForApiResponse('createUser');
        
        // Vérifier la notification de succès
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Utilisateur créé');

        // ÉTAPE 3: Validation des congés
        cy.log('🏖️ ÉTAPE 3: Validation des demandes de congés');
        cy.get('[data-cy=admin-nav-conges]').click();
        cy.waitForApiResponse('adminLeavesList');
        
        cy.url().should('include', '/admin/conges');
        cy.waitForElement('[data-cy=admin-leaves-table]');
        
        // Vérifier les demandes en attente
        cy.get('[data-cy=admin-leaves-table]').should('be.visible');
        cy.get('[data-cy=pending-leave]').should('have.length.at.least', 1);
        
        // Valider une demande
        cy.get('[data-cy=pending-leave]').first().within(() => {
            cy.get('[data-cy=leave-details]').should('be.visible');
            cy.safeClick('[data-cy=approve-leave-button]');
        });
        
        cy.waitForApiResponse('validateLeave');
        
        // Vérifier la validation
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Congé validé');

        // ÉTAPE 4: Configuration des règles
        cy.log('⚙️ ÉTAPE 4: Configuration des règles métier');
        cy.get('[data-cy=admin-nav-rules]').click();
        cy.waitForApiResponse('rulesList');
        
        cy.url().should('include', '/admin/regles');
        cy.waitForElement('[data-cy=rules-panel]');
        
        // Créer une nouvelle règle
        cy.safeClick('[data-cy=create-rule-button]');
        cy.waitForElement('[data-cy=rule-form-modal]');
        
        cy.get('[data-cy=rule-form-modal]').within(() => {
            cy.safeType('[data-cy=rule-name]', 'Règle de garde maximale');
            cy.safeType('[data-cy=rule-description]', 'Maximum 4 gardes par mois');
            
            // Configurer les paramètres de la règle
            cy.safeClick('[data-cy=rule-type-select]');
            cy.get('[data-cy=rule-type-garde-limit]').click();
            
            cy.safeType('[data-cy=rule-value]', '4');
            cy.safeClick('[data-cy=rule-period-monthly]');
            
            cy.safeClick('[data-cy=submit-rule-button]');
        });
        
        cy.waitForApiResponse('createRule');
        
        // Vérifier la création de la règle
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Règle créée');

        // ÉTAPE 5: Consultation des rapports
        cy.log('📊 ÉTAPE 5: Consultation des rapports');
        cy.get('[data-cy=admin-nav-reports]').click();
        
        cy.url().should('include', '/admin/rapports');
        cy.waitForElement('[data-cy=reports-dashboard]');
        
        // Vérifier les widgets de rapport
        cy.get('[data-cy=reports-dashboard]').within(() => {
            cy.get('[data-cy=report-users-stats]').should('be.visible');
            cy.get('[data-cy=report-leaves-stats]').should('be.visible');
            cy.get('[data-cy=report-planning-stats]').should('be.visible');
        });
        
        // Générer un rapport détaillé
        cy.safeClick('[data-cy=generate-detailed-report]');
        cy.waitForElement('[data-cy=report-modal]');
        
        cy.get('[data-cy=report-modal]').within(() => {
            cy.safeClick('[data-cy=report-type-monthly]');
            cy.safeClick('[data-cy=generate-report-button]');
        });
        
        // Vérifier la génération du rapport
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Rapport généré');

        // ÉTAPE 6: Déconnexion admin
        cy.log('🚪 ÉTAPE 6: Déconnexion administrateur');
        cy.get('[data-cy=admin-user-menu]').click();
        cy.waitForElement('[data-cy=admin-logout-option]');
        cy.safeClick('[data-cy=admin-logout-option]');
        
        // Vérifier la redirection
        cy.url({ timeout: 10000 }).should('include', '/auth/connexion');
    });

    it('gère les urgences et modifications de planning', () => {
        // WORKFLOW URGENCE: Modification planning → Notifications → Confirmation
        cy.log('🚨 Workflow de gestion d\'urgence');
        
        // Connexion admin
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', adminUser.email);
        cy.safeType('[data-cy=password-input]', adminUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('adminLogin');
        cy.url({ timeout: 15000 }).should('include', '/tableau-de-bord');
        
        // Accéder au planning d'urgence
        cy.get('[data-cy=admin-nav-planning]').click();
        cy.url().should('include', '/admin/planning');
        
        // Identifier une situation d'urgence
        cy.get('[data-cy=emergency-alert]').should('be.visible');
        cy.safeClick('[data-cy=handle-emergency-button]');
        
        cy.waitForElement('[data-cy=emergency-modal]');
        
        // Gérer l'urgence
        cy.get('[data-cy=emergency-modal]').within(() => {
            cy.get('[data-cy=emergency-description]').should('contain', 'Absence imprevue');
            
            // Proposer une solution
            cy.safeClick('[data-cy=find-replacement-button]');
            cy.waitForElement('[data-cy=replacement-suggestions]');
            
            // Sélectionner un remplaçant
            cy.get('[data-cy=replacement-suggestions]').within(() => {
                cy.get('[data-cy=replacement-option]').first().click();
            });
            
            cy.safeClick('[data-cy=apply-replacement-button]');
        });
        
        // Vérifier la notification d'urgence résolue
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Urgence résolue');
        
        // Vérifier que les notifications ont été envoyées
        cy.get('[data-cy=notification-log]').should('contain', 'Équipe notifiée');
    });

    it('teste les performances admin sous charge', () => {
        // Test de performance des opérations admin
        cy.log('⚡ Test de performance administrateur');
        
        const startTime = performance.now();
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', adminUser.email);
        cy.safeType('[data-cy=password-input]', adminUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('adminLogin').then(() => {
            const loginTime = performance.now() - startTime;
            cy.task('logPerformance', {
                type: 'admin-workflow',
                name: 'admin-login',
                duration: loginTime,
                timestamp: Date.now(),
                status: loginTime < 2000 ? 'PASS' : 'SLOW'
            });
            
            expect(loginTime).to.be.lessThan(2000);
        });
        
        // Test de chargement rapide des données admin
        const dataLoadStart = performance.now();
        cy.get('[data-cy=admin-nav-users]').click();
        cy.waitForApiResponse('usersList').then(() => {
            const dataLoadTime = performance.now() - dataLoadStart;
            cy.task('logPerformance', {
                type: 'admin-workflow',
                name: 'admin-data-load',
                duration: dataLoadTime,
                timestamp: Date.now(),
                status: dataLoadTime < 1500 ? 'PASS' : 'SLOW'
            });
            
            expect(dataLoadTime).to.be.lessThan(1500);
        });
    });

    afterEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
    });
});