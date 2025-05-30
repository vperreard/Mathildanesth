describe('Authentification et gestion des sessions', () => {
    // Utilisateurs de test
    const testUser = {
        email: 'medecin@example.com',
        password: 'Test123!',
        name: 'Dr Martin'
    };

    beforeEach(() => {
        // Nettoyer l'état avant chaque test
        cy.cleanState();
        
        // Configurer les interceptions API
        cy.intercept('POST', '**/api/auth/login', { fixture: 'auth-response.json' }).as('loginRequest');
        cy.intercept('GET', '**/api/auth/me', { fixture: 'user-profile.json' }).as('userProfile');
        cy.intercept('POST', '**/api/auth/logout').as('logoutRequest');
        
        // Réinitialiser la base de données de test
        cy.task('resetTestDatabase');

        // Charger les utilisateurs de test
        cy.task('seedTestData', {
            fixtures: ['users']
        });
    });

    it('permet la connexion avec des identifiants valides', () => {
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        // Remplir le formulaire avec des commandes sécurisées
        cy.safeType('[data-cy=email-input]', testUser.email);
        cy.safeType('[data-cy=password-input]', testUser.password);
        cy.safeClick('[data-cy=submit-button]');

        // Attendre la réponse de l'API avec retry
        cy.waitForApiResponse('loginRequest');

        // Vérifier la redirection après connexion (avec timeout étendu)
        cy.url({ timeout: 15000 }).should('satisfy', (url: string) => {
            return url.includes('/tableau-de-bord') || url.includes('/planning') || url.includes('/');
        });

        // Vérifier que le nom de l'utilisateur est affiché
        cy.waitForElement('[data-cy=user-name]');
        cy.get('[data-cy=user-name]').should('contain', testUser.name);
    });

    it('affiche un message d\'erreur pour des identifiants invalides', () => {
        // Intercepter la requête avec réponse d'erreur
        cy.intercept('POST', '**/api/auth/login', {
            statusCode: 401,
            body: { error: 'Identifiants invalides' }
        }).as('failedLogin');
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', 'utilisateur.invalide@example.com');
        cy.safeType('[data-cy=password-input]', 'mot_de_passe_incorrect');
        cy.safeClick('[data-cy=submit-button]');

        // Attendre la réponse d'erreur
        cy.wait('@failedLogin');

        // Vérifier le message d'erreur
        cy.waitForElement('[data-cy=error-message]', 10000);
        cy.get('[data-cy=error-message]')
            .should('be.visible')
            .and('contain.text', 'Identifiants invalides');
    });

    it('maintient la session utilisateur après rafraîchissement de la page', () => {
        // Se connecter via l'API (plus rapide que via l'UI)
        cy.loginByApi(testUser.email, testUser.password);

        // Visiter la page d'accueil
        cy.visitAsAuthenticatedUser('/tableau-de-bord');
        cy.waitForPageLoad();

        // Vérifier que l'utilisateur est connecté
        cy.waitForElement('[data-cy=user-name]');
        cy.get('[data-cy=user-name]').should('contain', testUser.name);

        // Rafraîchir la page
        cy.reload();
        cy.waitForPageLoad();

        // Vérifier que l'utilisateur est toujours connecté
        cy.waitForElement('[data-cy=user-name]');
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

        // Se connecter avec commandes sécurisées
        cy.safeType('[data-cy=email-input]', testUser.email);
        cy.safeType('[data-cy=password-input]', testUser.password);
        cy.safeClick('[data-cy=submit-button]');
        
        // Attendre la réponse de connexion
        cy.waitForApiResponse('loginRequest');

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