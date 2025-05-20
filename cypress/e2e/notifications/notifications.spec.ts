// Tests E2E pour le système de notifications
describe('Système de notifications', () => {
    beforeEach(() => {
        // Se connecter en tant qu'utilisateur test
        cy.loginByApi('user.test@example.com', 'password123');

        // Intercepter les requêtes API liées aux notifications
        cy.intercept('GET', '**/api/notifications*').as('getNotifications');
        cy.intercept('POST', '**/api/notifications/read').as('markNotificationsAsRead');
        cy.intercept('GET', '**/api/notifications/preferences').as('getNotificationPreferences');
        cy.intercept('PUT', '**/api/notifications/preferences').as('updateNotificationPreferences');

        // Intercepter les WebSocket (simulation)
        cy.intercept('GET', '**/socket.io*').as('socketConnection');
    });

    it('affiche correctement l\'icône de notification dans le header', () => {
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');

        // Vérifier que l'icône de notification est présente
        cy.get('[data-cy=notification-bell]').should('exist');

        // Vérifier le badge avec le nombre de notifications non lues
        cy.get('[data-cy=notification-count]').should('be.visible');
    });

    it('ouvre le panneau de notifications au clic sur l\'icône', () => {
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');

        // Cliquer sur l'icône de notification
        cy.get('[data-cy=notification-bell]').click();

        // Vérifier que le panneau de notifications est ouvert
        cy.get('[data-cy=notification-panel]').should('be.visible');

        // Vérifier que les notifications sont affichées
        cy.get('[data-cy=notification-item]').should('have.length.greaterThan', 0);
    });

    it('marque les notifications comme lues lorsqu\'elles sont visualisées', () => {
        cy.visitAsAuthenticatedUser('/notifications');
        cy.wait('@getNotifications');

        // Attendre que les notifications soient chargées
        cy.get('[data-cy=notification-item]').should('have.length.greaterThan', 0);

        // Cliquer sur une notification non lue
        cy.get('[data-cy=notification-item]:not(.read)').first().click();

        // Vérifier que la requête de marquage comme lu a été envoyée
        cy.wait('@markNotificationsAsRead').its('request.body').should('not.be.empty');

        // Vérifier que la notification a été marquée comme lue visuellement
        cy.get('[data-cy=notification-item].read').should('exist');
    });

    it('navigue vers la page de détails lors du clic sur une notification', () => {
        cy.visitAsAuthenticatedUser('/notifications');
        cy.wait('@getNotifications');

        // Attendre que les notifications soient chargées
        cy.get('[data-cy=notification-item]').should('have.length.greaterThan', 0);

        // Cliquer sur une notification avec lien vers une affectation
        cy.get('[data-cy=notification-item][data-type="ASSIGNMENT_SWAP_REQUEST_RECEIVED"]').first().click();

        // Vérifier que la navigation a bien eu lieu vers la page d'échange d'affectations
        cy.url().should('include', '/planning/echanges');
    });

    it('permet de marquer toutes les notifications comme lues', () => {
        cy.visitAsAuthenticatedUser('/notifications');
        cy.wait('@getNotifications');

        // Cliquer sur le bouton "Tout marquer comme lu"
        cy.get('[data-cy=mark-all-read]').click();

        // Vérifier que la requête de marquage comme lu a été envoyée avec all=true
        cy.wait('@markNotificationsAsRead').its('request.body').should('deep.include', { all: true });

        // Vérifier que toutes les notifications sont marquées comme lues
        cy.get('[data-cy=notification-item]:not(.read)').should('not.exist');
        cy.get('[data-cy=notification-count]').should('contain', '0');
    });

    it('met à jour le nombre de notifications en temps réel', () => {
        cy.visitAsAuthenticatedUser('/');
        cy.wait('@getNotifications');

        // Noter le nombre initial de notifications
        cy.get('[data-cy=notification-count]').invoke('text').then((initialCount) => {
            // Simuler la réception d'une nouvelle notification
            cy.window().then((win) => {
                // Simuler un événement WebSocket
                const wsEvent = new CustomEvent('notification', {
                    detail: {
                        id: 'new-notification-id',
                        type: 'ASSIGNMENT_SWAP_REQUEST_RECEIVED',
                        title: 'Nouvelle demande d\'échange',
                        message: 'Vous avez reçu une nouvelle demande d\'échange d\'affectation',
                        isRead: false,
                        createdAt: new Date().toISOString()
                    }
                });
                win.dispatchEvent(wsEvent);
            });

            // Vérifier que le compteur a été incrémenté
            cy.get('[data-cy=notification-count]').should('not.have.text', initialCount);
        });
    });
});

