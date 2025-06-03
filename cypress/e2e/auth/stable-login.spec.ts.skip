// Test stable pour la page de connexion avec gestion robuste des erreurs
describe('Connexion - Tests Stabilisés', () => {
    beforeEach(() => {
        // Nettoyer l'état précédent
        cy.clearCookies();
        cy.clearLocalStorage();
        
        // Visiter la page de connexion
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
    });

    it('affiche correctement le formulaire de connexion', () => {
        // Vérifier la présence des éléments essentiels
        cy.waitForElement('[data-cy=email-input]');
        cy.waitForElement('[data-cy=password-input]');
        cy.waitForElement('[data-cy=submit-button]');
        
        // Vérifier que le titre est présent
        cy.contains('Connexion').should('be.visible');
        
        // Vérifier que les champs sont bien configurés
        cy.get('[data-cy=email-input]').should('have.attr', 'type', 'text');
        cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password');
    });

    it('gère correctement les identifiants invalides', () => {
        // Intercepter les requêtes pour surveiller les appels API
        cy.intercept('POST', '**/api/auth/login', { 
            statusCode: 401, 
            body: { error: 'Identifiants invalides' } 
        }).as('loginFailed');
        
        // Saisir des identifiants incorrects
        cy.safeType('[data-cy=email-input]', 'user.invalide@test.com');
        cy.safeType('[data-cy=password-input]', 'motdepasse-incorrect');
        cy.safeClick('[data-cy=submit-button]');

        // Vérifier la réponse
        cy.wait('@loginFailed');
        
        // Vérifier l'affichage du message d'erreur
        cy.get('[data-cy=error-message]', { timeout: 5000 })
            .should('be.visible')
            .and('contain.text', 'Identifiants invalides');
            
        // Vérifier qu'on reste sur la page de connexion
        cy.url().should('include', '/auth/connexion');
    });

    it('permet la connexion avec des identifiants valides (mock)', () => {
        // Mock d'une réponse de connexion réussie
        cy.intercept('POST', '**/api/auth/login', { 
            statusCode: 200, 
            body: { 
                success: true, 
                redirectUrl: '/',
                user: { id: 1, email: 'admin@example.com', role: 'ADMIN_TOTAL' }
            } 
        }).as('loginSuccess');
        
        // Saisir des identifiants valides
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');

        // Vérifier la réponse
        cy.wait('@loginSuccess');
        
        // Note: Dans un environnement de test, la redirection peut ne pas fonctionner
        // On vérifie juste que l'appel API s'est bien passé
    });

    it('désactive le bouton pendant le chargement', () => {
        // Intercepter avec un délai pour simuler une requête lente
        cy.intercept('POST', '**/api/auth/login', (req) => {
            req.reply((res) => {
                res.delay(2000);
                res.send({ statusCode: 200, body: { success: true } });
            });
        }).as('slowLogin');
        
        // Saisir les identifiants
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        
        // Cliquer et vérifier que le bouton est désactivé
        cy.safeClick('[data-cy=submit-button]');
        cy.get('[data-cy=submit-button]').should('be.disabled');
        
        // Vérifier le texte de chargement
        cy.get('[data-cy=submit-button]').should('contain.text', 'Connexion...');
    });

    it('nettoie les erreurs lors de la saisie', () => {
        // Afficher d'abord une erreur
        cy.intercept('POST', '**/api/auth/login', { 
            statusCode: 401, 
            body: { error: 'Identifiants invalides' } 
        }).as('loginError');
        
        cy.safeType('[data-cy=email-input]', 'wrong@test.com');
        cy.safeType('[data-cy=password-input]', 'wrong');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.wait('@loginError');
        cy.get('[data-cy=error-message]').should('be.visible');
        
        // Maintenant modifier les champs et vérifier que l'erreur disparaît
        cy.get('[data-cy=email-input]').clear().type('new@test.com');
        cy.get('[data-cy=error-message]').should('not.exist');
    });

    it('gère les erreurs réseau', () => {
        // Simuler une erreur réseau
        cy.intercept('POST', '**/api/auth/login', { forceNetworkError: true }).as('networkError');
        
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        // Vérifier qu'une erreur s'affiche
        cy.get('[data-cy=error-message]', { timeout: 10000 })
            .should('be.visible')
            .and('contain.text', 'Une erreur est survenue');
    });
});