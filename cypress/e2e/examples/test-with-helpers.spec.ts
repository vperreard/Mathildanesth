/**
 * Exemple de test utilisant les helpers et utilitaires
 * 
 * Ce test montre comment utiliser les helpers et utilitaires pour écrire des tests Cypress plus efficaces.
 * Il peut être utilisé comme modèle pour de nouveaux tests.
 */

// Importer directement les helpers
import * as helpers from '../../support/helpers';

// Pour un véritable test, on définirait les types d'interface appropriés
interface User {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

describe('Exemple de test avec helpers', () => {
    let testUser: User;

    // Avant tous les tests, générer un utilisateur de test avec un email aléatoire
    before(function () {
        // Créer un utilisateur de test avec un email aléatoire
        testUser = {
            email: helpers.randomEmail(),
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User'
        };

        // Faire persister ces données pour tous les tests
        cy.wrap(testUser).as('testUser');

        // Créer l'utilisateur dans le système (appel API simulé)
        cy.log(`Création de l'utilisateur de test: ${testUser.email}`);
    });

    // Avant chaque test, se connecter
    beforeEach(function () {
        // On peut utiliser l'utilisateur stocké dans le contexte de test
        cy.loginByApi(this.testUser.email, this.testUser.password);

        // Intercepter les requêtes API courantes
        cy.intercept('GET', '**/api/users/me').as('getCurrentUser');
        cy.intercept('GET', '**/api/notifications*').as('getNotifications');
    });

    // Test 1: Navigation vers le dashboard
    it('navigue vers le dashboard après connexion', function () {
        // Visiter la page d'accueil
        cy.visitAsAuthenticatedUser('/');

        // Attendre le chargement des données
        cy.wait('@getCurrentUser');
        cy.wait('@getNotifications');

        // Vérifier que nous sommes sur le dashboard
        cy.url().should('include', '/dashboard');

        // Utiliser les helpers pour attendre que les animations soient terminées
        helpers.waitForAnimations();

        // Vérifier que le nom d'utilisateur est affiché
        cy.get('[data-cy=user-name]')
            .should('be.visible')
            .and('contain', this.testUser.firstName);
    });

    // Test 2: Générer et vérifier une date future
    it('génère une date future pour une demande de congés', function () {
        // Générer une date future pour le test
        const startDate = helpers.randomFutureDate(5, 10);
        const endDate = helpers.randomFutureDate(11, 15);

        // Formater les dates
        const formattedStartDate = helpers.formatDate(startDate);
        const formattedEndDate = helpers.formatDate(endDate);

        // Visiter la page de création de congés
        cy.visitAsAuthenticatedUser('/leaves/new');

        // Remplir le formulaire
        cy.get('[data-cy=start-date]').type(formattedStartDate);
        cy.get('[data-cy=end-date]').type(formattedEndDate);
        cy.get('[data-cy=leave-type]').select('Congés payés');

        // Soumettre le formulaire (action simulée pour l'exemple)
        cy.log(`Simulation: Demande de congés du ${formattedStartDate} au ${formattedEndDate}`);

        // Vérifier que les dates sont correctement affichées
        cy.get('[data-cy=start-date]').should('have.value', formattedStartDate);
        cy.get('[data-cy=end-date]').should('have.value', formattedEndDate);
    });

    // Test 3: Attendre que toutes les requêtes réseau soient terminées
    it('attend que toutes les requêtes réseau soient terminées', function () {
        // Visiter une page qui effectue de nombreuses requêtes
        cy.visitAsAuthenticatedUser('/planning');

        // Utiliser notre helper pour attendre que toutes les requêtes soient terminées
        helpers.waitForNetwork().then(() => {
            // Une fois toutes les requêtes terminées, vérifier que la page est chargée
            cy.get('[data-cy=planning-container]').should('be.visible');

            // Vérifier qu'il n'y a pas d'indicateur de chargement
            cy.get('[data-cy=loading-indicator]').should('not.exist');
        });
    });
}); 