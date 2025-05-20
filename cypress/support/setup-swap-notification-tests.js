// Script pour configurer l'environnement de test pour les notifications d'échanges d'affectations

/**
 * Prépare les données nécessaires pour tester les notifications d'échanges d'affectations
 */
Cypress.Commands.add('setupAssignmentSwapTests', () => {
    // Charger les fixture data
    cy.fixture('assignment-swap-notifications.json').then((testData) => {
        // S'assurer que les utilisateurs de test existent
        cy.createTestUserIfNeeded(testData.users.initiator);
        cy.createTestUserIfNeeded(testData.users.target);

        // Créer des affectations pour les deux utilisateurs s'ils n'en ont pas
        cy.createTestAssignmentIfNeeded(testData.users.initiator.id, testData.assignments.initiator);
        cy.createTestAssignmentIfNeeded(testData.users.target.id, testData.assignments.target);

        // S'assurer qu'il n'y a pas de demandes d'échange en cours qui pourraient interférer
        cy.deleteAllTestSwapRequests(testData.users.initiator.id, testData.users.target.id);
    });
});

/**
 * Crée un utilisateur de test s'il n'existe pas déjà
 */
Cypress.Commands.add('createTestUserIfNeeded', (userData) => {
    cy.request({
        method: 'POST',
        url: '/api/test/ensure-user-exists', // Endpoint spécial pour les tests
        body: {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: userData.password,
            role: 'USER'
        },
        failOnStatusCode: false // Ne pas échouer si l'utilisateur existe déjà
    });
});

/**
 * Crée une affectation de test si nécessaire
 */
Cypress.Commands.add('createTestAssignmentIfNeeded', (userId, assignmentData) => {
    cy.request({
        method: 'POST',
        url: '/api/test/ensure-assignment-exists', // Endpoint spécial pour les tests
        body: {
            id: assignmentData.id,
            userId: userId,
            date: assignmentData.date,
            type: assignmentData.type,
            salle: assignmentData.salle
        },
        failOnStatusCode: false // Ne pas échouer si l'affectation existe déjà
    });
});

/**
 * Supprime toutes les demandes d'échange de test entre ces utilisateurs
 */
Cypress.Commands.add('deleteAllTestSwapRequests', (initiatorId, targetId) => {
    cy.request({
        method: 'DELETE',
        url: `/api/test/clean-swap-requests?initiatorId=${initiatorId}&targetId=${targetId}`,
        failOnStatusCode: false
    });
}); 