// Tests E2E pour l'intégration entre les échanges d'affectations et les notifications
describe('Notifications d\'échanges d\'affectations', () => {
    // Charger les fixtures avant chaque test
    beforeEach(() => {
        cy.fixture('assignment-swap-notifications.json').as('testData');
    });

    // Configurer l'environnement de test une seule fois avant tous les tests
    before(() => {
        cy.setupAssignmentSwapTests();
    });

    beforeEach(function () {
        // Intercepter les requêtes API
        cy.intercept('GET', '**/api/assignments/swap*').as('getSwapRequests');
        cy.intercept('POST', '**/api/assignments/swap').as('createSwapRequest');
        cy.intercept('PUT', '**/api/assignments/swap/*').as('updateSwapRequest');
        cy.intercept('GET', '**/api/notifications*').as('getNotifications');
        cy.intercept('POST', '**/api/notifications/read').as('markNotificationsAsRead');
    });

    it('envoie une notification lors de la création d\'une demande d\'échange', function () {
        // Se connecter en tant qu'initiateur
        cy.loginByApi(this.testData.users.initiator.email, this.testData.users.initiator.password);

        cy.visitAsAuthenticatedUser('/planning');

        // Trouver une affectation et cliquer pour ouvrir le menu contextuel
        cy.get('[data-cy=assignment-item]').first().rightclick();

        // Sélectionner l'option "Proposer un échange"
        cy.get('[data-cy=context-menu-option]').contains('Proposer un échange').click();

        // Dans la modal d'échange, sélectionner un utilisateur cible
        cy.get('[data-cy=target-user-select]').click();
        cy.get('[data-cy=user-option]').contains(`${this.testData.users.target.firstName} ${this.testData.users.target.lastName}`).click();

        // Optionnel: sélectionner une affectation cible (échange direct)
        cy.get('[data-cy=target-assignment-select]').click();
        cy.get('[data-cy=assignment-option]').first().click();

        // Ajouter un message
        cy.get('[data-cy=swap-message]').type(this.testData.swapRequests.pending.message);

        // Soumettre la demande d'échange
        cy.get('[data-cy=submit-swap-request]').click();

        // Vérifier que la demande a été créée
        cy.wait('@createSwapRequest').its('response.statusCode').should('eq', 201);

        // Afficher un message de succès
        cy.get('.Toastify__toast--success').should('be.visible');

        // Se déconnecter puis se connecter en tant qu'utilisateur cible
        cy.logout();
        cy.loginByApi(this.testData.users.target.email, this.testData.users.target.password);

        // Visiter la page d'accueil
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');

        // Vérifier qu'une notification d'échange est présente
        cy.get('[data-cy=notification-bell]').click();
        cy.get('[data-cy=notification-panel]').should('be.visible');
        cy.get(`[data-cy=notification-item][data-type="${this.testData.notifications.swapRequested.type}"]`).should('exist');
    });

    it('envoie une notification lors de l\'acceptation d\'une demande d\'échange', function () {
        // Se connecter en tant qu'utilisateur cible qui a reçu une demande
        cy.loginByApi(this.testData.users.target.email, this.testData.users.target.password);

        // Visiter la page des demandes d'échange
        cy.visitAsAuthenticatedUser('/planning/echanges');
        cy.wait('@getSwapRequests');

        // Trouver une demande en attente et cliquer dessus
        cy.get('[data-cy=swap-request-item][data-status="PENDING"]').first().click();

        // Accepter la demande
        cy.get('[data-cy=accept-swap-request]').click();
        cy.get('[data-cy=confirm-action]').click();

        // Vérifier que la demande a été acceptée
        cy.wait('@updateSwapRequest').its('response.statusCode').should('eq', 200);
        cy.wait('@updateSwapRequest').its('response.body.status').should('eq', 'ACCEPTED');

        // Se déconnecter puis se connecter en tant qu'initiateur
        cy.logout();
        cy.loginByApi(this.testData.users.initiator.email, this.testData.users.initiator.password);

        // Visiter la page d'accueil
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');

        // Vérifier qu'une notification d'acceptation est présente
        cy.get('[data-cy=notification-bell]').click();
        cy.get('[data-cy=notification-panel]').should('be.visible');
        cy.get(`[data-cy=notification-item][data-type="${this.testData.notifications.swapAccepted.type}"]`).should('exist');
    });

    it('envoie une notification lors du refus d\'une demande d\'échange', function () {
        // Créer d'abord une nouvelle demande d'échange
        cy.loginByApi(this.testData.users.initiator.email, this.testData.users.initiator.password);
        cy.visitAsAuthenticatedUser('/planning');

        // Créer une demande d'échange
        cy.get('[data-cy=assignment-item]').first().rightclick();
        cy.get('[data-cy=context-menu-option]').contains('Proposer un échange').click();
        cy.get('[data-cy=target-user-select]').click();
        cy.get('[data-cy=user-option]').contains(`${this.testData.users.target.firstName} ${this.testData.users.target.lastName}`).click();
        cy.get('[data-cy=swap-message]').type(this.testData.swapRequests.rejected.message);
        cy.get('[data-cy=submit-swap-request]').click();
        cy.wait('@createSwapRequest');

        // Se connecter en tant qu'utilisateur cible
        cy.logout();
        cy.loginByApi(this.testData.users.target.email, this.testData.users.target.password);

        // Visiter la page des demandes d'échange
        cy.visitAsAuthenticatedUser('/planning/echanges');
        cy.wait('@getSwapRequests');

        // Trouver la demande et la refuser
        cy.get('[data-cy=swap-request-item][data-status="PENDING"]').first().click();
        cy.get('[data-cy=reject-swap-request]').click();
        cy.get('[data-cy=rejection-reason]').type(this.testData.swapRequests.rejected.responseMessage);
        cy.get('[data-cy=confirm-rejection]').click();

        // Vérifier que la demande a été refusée
        cy.wait('@updateSwapRequest').its('response.statusCode').should('eq', 200);
        cy.wait('@updateSwapRequest').its('response.body.status').should('eq', 'REJECTED');

        // Se connecter en tant qu'initiateur
        cy.logout();
        cy.loginByApi(this.testData.users.initiator.email, this.testData.users.initiator.password);

        // Vérifier qu'une notification de refus est présente
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');
        cy.get('[data-cy=notification-bell]').click();
        cy.get(`[data-cy=notification-item][data-type="${this.testData.notifications.swapRejected.type}"]`).should('exist');
    });

    it('envoie une notification lors de l\'annulation d\'une demande d\'échange', function () {
        // Créer d'abord une nouvelle demande d'échange
        cy.loginByApi(this.testData.users.initiator.email, this.testData.users.initiator.password);
        cy.visitAsAuthenticatedUser('/planning');

        // Créer une demande d'échange
        cy.get('[data-cy=assignment-item]').first().rightclick();
        cy.get('[data-cy=context-menu-option]').contains('Proposer un échange').click();
        cy.get('[data-cy=target-user-select]').click();
        cy.get('[data-cy=user-option]').contains(`${this.testData.users.target.firstName} ${this.testData.users.target.lastName}`).click();
        cy.get('[data-cy=swap-message]').type(this.testData.swapRequests.cancelled.message);
        cy.get('[data-cy=submit-swap-request]').click();
        cy.wait('@createSwapRequest');

        // Visiter la page des demandes d'échange
        cy.visitAsAuthenticatedUser('/planning/echanges');
        cy.wait('@getSwapRequests');

        // Trouver la demande et l'annuler
        cy.get('[data-cy=swap-request-item][data-status="PENDING"]').first().click();
        cy.get('[data-cy=cancel-swap-request]').click();
        cy.get('[data-cy=confirm-action]').click();

        // Vérifier que la demande a été annulée
        cy.wait('@updateSwapRequest').its('response.statusCode').should('eq', 200);
        cy.wait('@updateSwapRequest').its('response.body.status').should('eq', 'CANCELLED');

        // Se connecter en tant qu'utilisateur cible
        cy.logout();
        cy.loginByApi(this.testData.users.target.email, this.testData.users.target.password);

        // Vérifier qu'une notification d'annulation est présente
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');
        cy.get('[data-cy=notification-bell]').click();
        cy.get(`[data-cy=notification-item][data-type="${this.testData.notifications.swapCancelled.type}"]`).should('exist');
    });

    it('marque une notification comme lue lors de la consultation de la demande d\'échange', function () {
        // Se connecter en tant qu'utilisateur cible
        cy.loginByApi(this.testData.users.target.email, this.testData.users.target.password);

        // Visiter la page d'accueil
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');

        // Vérifier qu'une notification d'échange est présente et noter son ID
        cy.get('[data-cy=notification-bell]').click();
        cy.get(`[data-cy=notification-item][data-type="${this.testData.notifications.swapRequested.type}"]`)
            .first()
            .invoke('attr', 'data-notification-id')
            .then((notificationId) => {
                // Cliquer sur la notification
                cy.get(`[data-notification-id="${notificationId}"]`).click();

                // Vérifier que la page de détails de la demande d'échange s'ouvre
                cy.url().should('include', '/planning/echanges/');

                // Vérifier que la notification a été marquée comme lue
                cy.wait('@markNotificationsAsRead')
                    .its('request.body')
                    .should('deep.include', { id: notificationId });

                // Retourner à la page d'accueil
                cy.visitAsAuthenticatedUser('/');
                cy.wait('@getNotifications');

                // Vérifier que la notification n'est plus dans les non lues
                cy.get('[data-cy=notification-bell]').click();
                cy.get(`[data-notification-id="${notificationId}"]`).should('have.class', 'read');
            });
    });

    it('ne notifie pas l\'utilisateur lorsque les préférences sont désactivées', function () {
        // Désactiver les préférences de notifications pour les échanges
        cy.loginByApi(this.testData.users.target.email, this.testData.users.target.password);
        cy.visitAsAuthenticatedUser('/profil/notifications');

        // Désactiver les notifications pour les demandes d'échange
        cy.contains('Demandes d\'échange').parent().find('div[role="switch"]').click();

        // Créer une nouvelle demande d'échange
        cy.logout();
        cy.loginByApi(this.testData.users.initiator.email, this.testData.users.initiator.password);
        cy.visitAsAuthenticatedUser('/planning');

        // Créer une demande d'échange
        cy.get('[data-cy=assignment-item]').first().rightclick();
        cy.get('[data-cy=context-menu-option]').contains('Proposer un échange').click();
        cy.get('[data-cy=target-user-select]').click();
        cy.get('[data-cy=user-option]').contains(`${this.testData.users.target.firstName} ${this.testData.users.target.lastName}`).click();
        cy.get('[data-cy=swap-message]').type('Cette notification ne devrait pas apparaître');
        cy.get('[data-cy=submit-swap-request]').click();
        cy.wait('@createSwapRequest');

        // Se connecter en tant qu'utilisateur cible
        cy.logout();
        cy.loginByApi(this.testData.users.target.email, this.testData.users.target.password);

        // Vérifier qu'aucune notification n'apparaît
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');
        cy.get('[data-cy=notification-bell]').click();
        cy.get(`[data-cy=notification-item][data-type="${this.testData.notifications.swapRequested.type}"]`)
            .should('not.exist');
    });
}); 