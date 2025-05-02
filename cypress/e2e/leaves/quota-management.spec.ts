describe('Gestion des quotas de congés', () => {
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

    const targetUser = {
        email: 'iade@example.com',
        name: 'Infirmier Anesthésiste',
        id: 'user-3'
    };

    beforeEach(() => {
        // Réinitialiser la base de données de test
        cy.task('resetTestDatabase');

        // Charger les données de test
        cy.task('seedTestData', {
            fixtures: ['users', 'leaves', 'quotas']
        });
    });

    it('affiche correctement les quotas de congés d\'un utilisateur', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de quotas
        cy.visitAsAuthenticatedUser('/leaves/quotas');

        // Vérifier que les informations de quotas sont affichées
        cy.get('[data-cy=quota-summary]').should('be.visible');

        // Vérifier les différents types de quotas
        cy.get('[data-cy=quota-conges-payes]').should('contain', '25');
        cy.get('[data-cy=quota-rtt]').should('contain', '15');
        cy.get('[data-cy=quota-formation]').should('contain', '5');

        // Vérifier les jours utilisés
        cy.get('[data-cy=used-days]').should('be.visible');

        // Vérifier les jours restants
        cy.get('[data-cy=remaining-days]').should('be.visible');
    });

    it('permet à un administrateur d\'ajuster les quotas d\'un utilisateur', () => {
        // Se connecter en tant qu'administrateur
        cy.loginByApi(adminUser.email, adminUser.password);

        // Accéder à la page d'administration des quotas
        cy.visitAsAuthenticatedUser('/admin/leaves/quotas');

        // Rechercher un utilisateur
        cy.get('[data-cy=user-search]').type(targetUser.name);
        cy.get(`[data-cy=user-item-${targetUser.id}]`).click();

        // Ajuster le quota de congés payés
        cy.get('[data-cy=edit-quota-conges-payes]').click();
        cy.get('[data-cy=quota-input]').clear().type('30');

        // Saisir une justification
        cy.get('[data-cy=adjustment-reason]').type('Ajustement pour ancienneté');

        // Intercepter la requête d'ajustement
        cy.intercept('PUT', '**/api/leaves/quotas/**').as('updateQuota');

        // Enregistrer les modifications
        cy.get('[data-cy=save-quota-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@updateQuota').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Quota mis à jour');

        // Vérifier que le quota a bien été mis à jour
        cy.get('[data-cy=quota-conges-payes]').should('contain', '30');
    });

    it('permet de transférer des jours de congés entre deux types de quotas', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de transfert de quotas
        cy.visitAsAuthenticatedUser('/leaves/quotas/transfer');

        // Sélectionner le type de quota source
        cy.get('[data-cy=source-quota-select]').click();
        cy.get('[data-cy=quota-option-rtt]').click();

        // Sélectionner le type de quota destination
        cy.get('[data-cy=target-quota-select]').click();
        cy.get('[data-cy=quota-option-conges-payes]').click();

        // Définir le nombre de jours à transférer
        cy.get('[data-cy=transfer-days-input]').clear().type('3');

        // Intercepter la requête de transfert
        cy.intercept('POST', '**/api/leaves/quotas/transfer').as('transferQuota');

        // Confirmer le transfert
        cy.get('[data-cy=confirm-transfer-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@transferQuota').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Transfert effectué');

        // Vérifier que les quotas ont été mis à jour
        cy.visitAsAuthenticatedUser('/leaves/quotas');
        cy.get('[data-cy=quota-conges-payes]').should('contain', '28'); // 25 + 3
        cy.get('[data-cy=quota-rtt]').should('contain', '12'); // 15 - 3
    });

    it('permet de reporter des jours de congés sur l\'année suivante', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de report de quotas
        cy.visitAsAuthenticatedUser('/leaves/quotas/carry-over');

        // Sélectionner le type de quota à reporter
        cy.get('[data-cy=quota-type-select]').click();
        cy.get('[data-cy=quota-option-conges-payes]').click();

        // Définir le nombre de jours à reporter
        cy.get('[data-cy=carryover-days-input]').clear().type('5');

        // Saisir une justification
        cy.get('[data-cy=carryover-reason]').type('Report pour projet en cours');

        // Intercepter la requête de report
        cy.intercept('POST', '**/api/leaves/quotas/carry-over').as('carryOverQuota');

        // Confirmer le report
        cy.get('[data-cy=confirm-carryover-button]').click();

        // Attendre la réponse de l'API
        cy.wait('@carryOverQuota').its('response.statusCode').should('eq', 200);

        // Vérifier le message de succès
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Report effectué');

        // Vérifier que le report apparaît dans l'historique
        cy.get('[data-cy=carryover-history]').should('contain', 'Report pour projet en cours');
    });

    it('affiche l\'historique des ajustements de quotas', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page d'historique des quotas
        cy.visitAsAuthenticatedUser('/leaves/quotas/history');

        // Vérifier que l'historique est affiché
        cy.get('[data-cy=quota-history]').should('be.visible');

        // Vérifier qu'on peut filtrer par type d'opération
        cy.get('[data-cy=filter-by-operation]').click();
        cy.get('[data-cy=operation-option-adjustment]').click();

        // Vérifier qu'on peut filtrer par date
        cy.get('[data-cy=filter-by-date]').click();
        cy.get('[data-cy=date-option-this-year]').click();

        // Vérifier que les résultats filtrés s'affichent
        cy.get('[data-cy=history-item]').should('have.length.at.least', 1);
    });

    it('empêche de demander plus de jours que le quota disponible', () => {
        // Se connecter
        cy.loginByApi(testUser.email, testUser.password);

        // Accéder à la page de demande de congés
        cy.visitAsAuthenticatedUser('/leaves/new');

        // Remplir le formulaire avec trop de jours
        cy.get('[data-cy=leave-type-select]').click();
        cy.get('[data-cy=leave-type-option-conges]').click();

        // Sélectionner une période très longue (plus que le quota disponible)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 60); // 60 jours de congés (bien plus que le quota)

        cy.selectDate('[data-cy=start-date-input]', startDate);
        cy.selectDate('[data-cy=end-date-input]', endDate);

        // Ajouter un commentaire
        cy.get('[data-cy=leave-notes]').type('Longue absence');

        // Soumettre la demande
        cy.get('[data-cy=submit-leave-request]').click();

        // Vérifier le message d'erreur
        cy.get('[data-cy=notification-error]')
            .should('be.visible')
            .and('contain', 'Quota insuffisant');

        // Vérifier que le formulaire affiche une validation d'erreur
        cy.get('[data-cy=quota-error-message]')
            .should('be.visible')
            .and('contain', 'dépasse votre quota disponible');
    });
}); 