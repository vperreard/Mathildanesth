describe('Authentification et gestion des sessions', () => {
    // Utilisateurs de test
    const testUser = {
        email: 'medecin@example.com',
        password: 'Test123!',
        name: 'Dr Martin'
    };

    beforeEach(() => {
    jest.clearAllMocks();
        // Réinitialiser la base de données de test
        cy.task('resetTestDatabase');

        // Charger les utilisateurs de test
        cy.task('seedTestData', {
            fixtures: ['users']
        });
    });

    it('permet la connexion avec des identifiants valides', () => {
        cy.visit('/auth/connexion');
        cy.get('[data-testid=login-email-input]').type(testUser.email);
        cy.get('[data-testid=login-password-input]').type(testUser.password);
        cy.get('[data-testid=login-submit-button]').click();

        // Vérifier la redirection après connexion
        cy.url().should('satisfy', (url: string) => {
            return url.includes('/tableau-de-bord') || url.includes('/planning');
        });

        // Vérifier que le nom de l'utilisateur est affiché
        cy.get('[data-cy=user-name]').should('contain', testUser.name);
    });

    it('affiche un message d\'erreur pour des identifiants invalides', () => {
        cy.visit('/auth/connexion');
        cy.get('[data-testid=login-email-input]').type('utilisateur.invalide@example.com');
        cy.get('[data-testid=login-password-input]').type('mot_de_passe_incorrect');
        cy.get('[data-testid=login-submit-button]').click();

        // Vérifier le message d'erreur
        cy.get('[data-testid=login-error-message]')
            .should('be.visible')
            .and('contain.text', 'Identifiants invalides');
    });

    it('maintient la session utilisateur après rafraîchissement de la page', () => {
        // Se connecter via l'API (plus rapide que via l'UI)
        cy.loginByApi(testUser.email, testUser.password);

        // Visiter la page d'accueil
        cy.visitAsAuthenticatedUser('/tableau-de-bord');

        // Vérifier que l'utilisateur est connecté
        cy.get('[data-cy=user-name]').should('contain', testUser.name);

        // Rafraîchir la page
        cy.reload();

        // Vérifier que l'utilisateur est toujours connecté
        cy.get('[data-cy=user-name]').should('contain', testUser.name);
    });

    it('permet la déconnexion', () => {
        // Se connecter via l'API
        cy.loginByApi(testUser.email, testUser.password);
        cy.visitAsAuthenticatedUser('/tableau-de-bord');

        // Ouvrir le menu utilisateur et cliquer sur déconnexion
        cy.get('[data-cy=user-menu]').click();
        cy.get('[data-cy=logout-option]').click();

        // Vérifier la redirection vers la page de connexion
        cy.url().should('include', '/auth/connexion');

        // Essayer d'accéder à une page protégée
        cy.visit('/tableau-de-bord');

        // Vérifier qu'on est redirigé vers la page de connexion
        cy.url().should('include', '/auth/connexion');
    });

    it('redirige vers la page demandée après connexion', () => {
        // Essayer d'accéder à une page protégée sans être connecté
        cy.visit('/planning');

        // Vérifier qu'on est redirigé vers la page de connexion
        cy.url().should('include', '/auth/connexion');

        // Se connecter
        cy.get('[data-testid=login-email-input]').type(testUser.email);
        cy.get('[data-testid=login-password-input]').type(testUser.password);
        cy.get('[data-testid=login-submit-button]').click();

        // Vérifier qu'on est redirigé vers la page initialement demandée
        cy.url().should('include', '/planning');
    });

    it('permet la récupération de mot de passe', () => {
        cy.visit('/auth/connexion');

        // Cliquer sur le lien "Mot de passe oublié"
        cy.get('[data-cy=forgot-password-link]').click();

        // Vérifier qu'on est sur la page de récupération de mot de passe
        cy.url().should('include', '/auth/reset-password');

        // Saisir l'email et soumettre
        cy.get('[data-cy=email-input]').type(testUser.email);
        cy.get('[data-cy=submit-button]').click();

        // Vérifier le message de confirmation
        cy.get('[data-cy=notification-success]')
            .should('be.visible')
            .and('contain', 'Instructions envoyées');
    });
}); 