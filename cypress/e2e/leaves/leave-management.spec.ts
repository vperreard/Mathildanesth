describe('Gestion des congés', () => {
    const testUser = {
        email: 'medecin@example.com',
        password: 'Test123!',
        name: 'Dr Martin',
        id: 'user-2'
    };

    const adminUser = {
        email: 'admin@example.com',
        password: 'Test123!',
        name: 'Admin Test',
        id: 'user-1'
    };

    beforeEach(() => {
    jest.clearAllMocks();
        // Réinitialiser la base de données de test
        cy.task('resetTestDatabase');

        // Charger les données de test
        cy.task('seedTestData', {
            fixtures: ['users', 'leaves']
        });
    });

    it('permet de créer une nouvelle demande de congés', () => {
        // Se connecter en tant que médecin
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de demande de congés
        cy.visitAsAuthenticatedUser('/conges/nouveau');

        // Remplir le formulaire de demande
        cy.get('[data-cy=leave-type-select]').click();
        cy.get('[data-cy=leave-type-option-conges]').click();

        // Sélectionner les dates
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        cy.selectDate('[data-cy=start-date-input]', tomorrow);
        cy.selectDate('[data-cy=end-date-input]', nextWeek);

        // Ajouter un commentaire
        cy.get('[data-cy=leave-notes]').type('Congés pour raisons personnelles');

        // Intercepter la requête de création
        cy.intercept('POST', '**/api/conges').as('createLeave');

        // Soumettre la demande
        cy.get('[data-cy=submit-leave-request]').click();

        // Attendre la réponse de l'API
        cy.wait('@createLeave').its('response.statusCode').should('eq', 201);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Demande de congés soumise avec succès');

        // Vérifier que la demande apparaît dans la liste des congés
        cy.visitAsAuthenticatedUser('/conges');
        cy.get('[data-cy=leave-list]').should('contain', 'Congés pour raisons personnelles');
    });

    it('permet à un administrateur de valider une demande de congés', () => {
        // Se connecter en tant qu'administrateur
        cy.loginByApi(adminUser.email, adminUser.password);

        // Accéder à la page de gestion des congés
        cy.visitAsAuthenticatedUser('/admin/conges');

        // Chercher une demande en attente
        cy.get('[data-cy=pending-leaves-tab]').click();

        // Sélectionner la première demande en attente
        cy.get('[data-cy=leave-item]:contains("Vacances d\'été")').first().as('targetLeave');

        // Ouvrir le menu d'actions
        cy.get('@targetLeave').find('[data-cy=leave-actions]').click();
        cy.get('[data-cy=approve-leave-action]').click();

        // Intercepter la requête d'approbation
        cy.intercept('PUT', '**/api/conges/**/approve').as('approveLeave');

        // Confirmer l'approbation
        cy.get('[data-cy=confirm-approve-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@approveLeave').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Demande de congés approuvée');

        // Vérifier que la demande apparaît dans l'onglet des congés approuvés
        cy.get('[data-cy=approved-leaves-tab]').click();
        cy.get('[data-cy=leave-list]').should('contain', 'Vacances d\'été');
    });

    it('permet à un administrateur de rejeter une demande de congés', () => {
        // Se connecter en tant qu'administrateur
        cy.loginByApi(adminUser.email, adminUser.password);

        // Accéder à la page de gestion des congés
        cy.visitAsAuthenticatedUser('/admin/conges');

        // Chercher une demande en attente
        cy.get('[data-cy=pending-leaves-tab]').click();

        // Sélectionner la première demande en attente
        cy.get('[data-cy=leave-item]:contains("Vacances de Noël")').first().as('targetLeave');

        // Ouvrir le menu d'actions
        cy.get('@targetLeave').find('[data-cy=leave-actions]').click();
        cy.get('[data-cy=reject-leave-action]').click();

        // Remplir le motif de rejet
        cy.get('[data-cy=rejection-reason]').type('Personnel insuffisant pour cette période');

        // Intercepter la requête de rejet
        cy.intercept('PUT', '**/api/conges/**/reject').as('rejectLeave');

        // Confirmer le rejet
        cy.get('[data-cy=confirm-reject-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@rejectLeave').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Demande de congés rejetée');

        // Vérifier que la demande apparaît dans l'onglet des congés rejetés
        cy.get('[data-cy=rejected-leaves-tab]').click();
        cy.get('[data-cy=leave-list]').should('contain', 'Vacances de Noël');
    });

    it('permet à un utilisateur de modifier une demande en attente', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de gestion des congés
        cy.visitAsAuthenticatedUser('/conges');

        // Trouver une demande en attente et cliquer dessus
        cy.get('[data-cy=leave-item]:contains("Vacances de Noël")').click();

        // Cliquer sur le bouton Modifier
        cy.get('[data-cy=edit-leave-button]').click();

        // Modifier la date de fin
        const newEndDate = new Date('2024-12-28T23:59:59.999Z');
        cy.selectDate('[data-cy=end-date-input]', newEndDate);

        // Modifier les notes
        cy.get('[data-cy=leave-notes]').clear().type('Vacances de Noël prolongées');

        // Intercepter la requête de mise à jour
        cy.intercept('PUT', '**/api/conges/**').as('updateLeave');

        // Soumettre les modifications
        cy.get('[data-cy=submit-leave-request]').click();

        // Attendre la réponse de l'API
        cy.wait('@updateLeave').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Demande de congés mise à jour');

        // Vérifier que les modifications sont visibles
        cy.visitAsAuthenticatedUser('/conges');
        cy.get('[data-cy=leave-item]:contains("Vacances de Noël prolongées")').should('be.visible');
    });

    it('permet à un utilisateur d\'annuler une demande en attente', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de gestion des congés
        cy.visitAsAuthenticatedUser('/conges');

        // Trouver une demande en attente et cliquer dessus
        cy.get('[data-cy=leave-item]:contains("Vacances de Noël")').click();

        // Cliquer sur le bouton Annuler
        cy.get('[data-cy=cancel-leave-button]').click();

        // Intercepter la requête d'annulation
        cy.intercept('DELETE', '**/api/conges/**').as('cancelLeave');

        // Confirmer l'annulation
        cy.get('[data-cy=confirm-cancel-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@cancelLeave').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Demande de congés annulée');

        // Vérifier que la demande n'apparaît plus
        cy.get('[data-cy=leave-item]:contains("Vacances de Noël")').should('not.exist');
    });
}); 