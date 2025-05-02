// Test pour la page de connexion
describe('Page de connexion', () => {
    beforeEach(() => {
        // Visiter la page de connexion avant chaque test
        cy.visit('/auth/login');
    });

    it('affiche correctement le formulaire de connexion', () => {
        // Vérifier que les éléments du formulaire sont présents
        cy.get('[data-cy=email-input]').should('be.visible');
        cy.get('[data-cy=password-input]').should('be.visible');
        cy.get('[data-cy=login-button]').should('be.visible');
    });

    it('affiche une erreur pour des identifiants invalides', () => {
        // Tenter une connexion avec des identifiants invalides
        cy.get('[data-cy=email-input]').type('utilisateur.invalide@example.com');
        cy.get('[data-cy=password-input]').type('mot_de_passe_incorrect');
        cy.get('[data-cy=login-button]').click();

        // Vérifier qu'un message d'erreur s'affiche
        cy.get('[data-cy=notification-error]')
            .should('be.visible')
            .and('contain', 'Identifiants invalides');
    });

    it('connecte l\'utilisateur avec des identifiants valides', () => {
        // Intercepter la requête de connexion
        cy.intercept('POST', '**/api/auth/login').as('loginRequest');

        // Connexion avec des identifiants valides (à remplacer par des identifiants de test)
        cy.get('[data-cy=email-input]').type('utilisateur.test@example.com');
        cy.get('[data-cy=password-input]').type('mot_de_passe_test');
        cy.get('[data-cy=login-button]').click();

        // Vérifier que la requête de connexion a été effectuée
        cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

        // Vérifier la redirection vers le tableau de bord ou la page d'accueil
        cy.url().should(url => {
            expect(url).to.satisfy((url: string) => {
                return url.includes('/dashboard') || url.includes('/planning');
            }, 'Devrait être redirigé vers le tableau de bord ou le planning');
        });

        // Vérifier que l'utilisateur est bien connecté
        cy.get('[data-cy=user-menu]').should('be.visible');
    });

    it('permet la navigation vers la page de récupération de mot de passe', () => {
        // Cliquer sur le lien de récupération de mot de passe
        cy.get('[data-cy=forgot-password-link]').click();

        // Vérifier la redirection vers la page de récupération
        cy.url().should('include', '/auth/reset-password');
    });
}); 