describe('Préférences de notifications', () => {
    beforeEach(() => {
        // Se connecter en tant qu'utilisateur test
        cy.loginByApi('user.test@example.com', 'password123');

        // Intercepter les requêtes API
        cy.intercept('GET', '**/api/notifications/preferences').as('getNotificationPreferences');
        cy.intercept('PUT', '**/api/notifications/preferences').as('updateNotificationPreferences');
    });

    it('accède à la page de préférences de notifications', () => {
        cy.visitAsAuthenticatedUser('/');

        // Ouvrir le menu utilisateur
        cy.get('[data-cy=user-menu-button]').click();

        // Cliquer sur l'option "Préférences des notifications"
        cy.contains('Préférences des notifications').click();

        // Vérifier que la page de préférences est chargée
        cy.url().should('include', '/profil/notifications');
        cy.get('h1').should('contain', 'Préférences de Notifications');

        // Vérifier que la requête de préférences a été effectuée
        cy.wait('@getNotificationPreferences');
    });

    it('modifie les préférences de notifications', () => {
        cy.visitAsAuthenticatedUser('/profil/notifications');
        cy.wait('@getNotificationPreferences');

        // Activer/désactiver une préférence
        cy.contains('Demandes d\'échange').parent().find('div[role="switch"]').click();

        // Vérifier que la requête de mise à jour a été envoyée
        cy.wait('@updateNotificationPreferences').its('request.body')
            .should('deep.include', { assignmentSwapRequests: false });

        // Vérifier qu'une notification de succès s'affiche
        cy.get('.Toastify__toast--success').should('be.visible');

        // Rafraîchir la page et vérifier que les changements persistent
        cy.reload();
        cy.wait('@getNotificationPreferences');

        // Vérifier que l'état du toggle reflète la préférence enregistrée
        cy.contains('Demandes d\'échange').parent().find('div[role="switch"]')
            .should('have.attr', 'aria-checked', 'false');
    });

    it('gère les périodes de non-dérangement', () => {
        cy.visitAsAuthenticatedUser('/profil/notifications');
        cy.wait('@getNotificationPreferences');

        // Activer les heures calmes
        cy.contains('Activer les heures calmes').parent().find('div[role="switch"]').click();

        // Vérifier que la section d'heures calmes apparaît
        cy.get('input[type="time"]').should('be.visible');

        // Modifier les heures calmes
        cy.get('input[type="time"]').first().clear().type('23:00');
        cy.get('input[type="time"]').last().clear().type('07:00');

        // Sélectionner des jours
        cy.contains('LUN').click();
        cy.contains('MAR').click();

        // Vérifier que les requêtes de mise à jour ont été envoyées
        cy.wait('@updateNotificationPreferences').its('request.body')
            .should('deep.include', { quietHoursEnabled: true });

        cy.wait('@updateNotificationPreferences').its('request.body')
            .should('deep.include', { quietHoursStart: '23:00' });

        cy.wait('@updateNotificationPreferences').its('request.body')
            .should('have.property', 'quietHoursDays').and('include', 'LUN').and('include', 'MAR');
    });

    it('réinitialise toutes les préférences', () => {
        cy.visitAsAuthenticatedUser('/profil/notifications');
        cy.wait('@getNotificationPreferences');

        // Cliquer sur le bouton de réinitialisation
        cy.contains('Réinitialiser').click();

        // Confirmer la réinitialisation
        cy.on('window:confirm', () => true);

        // Vérifier que la requête de réinitialisation a été envoyée
        cy.wait('@updateNotificationPreferences');

        // Vérifier qu'une notification de succès s'affiche
        cy.get('.Toastify__toast--success').should('be.visible')
            .and('contain', 'Préférences réinitialisées avec succès');
    });
}); 