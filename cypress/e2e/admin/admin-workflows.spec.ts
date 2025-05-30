describe('Workflows administrateur', () => {
    const adminUser = {
        email: 'admin@example.com',
        password: 'Test123!',
        nom: 'Admin',
        prenom: 'Test'
    };

    beforeEach(() => {
        cy.cleanState();
        
        // Configuration des interceptions pour admin
        cy.intercept('POST', '**/api/auth/login', { fixture: 'admin-auth-response.json' }).as('adminLogin');
        cy.intercept('GET', '**/api/admin/users', { fixture: 'admin-users-list.json' }).as('usersList');
        cy.intercept('POST', '**/api/admin/users', { fixture: 'user-created.json' }).as('createUser');
        cy.intercept('PUT', '**/api/admin/users/**', { fixture: 'user-updated.json' }).as('updateUser');
        cy.intercept('DELETE', '**/api/admin/users/**', { statusCode: 204 }).as('deleteUser');
        cy.intercept('GET', '**/api/admin/leaves', { fixture: 'admin-leaves-list.json' }).as('adminLeavesList');
        cy.intercept('PUT', '**/api/admin/leaves/**/approve', { fixture: 'leave-approved.json' }).as('approveLeave');
        cy.intercept('PUT', '**/api/admin/leaves/**/reject', { fixture: 'leave-rejected.json' }).as('rejectLeave');
        cy.intercept('GET', '**/api/admin/sites', { fixture: 'sites-list.json' }).as('sitesList');
        cy.intercept('POST', '**/api/admin/sites', { fixture: 'site-created.json' }).as('createSite');
        
        // Préparer la base de données avec admin
        cy.task('seedTestData', { fixtures: ['users'] });
    });

    it('permet la gestion complète des utilisateurs', () => {
        // ÉTAPE 1: Connexion admin
        cy.log('🔐 ÉTAPE 1: Connexion administrateur');
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', adminUser.email);
        cy.safeType('[data-cy=password-input]', adminUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('adminLogin');
        cy.url({ timeout: 15000 }).should('include', '/tableau-de-bord');

        // ÉTAPE 2: Navigation vers gestion utilisateurs
        cy.log('👥 ÉTAPE 2: Navigation vers gestion utilisateurs');
        cy.get('[data-cy=nav-admin]').click();
        cy.get('[data-cy=admin-menu]').within(() => {
            cy.get('[data-cy=admin-users-link]').click();
        });
        
        cy.waitForApiResponse('usersList');
        cy.url().should('include', '/admin/utilisateurs');
        cy.waitForElement('[data-cy=users-table]');

        // ÉTAPE 3: Création d'un nouvel utilisateur
        cy.log('➕ ÉTAPE 3: Création d\'un nouvel utilisateur');
        cy.safeClick('[data-cy=create-user-button]');
        cy.waitForElement('[data-cy=user-modal]');
        
        cy.get('[data-cy=user-modal]').within(() => {
            cy.safeType('[data-cy=user-email]', 'nouveau.medecin@example.com');
            cy.safeType('[data-cy=user-nom]', 'Nouveau');
            cy.safeType('[data-cy=user-prenom]', 'Médecin');
            cy.safeType('[data-cy=user-password]', 'TempPass123!');
            
            cy.safeClick('[data-cy=user-role-select]');
            cy.get('[data-cy=role-option-user]').click();
            
            cy.safeClick('[data-cy=professional-role-select]');
            cy.get('[data-cy=professional-role-iade]').click();
            
            cy.safeClick('[data-cy=save-user-button]');
        });
        
        cy.waitForApiResponse('createUser');
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Utilisateur créé');

        // ÉTAPE 4: Modification d'un utilisateur existant
        cy.log('✏️ ÉTAPE 4: Modification d\'utilisateur');
        cy.get('[data-cy=users-table]').within(() => {
            cy.get('[data-cy=user-row]').first().within(() => {
                cy.get('[data-cy=edit-user-button]').click();
            });
        });
        
        cy.waitForElement('[data-cy=user-modal]');
        cy.get('[data-cy=user-modal]').within(() => {
            cy.get('[data-cy=user-nom]').clear().type('Nom Modifié');
            cy.safeClick('[data-cy=save-user-button]');
        });
        
        cy.waitForApiResponse('updateUser');
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Utilisateur modifié');

        // ÉTAPE 5: Désactivation d'un utilisateur
        cy.log('🚫 ÉTAPE 5: Désactivation d\'utilisateur');
        cy.get('[data-cy=users-table]').within(() => {
            cy.get('[data-cy=user-row]').last().within(() => {
                cy.get('[data-cy=toggle-user-status]').click();
            });
        });
        
        cy.waitForElement('[data-cy=confirm-modal]');
        cy.get('[data-cy=confirm-modal]').within(() => {
            cy.safeClick('[data-cy=confirm-action]');
        });
        
        cy.waitForApiResponse('updateUser');
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Statut utilisateur modifié');
    });

    it('permet la gestion des demandes de congés', () => {
        // Connexion admin
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', adminUser.email);
        cy.safeType('[data-cy=password-input]', adminUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('adminLogin');
        cy.url().should('include', '/tableau-de-bord');

        // Navigation vers gestion des congés
        cy.log('📋 Navigation vers gestion des congés');
        cy.get('[data-cy=nav-admin]').click();
        cy.get('[data-cy=admin-menu]').within(() => {
            cy.get('[data-cy=admin-leaves-link]').click();
        });
        
        cy.waitForApiResponse('adminLeavesList');
        cy.url().should('include', '/admin/conges');
        cy.waitForElement('[data-cy=leaves-management-table]');

        // Approbation d'une demande
        cy.log('✅ Approbation d\'une demande de congé');
        cy.get('[data-cy=leaves-management-table]').within(() => {
            cy.get('[data-cy=leave-row-pending]').first().within(() => {
                cy.get('[data-cy=approve-leave-button]').click();
            });
        });
        
        cy.waitForElement('[data-cy=approval-modal]');
        cy.get('[data-cy=approval-modal]').within(() => {
            cy.safeType('[data-cy=approval-comment]', 'Demande approuvée - planning compatible');
            cy.safeClick('[data-cy=confirm-approval]');
        });
        
        cy.waitForApiResponse('approveLeave');
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Congé approuvé');

        // Rejet d'une demande
        cy.log('❌ Rejet d\'une demande de congé');
        cy.get('[data-cy=leaves-management-table]').within(() => {
            cy.get('[data-cy=leave-row-pending]').first().within(() => {
                cy.get('[data-cy=reject-leave-button]').click();
            });
        });
        
        cy.waitForElement('[data-cy=rejection-modal]');
        cy.get('[data-cy=rejection-modal]').within(() => {
            cy.safeType('[data-cy=rejection-reason]', 'Conflit avec planning existant');
            cy.safeClick('[data-cy=confirm-rejection]');
        });
        
        cy.waitForApiResponse('rejectLeave');
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Congé rejeté');
    });

    it('permet la gestion des sites et salles', () => {
        // Connexion admin
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', adminUser.email);
        cy.safeType('[data-cy=password-input]', adminUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('adminLogin');

        // Navigation vers gestion des sites
        cy.log('🏥 Navigation vers gestion des sites');
        cy.get('[data-cy=nav-admin]').click();
        cy.get('[data-cy=admin-menu]').within(() => {
            cy.get('[data-cy=admin-sites-link]').click();
        });
        
        cy.waitForApiResponse('sitesList');
        cy.url().should('include', '/admin/sites');
        cy.waitForElement('[data-cy=sites-table]');

        // Création d'un nouveau site
        cy.log('🏗️ Création d\'un nouveau site');
        cy.safeClick('[data-cy=create-site-button]');
        cy.waitForElement('[data-cy=site-modal]');
        
        cy.get('[data-cy=site-modal]').within(() => {
            cy.safeType('[data-cy=site-name]', 'Nouveau Site Médical');
            cy.safeType('[data-cy=site-address]', '123 Rue de la Santé, 75000 Paris');
            cy.safeType('[data-cy=site-phone]', '01 23 45 67 89');
            cy.safeType('[data-cy=site-capacity]', '50');
            
            cy.safeClick('[data-cy=save-site-button]');
        });
        
        cy.waitForApiResponse('createSite');
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Site créé');

        // Gestion des salles d'opération
        cy.log('🏥 Gestion des salles d\'opération');
        cy.get('[data-cy=sites-table]').within(() => {
            cy.get('[data-cy=site-row]').first().within(() => {
                cy.get('[data-cy=manage-rooms-button]').click();
            });
        });
        
        cy.waitForElement('[data-cy=rooms-modal]');
        cy.get('[data-cy=rooms-modal]').within(() => {
            cy.safeClick('[data-cy=add-room-button]');
            
            cy.get('[data-cy=room-form]').within(() => {
                cy.safeType('[data-cy=room-name]', 'Salle Opération 1');
                cy.safeClick('[data-cy=room-type-select]');
                cy.get('[data-cy=room-type-chirurgie]').click();
                cy.safeType('[data-cy=room-capacity]', '8');
                
                cy.safeClick('[data-cy=save-room-button]');
            });
        });
        
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Salle ajoutée');
    });

    it('permet la configuration système', () => {
        // Connexion admin
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', adminUser.email);
        cy.safeType('[data-cy=password-input]', adminUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('adminLogin');

        // Navigation vers configuration
        cy.log('⚙️ Navigation vers configuration système');
        cy.get('[data-cy=nav-admin]').click();
        cy.get('[data-cy=admin-menu]').within(() => {
            cy.get('[data-cy=admin-config-link]').click();
        });
        
        cy.url().should('include', '/admin/configuration');
        cy.waitForElement('[data-cy=config-form]');

        // Configuration des règles de planning
        cy.log('📋 Configuration des règles de planning');
        cy.get('[data-cy=config-form]').within(() => {
            cy.get('[data-cy=max-consecutive-days]').clear().type('5');
            cy.get('[data-cy=min-rest-hours]').clear().type('11');
            cy.get('[data-cy=max-weekly-hours]').clear().type('48');
            
            cy.get('[data-cy=enable-auto-assignment]').check();
            cy.get('[data-cy=enable-conflict-detection]').check();
            
            cy.safeClick('[data-cy=save-config-button]');
        });
        
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Configuration sauvegardée');

        // Test de sauvegarde/restauration
        cy.log('💾 Test de sauvegarde/restauration');
        cy.get('[data-cy=backup-section]').within(() => {
            cy.safeClick('[data-cy=create-backup-button]');
        });
        
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Sauvegarde créée');
        
        // Vérifier que la liste des sauvegardes se met à jour
        cy.get('[data-cy=backups-list]').should('contain', new Date().toLocaleDateString());
    });

    it('génère des rapports d\'administration', () => {
        // Connexion admin
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', adminUser.email);
        cy.safeType('[data-cy=password-input]', adminUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        cy.waitForApiResponse('adminLogin');

        // Navigation vers rapports
        cy.log('📊 Navigation vers rapports');
        cy.get('[data-cy=nav-admin]').click();
        cy.get('[data-cy=admin-menu]').within(() => {
            cy.get('[data-cy=admin-reports-link]').click();
        });
        
        cy.url().should('include', '/admin/rapports');
        cy.waitForElement('[data-cy=reports-dashboard]');

        // Génération rapport d'activité
        cy.log('📈 Génération rapport d\'activité');
        cy.get('[data-cy=activity-report-section]').within(() => {
            cy.safeType('[data-cy=report-start-date]', '2025-05-01');
            cy.safeType('[data-cy=report-end-date]', '2025-05-31');
            cy.safeClick('[data-cy=generate-activity-report]');
        });
        
        cy.waitForElement('[data-cy=report-generated]');
        cy.get('[data-cy=report-generated]').should('be.visible');
        
        // Vérification du contenu du rapport
        cy.get('[data-cy=report-stats]').within(() => {
            cy.get('[data-cy=total-users]').should('exist');
            cy.get('[data-cy=total-leaves]').should('exist');
            cy.get('[data-cy=total-assignments]').should('exist');
        });

        // Export du rapport
        cy.log('📥 Export du rapport');
        cy.get('[data-cy=export-report-section]').within(() => {
            cy.safeClick('[data-cy=export-format-csv]');
            cy.safeClick('[data-cy=export-report-button]');
        });
        
        // Vérifier que le téléchargement démarre
        cy.waitForElement('[data-cy=notification-success]');
        cy.get('[data-cy=notification-success]').should('contain', 'Rapport exporté');
    });

    afterEach(() => {
        // Cleanup après chaque test admin
        cy.clearCookies();
        cy.clearLocalStorage();
    });
});